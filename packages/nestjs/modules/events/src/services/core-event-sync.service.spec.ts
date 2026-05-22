/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import z from "zod/v4";
import { firstValueFrom, from } from "rxjs";
import { map as rxMap, take, toArray } from "rxjs/operators";
import { BaseEventService } from "./base-event.service";
import { contractBuilder } from "../contracts/event-contract.builder";
import { CoreEventSyncService } from "./core-event-sync.service";

const typedContracts = {
    statusChanged: contractBuilder()
        .input(z.object({ deploymentId: z.string() }))
        .output(z.object({ deploymentId: z.string(), status: z.enum(["success", "failed"]) }))
        .build(),
    logAppended: contractBuilder()
        .input(z.object({ deploymentId: z.string() }))
        .output(z.object({ deploymentId: z.string(), message: z.string() }))
        .build(),
} as const;

class TypedDeploymentEventService extends BaseEventService<typeof typedContracts, "deployment"> {
    constructor() {
        super("deployment", typedContracts);
    }

    protected buildEventKey(
        _eventName: string,
        input: Record<string, unknown>,
    ): string {
        return String(input.deploymentId);
    }
}

const dxContracts = {
    dual: contractBuilder()
        .input(z.object({ inputTag: z.string() }))
        .output(z.object({ payloadTag: z.string() }))
        .build(),
} as const;

class DxEventService extends BaseEventService<typeof dxContracts, "dx"> {
    constructor() {
        super("dx", dxContracts);
    }

    protected buildEventKey(
        _eventName: string,
        input: Record<string, unknown>,
    ): string {
        return String(input.inputTag);
    }
}

describe("CoreEventSyncService", () => {
    let service: CoreEventSyncService;
    let repository: {
        findMany: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };

    const definition = {
        id: "00000000-0000-0000-0000-000000000001",
        name: "deployments-sync",
        namespace: "deployment",
        description: null,
        isActive: true,
        scope: "global" as const,
        scopeId: null,
        filters: null,
        replayDefault: true,
        replayLimitDefault: 100,
        createdBy: "user-1",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
    };

    beforeEach(() => {
        repository = {
            findMany: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };

        service = new CoreEventSyncService(repository as never);
    });

    it("should list streams via repository", async () => {
        repository.findMany.mockResolvedValue({ data: [definition], meta: { total: 1, limit: 20, offset: 0, hasMore: false } });
        const result = await service.listStreams({ limit: 20, offset: 0 } as never);
        expect(result.data).toHaveLength(1);
    });

    it("should throw when stream is missing", async () => {
        repository.findById.mockResolvedValue(null);
        await expect(service.getStreamById("missing")).rejects.toThrow(NotFoundException);
    });

    it("should stream sync envelopes from registered adapter", async () => {
        repository.findById.mockResolvedValue(definition);

        service
            .namespace("deployment")
            .fromAdapter(() => {
                return from([
                    { eventName: "statusChanged", payload: { deploymentId: "d-1" }, replayed: true },
                ]);
            })
            .register();

        const stream$ = service.streamSync({
            id: definition.id,
            replay: true,
            replayLimit: 10,
        });

        const first = await firstValueFrom(stream$.pipe(take(1)));

        expect(first).toMatchObject({
            streamId: definition.id,
            namespace: "deployment",
            eventName: "statusChanged",
            sequence: 1,
            replayed: true,
        });
    });

    it("should default stream sync replayLimit to 1 when omitted", async () => {
        repository.findById.mockResolvedValue(definition);

        let capturedReplayLimit: number | undefined;

        service
            .namespace("deployment")
            .fromAdapter(({ replayLimit }) => {
                capturedReplayLimit = replayLimit;
                return from([
                    { eventName: "statusChanged", payload: { deploymentId: "d-1" }, replayed: true },
                ]);
            })
            .register();

        const stream$ = service.streamSync({
            id: definition.id,
            replay: true,
        });

        await firstValueFrom(stream$.pipe(take(1)));

        expect(capturedReplayLimit).toBe(1);
    });

    it("should support fluent namespace query with inner join", async () => {
        service.registerNamespaceAdapter("deployment", () => {
            return from([
                {
                    eventName: "deployment.updated",
                    payload: { deploymentId: "dep-1", status: "success" },
                    replayed: true,
                },
                {
                    eventName: "deployment.updated",
                    payload: { deploymentId: "dep-2", status: "failed" },
                    replayed: true,
                },
            ]);
        });

        service.registerNamespaceAdapter("traefik", () => {
            return from([
                {
                    eventName: "route.synced",
                    payload: { deploymentId: "dep-1", host: "app.example.com" },
                    replayed: true,
                },
            ]);
        });

        const rows = await firstValueFrom(
            service
                .query({ namespace: "deployment", alias: "d" })
                .join({
                    namespace: "traefik",
                    alias: "t",
                    type: "inner",
                    on: (row, right) => {
                        const left = row.d;
                        if (!left) return false;
                        return (
                            (left.payload as { deploymentId?: string }).deploymentId ===
                            (right.payload as { deploymentId?: string }).deploymentId
                        );
                    },
                })
                .replay(true)
                .replayLimit(20)
                .execute()
                .pipe(toArray()),
        );

        expect(rows).toHaveLength(1);
        expect(rows[0]?.d?.namespace).toBe("deployment");
        expect(rows[0]?.t?.namespace).toBe("traefik");
        expect((rows[0]?.d?.payload as { deploymentId?: string }).deploymentId).toBe("dep-1");
        expect((rows[0]?.t?.payload as { deploymentId?: string }).deploymentId).toBe("dep-1");
    });

    it("should support fluent namespace query with left join", async () => {
        service.registerNamespaceAdapter("deployment", () => {
            return from([
                {
                    eventName: "deployment.updated",
                    payload: { deploymentId: "dep-1" },
                    replayed: true,
                },
                {
                    eventName: "deployment.updated",
                    payload: { deploymentId: "dep-2" },
                    replayed: true,
                },
            ]);
        });

        service.registerNamespaceAdapter("traefik", () => {
            return from([
                {
                    eventName: "route.synced",
                    payload: { deploymentId: "dep-1" },
                    replayed: true,
                },
            ]);
        });

        const rows = await firstValueFrom(
            service
                .query({ namespace: "deployment", alias: "d" })
                .join({
                    namespace: "traefik",
                    alias: "t",
                    type: "left",
                    on: (row, right) => {
                        const left = row.d;
                        if (!left) return false;
                        return (
                            (left.payload as { deploymentId?: string }).deploymentId ===
                            (right.payload as { deploymentId?: string }).deploymentId
                        );
                    },
                })
                .execute()
                .pipe(toArray()),
        );

        expect(rows).toHaveLength(2);
        const matched = rows.find(
            (row) => (row.d?.payload as { deploymentId?: string }).deploymentId === "dep-1",
        );
        const unmatched = rows.find(
            (row) => (row.d?.payload as { deploymentId?: string }).deploymentId === "dep-2",
        );

        expect(matched?.t).not.toBeNull();
        expect(unmatched?.t).toBeNull();
    });

    it("should infer contracts from BaseEventService for namespace registration", async () => {
        repository.findById.mockResolvedValue(definition);

        const typedService = new TypedDeploymentEventService();
        service
            .namespace("deployment")
            .fromEventService(typedService)
            .select("statusChanged", { deploymentId: "dep-typed-1" })
            .register();

        const stream$ = service.streamSync({
            id: definition.id,
            replay: false,
        });

        const pending = firstValueFrom(stream$.pipe(take(1)));

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-typed-1" },
            { deploymentId: "dep-typed-1", status: "success" },
        );

        const first = await pending;
        expect(first).toMatchObject({
            namespace: "deployment",
            eventName: "statusChanged",
            payload: { deploymentId: "dep-typed-1", status: "success" },
        });
    });

    it("should support typed fluent select/join/query without registration", async () => {
        const deploymentEvents = new TypedDeploymentEventService();
        const routeEvents = new TypedDeploymentEventService();

        const rowsPromise = firstValueFrom(
            service
                .select({
                    service: deploymentEvents,
                    eventName: "statusChanged",
                    input: { deploymentId: "dep-q-1" },
                })
                .join({
                    alias: "r",
                    service: routeEvents,
                    eventName: "logAppended",
                    input: { deploymentId: "dep-q-1" },
                    type: "inner",
                    on: (row, right) => {
                        return row.deployment.payload.deploymentId === right.payload.deploymentId;
                    },
                })
                .execute()
                .pipe(take(1)),
        );

        setTimeout(() => {
            deploymentEvents.emit(
                "statusChanged",
                { deploymentId: "dep-q-1" },
                { deploymentId: "dep-q-1", status: "success" },
            );
            routeEvents.emit(
                "logAppended",
                { deploymentId: "dep-q-1" },
                { deploymentId: "dep-q-1", message: "route synced" },
            );
        }, 0);

        const row = await rowsPromise;
        expect(row.deployment.payload.status).toBe("success");
        expect(row.r?.payload.message).toBe("route synced");
        expect(row.deployment.namespace).toBe("deployment");
    });

    it("should expose Observable from fluent query execute", async () => {
        const typedService = new TypedDeploymentEventService();

        const result$ = service.select({
            service: typedService,
            eventName: "statusChanged",
            input: { deploymentId: "dep-obs-1" },
        }).execute();

        const pending = firstValueFrom(result$.pipe(take(1)));

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-obs-1" },
            { deploymentId: "dep-obs-1", status: "success" },
        );

        const row = await pending;
        expect(row.deployment.payload.status).toBe("success");
    });

    it("should support multi-event selectMany + fuzzy query in same fluent API", async () => {
        const typedService = new TypedDeploymentEventService();

        const logPending = firstValueFrom(
            service
                .selectMany({
                    service: typedService,
                    selections: [
                        {
                            eventName: "statusChanged",
                            input: { deploymentId: "dep-fuzzy-1" },
                        },
                        {
                            eventName: "logAppended",
                            input: { deploymentId: "dep-fuzzy-1" },
                        },
                    ] as const,
                })
                .whereFuzzy("route synced")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-fuzzy-1" },
            { deploymentId: "dep-fuzzy-1", status: "success" },
        );
        typedService.emit(
            "logAppended",
            { deploymentId: "dep-fuzzy-1" },
            { deploymentId: "dep-fuzzy-1", message: "route synced" },
        );

        const row = await logPending;
        expect(row.deployment.eventName).toBe("logAppended");
        expect((row.deployment.payload as { message?: string }).message).toBe("route synced");
    });

    it("should allow fuzzy search on selection input", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "statusChanged",
                    input: { deploymentId: "dep-input-fuzzy-42" },
                })
                .whereFuzzy("dep-input-fuzzy-42")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-input-fuzzy-42" },
            { deploymentId: "dep-input-fuzzy-42", status: "failed" },
        );

        const row = await pending;
        expect(row.deployment.eventName).toBe("statusChanged");
        expect(row.deployment.payload.status).toBe("failed");
    });

    it("should support case-insensitive whereFuzzy matching", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "logAppended",
                    input: { deploymentId: "dep-case-1" },
                })
                .whereFuzzy("ROUTE SYNCED")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "logAppended",
            { deploymentId: "dep-case-1" },
            { deploymentId: "dep-case-1", message: "route synced" },
        );

        const row = await pending;
        expect(row.deployment.payload.message).toBe("route synced");
    });

    it("should keep stream unchanged when whereFuzzy query is blank", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "statusChanged",
                    input: { deploymentId: "dep-blank-1" },
                })
                .whereFuzzy("   ")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-blank-1" },
            { deploymentId: "dep-blank-1", status: "success" },
        );

        const row = await pending;
        expect(row.deployment.payload.status).toBe("success");
    });

    it("should filter specifically on payload with wherePayloadFuzzy", async () => {
        const dxService = new DxEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: dxService,
                    eventName: "dual",
                    input: { inputTag: "input-only-needle" },
                })
                .wherePayloadFuzzy("payload-target")
                .execute()
                .pipe(take(1)),
        );

        dxService.emit("dual", { inputTag: "input-only-needle" }, { payloadTag: "not-this" });
        dxService.emit("dual", { inputTag: "input-only-needle" }, { payloadTag: "payload-target" });

        const row = await pending;
        expect(row.dx.payload.payloadTag).toBe("payload-target");
    });

    it("should filter specifically on input with whereInputFuzzy", async () => {
        const dxService = new DxEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: dxService,
                    eventName: "dual",
                    input: { inputTag: "needle-input" },
                })
                .whereInputFuzzy("needle-input")
                .execute()
                .pipe(take(1)),
        );

        dxService.emit("dual", { inputTag: "needle-input" }, { payloadTag: "anything" });

        const row = await pending;
        expect(row.dx.payload.payloadTag).toBe("anything");
    });

    it("should filter specifically on mapped event name with whereEventNameFuzzy", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "logAppended",
                    input: { deploymentId: "dep-name-1" },
                    mapEventName: "deployment.log.custom",
                })
                .whereEventNameFuzzy("log.custom")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "logAppended",
            { deploymentId: "dep-name-1" },
            { deploymentId: "dep-name-1", message: "named" },
        );

        const row = await pending;
        expect(row.deployment.eventName).toBe("deployment.log.custom");
    });

    it("should filter specifically on namespace with whereNamespaceFuzzy", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "statusChanged",
                    input: { deploymentId: "dep-ns-1" },
                })
                .whereNamespaceFuzzy("deploy")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-ns-1" },
            { deploymentId: "dep-ns-1", status: "success" },
        );

        const row = await pending;
        expect(row.deployment.namespace).toBe("deployment");
    });

    it("should support selectMany with explicit alias in the fluent API", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .selectMany({
                    alias: "evt",
                    service: typedService,
                    selections: [
                        {
                            eventName: "statusChanged",
                            input: { deploymentId: "dep-many-alias-1" },
                        },
                        {
                            eventName: "logAppended",
                            input: { deploymentId: "dep-many-alias-1" },
                        },
                    ] as const,
                })
                .whereEventNameFuzzy("logAppended")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-many-alias-1" },
            { deploymentId: "dep-many-alias-1", status: "success" },
        );
        typedService.emit(
            "logAppended",
            { deploymentId: "dep-many-alias-1" },
            { deploymentId: "dep-many-alias-1", message: "joined" },
        );

        const row = await pending;
        expect(row.evt.eventName).toBe("logAppended");
        expect((row.evt.payload as { message?: string }).message).toBe("joined");
    });

    it("should allow select without input and match via fuzzy on emitted input", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "statusChanged",
                })
                .whereInputFuzzy("dep-optional-1")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-optional-1" },
            { deploymentId: "dep-optional-1", status: "success" },
        );

        const row = await pending;
        expect(row.deployment.payload.status).toBe("success");
        expect(row.deployment.input.deploymentId).toBe("dep-optional-1");
    });

    it("should allow selectMany without input and receive both event types", async () => {
        const typedService = new TypedDeploymentEventService();

        const statusPending = firstValueFrom(
            service
                .selectMany({
                    service: typedService,
                    selections: [
                        { eventName: "statusChanged" },
                        { eventName: "logAppended" },
                    ] as const,
                })
                .whereEventName((eventName) => eventName === "statusChanged")
                .execute()
                .pipe(take(1)),
        );

        const logPending = firstValueFrom(
            service
                .selectMany({
                    service: typedService,
                    selections: [
                        { eventName: "statusChanged" },
                        { eventName: "logAppended" },
                    ] as const,
                })
                .whereEventName((eventName) => eventName === "logAppended")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-many-opt-1" },
            { deploymentId: "dep-many-opt-1", status: "failed" },
        );
        typedService.emit(
            "logAppended",
            { deploymentId: "dep-many-opt-1" },
            { deploymentId: "dep-many-opt-1", message: "multi-any" },
        );

        const statusRow = await statusPending;
        const logRow = await logPending;

        expect(statusRow.deployment.eventName).toBe("statusChanged");
        if (statusRow.deployment.eventName === "statusChanged") {
            expect((statusRow.deployment.payload as { status?: string }).status).toBe("failed");
        } else {
            throw new Error("Expected statusChanged event for statusRow");
        }
        expect(logRow.deployment.eventName).toBe("logAppended");
        expect((logRow.deployment.payload as { message?: string }).message).toBe("multi-any");
    });

    it("should support typed wherePayload callback helper", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "statusChanged",
                    input: { deploymentId: "dep-pred-payload-1" },
                })
                .wherePayload((payload) => {
                    return (payload as { status?: string }).status === "success";
                })
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-pred-payload-1" },
            { deploymentId: "dep-pred-payload-1", status: "failed" },
        );
        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-pred-payload-1" },
            { deploymentId: "dep-pred-payload-1", status: "success" },
        );

        const row = await pending;
        expect(row.deployment.payload.status).toBe("success");
    });

    it("should support typed whereInput callback helper", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "logAppended",
                })
                .whereInput((input) => {
                    return (input as { deploymentId?: string }).deploymentId === "dep-pred-input-2";
                })
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "logAppended",
            { deploymentId: "dep-pred-input-1" },
            { deploymentId: "dep-pred-input-1", message: "skip" },
        );
        typedService.emit(
            "logAppended",
            { deploymentId: "dep-pred-input-2" },
            { deploymentId: "dep-pred-input-2", message: "match" },
        );

        const row = await pending;
        expect((row.deployment.payload as { message?: string }).message).toBe("match");
    });

    it("should support row-level callback helpers filterRow and mapRow", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "statusChanged",
                })
                .filterRow((row) => row.deployment.eventName === "statusChanged")
                .mapRow((row) => ({
                    deployment: row.deployment,
                    mirror: row.deployment,
                }))
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-row-callback-1" },
            { deploymentId: "dep-row-callback-1", status: "success" },
        );

        const row = await pending;
        expect(row.mirror.payload.status).toBe("success");
    });

    it("should support where alias callback helper", async () => {
        const typedService = new TypedDeploymentEventService();

        const pending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "statusChanged",
                })
                .where((row) => row.deployment.eventName === "statusChanged")
                .execute()
                .pipe(take(1)),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-where-1" },
            { deploymentId: "dep-where-1", status: "failed" },
        );

        const row = await pending;
        expect(row.deployment.payload.status).toBe("failed");
    });

    it("should allow post-build RxJS pipeline handling", async () => {
        const typedService = new TypedDeploymentEventService();

        const statusPending = firstValueFrom(
            service
                .select({
                    service: typedService,
                    eventName: "statusChanged",
                })
                .execute()
                .pipe(
                    rxMap((row) => row.deployment.payload.status),
                    take(1),
                ),
        );

        typedService.emit(
            "statusChanged",
            { deploymentId: "dep-rxjs-1" },
            { deploymentId: "dep-rxjs-1", status: "success" },
        );

        const status = await statusPending;
        expect(status).toBe("success");
    });
});
