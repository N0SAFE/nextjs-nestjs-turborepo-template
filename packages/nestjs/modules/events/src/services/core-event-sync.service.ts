import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { EMPTY, Observable, combineLatest, defer, firstValueFrom, from, merge } from "rxjs";
import { filter as rxFilter, map, mergeMap, startWith, tap as rxTap, toArray } from "rxjs/operators";
import type {
    CoreEventStreamDefinition,
    CoreEventStreamListInput,
    CoreSyncedEventEnvelope,
} from "../types/core-event-stream.types";
import type { BaseEventService } from "./base-event.service";
import type { EventContracts, EventInput, EventOutput } from "../contracts/event-contract.builder";
import type { CoreEventStreamRepositoryPort } from "../types/core-event-stream.repository";
import { CORE_EVENT_STREAM_REPOSITORY } from "../events.tokens";

export type CoreEventAdapterEvent = {
    eventName: string;
    payload: unknown;
    replayed?: boolean;
    emittedAt?: string;
};

export type CoreEventAdapterInput = {
    definition: CoreEventStreamDefinition;
    replay: boolean;
    replayLimit: number;
}

export type CoreEventNamespaceAdapter = (
    input: CoreEventAdapterInput,
) => Observable<CoreEventAdapterEvent>;

type ContractsOf<TService extends BaseEventService<any>> =
    TService extends BaseEventService<infer TContracts extends EventContracts> ? TContracts : never;

type EventNamesOf<TService extends BaseEventService<any>> =
    Extract<keyof ContractsOf<TService>, string>;

type EnvelopeForEvent<TName extends string, TPayload> = Omit<
    CoreSyncedEventEnvelope,
    "eventName" | "payload"
> & {
    eventName: TName;
    payload: TPayload;
};

export type ServiceEventEnvelope<TService extends BaseEventService<any>> = {
    [K in EventNamesOf<TService>]: EnvelopeForEvent<K, EventOutput<ContractsOf<TService>[K]>>;
}[EventNamesOf<TService>];

export type NamespaceEventSubscription<
    TService extends BaseEventService<any>,
    K extends EventNamesOf<TService> = EventNamesOf<TService>,
> = {
    eventName: K;
    input: EventInput<ContractsOf<TService>[K]>;
    mapEventName?: string | ((eventName: K) => string);
    mapPayload?: (payload: EventOutput<ContractsOf<TService>[K]>) => unknown;
}

export type RegisterNamespaceEventServiceOptions<TService extends BaseEventService<any>> = {
    resolveSubscriptions?: (
        definition: CoreEventStreamDefinition,
    ) => NamespaceEventSubscription<TService>[];
};

type SelectedServiceEnvelope<
    TService extends BaseEventService<any>,
    K extends EventNamesOf<TService>,
> = EnvelopeForEvent<K, EventOutput<ContractsOf<TService>[K]>> & {
    input: EventInput<ContractsOf<TService>[K]>;
};

type AnyServiceSelection<TService extends BaseEventService<any>> = {
    [K in EventNamesOf<TService>]: ServiceSelectionInput<TService, K>;
}[EventNamesOf<TService>];

type AliasForService<
    TService extends BaseEventService<any>,
    TAlias extends string | undefined,
> = TAlias extends string ? TAlias : TService["namespace"];

export type ServiceSelectionInput<
    TService extends BaseEventService<any>,
    K extends EventNamesOf<TService>,
> = {
    eventName: K;
    input?: EventInput<ContractsOf<TService>[K]>;
    mapEventName?: string | ((eventName: K) => string);
    mapPayload?: (payload: EventOutput<ContractsOf<TService>[K]>) => unknown;
}

export type ServiceQuerySelectInput<
    TService extends BaseEventService<any>,
    K extends EventNamesOf<TService>,
    TAlias extends string | undefined = undefined,
> = {
    alias?: TAlias;
    service: TService;
    eventName: K;
    input?: EventInput<ContractsOf<TService>[K]>;
    mapEventName?: string | ((eventName: K) => string);
    mapPayload?: (payload: EventOutput<ContractsOf<TService>[K]>) => unknown;
}

export type ServiceQuerySelectManyInput<
    TService extends BaseEventService<any>,
    TSelections extends readonly AnyServiceSelection<TService>[],
    TAlias extends string | undefined = undefined,
> = {
    alias?: TAlias;
    service: TService;
    selections: TSelections;
}

export type ServiceQuerySourceInternal = {
    alias: string;
    stream$: Observable<CoreSyncedEventEnvelope>;
};

export class CoreEventServiceQueryBuilder<TRow extends CoreEventQueryRow> {
    private stream$: Observable<TRow>;

    constructor(
        private readonly fromSource: ServiceQuerySourceInternal,
    ) {
        this.stream$ = this.fromSource.stream$.pipe(
            map((event) => ({
                [this.fromSource.alias]: event,
            }) as TRow),
        );
    }

    join<
        TService extends BaseEventService<any>,
        K extends EventNamesOf<TService>,
        TAlias extends string | undefined,
    >(
        input: ServiceQuerySelectInput<TService, K, TAlias> & {
            type?: CoreEventQueryJoinType;
            on: (row: TRow, right: SelectedServiceEnvelope<TService, K>) => boolean;
        },
    ): CoreEventServiceQueryBuilder<
        TRow &
            Record<AliasForService<TService, TAlias>, SelectedServiceEnvelope<TService, K> | null>
    > {
        const alias = (input.alias ?? input.service.namespace) as AliasForService<TService, TAlias>;
        const right$ = selectedServiceObservable(
            input.service,
            input.eventName,
            input.input,
            input.mapEventName,
            input.mapPayload,
        );

        const rightWithLeftSeed$ =
            input.type === "left"
                ? right$.pipe(startWith(null as SelectedServiceEnvelope<TService, K> | null))
                : right$;

        const next$ = combineLatest([this.stream$, rightWithLeftSeed$]).pipe(
            map(([row, right]) => {
                if (right === null) {
                    return {
                        ...row,
                        [alias]: null,
                    } as TRow & Record<AliasForService<TService, TAlias>, SelectedServiceEnvelope<TService, K> | null>;
                }

                if (!input.on(row, right)) {
                    return null;
                }

                return {
                    ...row,
                    [alias]: right,
                } as TRow & Record<AliasForService<TService, TAlias>, SelectedServiceEnvelope<TService, K> | null>;
            }),
            rxFilter(
                (
                    value,
                ): value is TRow & Record<AliasForService<TService, TAlias>, SelectedServiceEnvelope<TService, K> | null> =>
                    value !== null,
            ),
        );

        const builder = this as unknown as CoreEventServiceQueryBuilder<
            TRow &
                Record<AliasForService<TService, TAlias>, SelectedServiceEnvelope<TService, K> | null>
        >;
        builder.stream$ = next$;
        return builder;
    }

    whereFuzzy(query: string): this {
        return this.whereFuzzyBy(query, ["namespace", "eventName", "payload", "input"]);
    }

    where(
        predicate: (row: TRow) => boolean,
    ): this {
        return this.filterRow(predicate);
    }

    filterRow(
        predicate: (row: TRow) => boolean,
    ): this {
        this.stream$ = this.stream$.pipe(
            rxFilter(predicate),
        );
        return this;
    }

    mapRow<TNext extends CoreEventQueryRow>(
        mapper: (row: TRow) => TNext,
    ): CoreEventServiceQueryBuilder<TNext> {
        const builder = this as unknown as CoreEventServiceQueryBuilder<TNext>;
        builder.stream$ = this.stream$.pipe(map(mapper));
        return builder;
    }

    tapRow(
        effect: (row: TRow) => void,
    ): this {
        this.stream$ = this.stream$.pipe(rxTap(effect));
        return this;
    }

    whereInputFuzzy(query: string): this {
        return this.whereFuzzyBy(query, ["input"]);
    }

    wherePayloadFuzzy(query: string): this {
        return this.whereFuzzyBy(query, ["payload"]);
    }

    whereEventNameFuzzy(query: string): this {
        return this.whereFuzzyBy(query, ["eventName"]);
    }

    whereNamespaceFuzzy(query: string): this {
        return this.whereFuzzyBy(query, ["namespace"]);
    }

    whereInput(
        predicate: (input: InputInRow<TRow>, envelope: EnvelopeInRow<TRow>) => boolean,
    ): this {
        this.stream$ = this.stream$.pipe(
            rxFilter((row) =>
                this.rowEnvelopes(row).some((envelope) => {
                    if (!hasInputValue(envelope)) {
                        return false;
                    }
                    return predicate(envelope.input as InputInRow<TRow>, envelope);
                }),
            ),
        );
        return this;
    }

    wherePayload(
        predicate: (payload: PayloadInRow<TRow>, envelope: EnvelopeInRow<TRow>) => boolean,
    ): this {
        this.stream$ = this.stream$.pipe(
            rxFilter((row) =>
                this.rowEnvelopes(row).some((envelope) =>
                    predicate(envelope.payload as PayloadInRow<TRow>, envelope),
                ),
            ),
        );
        return this;
    }

    whereEventName(
        predicate: (eventName: EventNameInRow<TRow>, envelope: EnvelopeInRow<TRow>) => boolean,
    ): this {
        this.stream$ = this.stream$.pipe(
            rxFilter((row) =>
                this.rowEnvelopes(row).some((envelope) =>
                    predicate(envelope.eventName as EventNameInRow<TRow>, envelope),
                ),
            ),
        );
        return this;
    }

    whereNamespace(
        predicate: (namespace: NamespaceInRow<TRow>, envelope: EnvelopeInRow<TRow>) => boolean,
    ): this {
        this.stream$ = this.stream$.pipe(
            rxFilter((row) =>
                this.rowEnvelopes(row).some((envelope) =>
                    predicate(envelope.namespace as NamespaceInRow<TRow>, envelope),
                ),
            ),
        );
        return this;
    }

    private whereFuzzyBy(query: string, fields: FuzzyField[]): this {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return this;
        }

        this.stream$ = this.stream$.pipe(
            rxFilter((row) => buildFuzzyHaystack(row, fields).includes(normalized)),
        );
        return this;
    }

    private rowEnvelopes(row: TRow): EnvelopeInRow<TRow>[] {
        return Object.values(row).filter((value): value is EnvelopeInRow<TRow> => value !== null);
    }

    execute(): Observable<TRow> {
        return this.stream$;
    }
}

type FluentSelectOptions<TService extends BaseEventService<any>, K extends EventNamesOf<TService>> = {
    mapEventName?: string | ((eventName: string) => string);
    mapPayload?: (payload: EventOutput<ContractsOf<TService>[K]>) => unknown;
}

export type CoreEventQueryJoinType = "inner" | "left";

export type CoreEventQueryNamespaceInput = {
    namespace: string;
    alias?: string;
    name?: string;
    description?: string | null;
    scope?: CoreEventStreamDefinition["scope"];
    scopeId?: string | null;
    filters?: Record<string, unknown> | null;
    isActive?: boolean;
    replayDefault?: boolean;
    replayLimitDefault?: number;
}

export type CoreEventQueryRow = Record<string, CoreSyncedEventEnvelope | null>;

type EnvelopeInRow<TRow extends CoreEventQueryRow> = Exclude<TRow[keyof TRow], null>;
type InputInRow<TRow extends CoreEventQueryRow> = EnvelopeInRow<TRow> extends { input: infer TInput }
    ? TInput
    : never;
type PayloadInRow<TRow extends CoreEventQueryRow> = EnvelopeInRow<TRow>["payload"];
type EventNameInRow<TRow extends CoreEventQueryRow> = EnvelopeInRow<TRow>["eventName"];
type NamespaceInRow<TRow extends CoreEventQueryRow> = EnvelopeInRow<TRow>["namespace"];

export type CoreEventQueryJoinInput<
    TRow extends CoreEventQueryRow,
    TRight extends CoreSyncedEventEnvelope,
    TAlias extends string = string,
> = CoreEventQueryNamespaceInput & {
    alias?: TAlias;
    type?: CoreEventQueryJoinType;
    on: (row: TRow, right: TRight) => boolean;
}

type CoreEventQueryJoinInternal = CoreEventQueryJoinInput<
    CoreEventQueryRow,
    CoreSyncedEventEnvelope
>;

export class CoreEventSyncQueryBuilder<TRow extends CoreEventQueryRow = CoreEventQueryRow> {
    private readonly joins: CoreEventQueryJoinInternal[] = [];
    private replayEnabled = true;
    private replayLimitValue?: number;

    constructor(
        private readonly service: CoreEventSyncService,
        private readonly fromSource: CoreEventQueryNamespaceInput,
    ) {}

    join<TRight extends CoreSyncedEventEnvelope, TAlias extends string = string>(
        input: CoreEventQueryJoinInput<TRow, TRight, TAlias>,
    ): CoreEventSyncQueryBuilder<TRow & Record<TAlias, TRight | null>> {
        this.joins.push(input as unknown as CoreEventQueryJoinInternal);
        return this as unknown as CoreEventSyncQueryBuilder<TRow & Record<TAlias, TRight | null>>;
    }

    replay(value: boolean): this {
        this.replayEnabled = value;
        return this;
    }

    replayLimit(limit: number): this {
        this.replayLimitValue = limit;
        return this;
    }

    execute(): Observable<TRow> {
        return defer(() => from(this.resolveRows())).pipe(
            mergeMap((rows) => from(rows)),
        );
    }

    private async resolveRows(): Promise<TRow[]> {
        const fromAlias = this.fromSource.alias ?? this.fromSource.namespace;
        const baseEvents = await this.service.collectNamespaceEvents(
            this.fromSource,
            this.replayEnabled,
            this.replayLimitValue,
        );

        let rows: CoreEventQueryRow[] = baseEvents.map((event) => ({
            [fromAlias]: event,
        }));

        for (const join of this.joins) {
            const joinAlias = join.alias ?? join.namespace;
            const rightEvents = await this.service.collectNamespaceEvents(
                join,
                this.replayEnabled,
                this.replayLimitValue,
            );

            const nextRows: CoreEventQueryRow[] = [];

            for (const row of rows) {
                const matches = rightEvents.filter((right) => join.on(row, right));

                if (matches.length === 0) {
                    if ((join.type ?? "inner") === "left") {
                        nextRows.push({
                            ...row,
                            [joinAlias]: null,
                        });
                    }
                    continue;
                }

                for (const match of matches) {
                    nextRows.push({
                        ...row,
                        [joinAlias]: match,
                    });
                }
            }

            rows = nextRows;
        }

        return rows as TRow[];
    }
}

export class CoreEventNamespaceBuilder<TService extends BaseEventService<any> | null = null> {
    private adapter?: CoreEventNamespaceAdapter;
    private eventService?: BaseEventService<any>;
    private resolver?: (definition: CoreEventStreamDefinition) => NamespaceEventSubscription<any>[];
    private staticSelections: NamespaceEventSubscription<any>[] = [];

    constructor(
        private readonly service: CoreEventSyncService,
        private readonly namespaceValue: string,
    ) {}

    fromAdapter(adapter: CoreEventNamespaceAdapter): this {
        this.adapter = adapter;
        return this;
    }

    fromEventService<T extends BaseEventService<any>>(eventService: T): CoreEventNamespaceBuilder<T> {
        this.eventService = eventService;
        return this as unknown as CoreEventNamespaceBuilder<T>;
    }

    select<K extends EventNamesOf<NonNullable<TService>>>(
        this: CoreEventNamespaceBuilder<NonNullable<TService>>,
        eventName: K,
        input: EventInput<ContractsOf<NonNullable<TService>>[K]>,
        options?: FluentSelectOptions<NonNullable<TService>, K>,
    ): CoreEventNamespaceBuilder<NonNullable<TService>> {
        this.staticSelections.push({
            eventName,
            input,
            mapEventName: options?.mapEventName,
            mapPayload: options?.mapPayload,
        });
        return this;
    }

    usingResolver<T extends BaseEventService<any>>(
        this: CoreEventNamespaceBuilder<T>,
        resolver: (definition: CoreEventStreamDefinition) => NamespaceEventSubscription<T>[],
    ): CoreEventNamespaceBuilder<T> {
        this.resolver = resolver as unknown as (
            definition: CoreEventStreamDefinition,
        ) => NamespaceEventSubscription<any>[];
        return this;
    }

    register(): void {
        if (this.adapter) {
            this.service.registerNamespaceAdapter(this.namespaceValue, this.adapter);
            return;
        }

        if (!this.eventService) {
            throw new BadRequestException(
                `No adapter or event service configured for namespace '${this.namespaceValue}'`,
            );
        }

        this.service.registerNamespaceEventService(this.namespaceValue, this.eventService, {
            resolveSubscriptions: (definition) => {
                if (this.resolver) {
                    return this.resolver(definition);
                }

                if (this.staticSelections.length > 0) {
                    return this.staticSelections;
                }

                return defaultSubscriptionsFromFilters(definition);
            },
        });
    }
}

@Injectable()
export class CoreEventSyncService {
    private readonly namespaceAdapters = new Map<string, CoreEventNamespaceAdapter>();

    constructor(
        @Optional()
        @Inject(CORE_EVENT_STREAM_REPOSITORY)
        private readonly repository?: CoreEventStreamRepositoryPort,
    ) {}

    registerNamespaceAdapter(namespace: string, adapter: CoreEventNamespaceAdapter): void {
        this.namespaceAdapters.set(namespace, adapter);
    }

    namespace(namespace: string): CoreEventNamespaceBuilder {
        return new CoreEventNamespaceBuilder(this, namespace);
    }

    registerNamespaceEventService<TService extends BaseEventService<any>>(
        namespace: string,
        eventService: TService,
        options?: RegisterNamespaceEventServiceOptions<TService>,
    ): void {
        const adapter: CoreEventNamespaceAdapter = ({ definition }) => {
            const subscriptions =
                options?.resolveSubscriptions?.(definition) ??
                defaultSubscriptionsFromFilters<TService>(definition);

            if (subscriptions.length === 0) {
                return EMPTY;
            }

            const streams = subscriptions.map((selection) =>
                eventService
                    .subscribe$(
                        selection.eventName,
                        selection.input as never,
                    )
                    .pipe(
                        map((value) => {
                            const eventName =
                                typeof selection.mapEventName === "function"
                                    ? selection.mapEventName(selection.eventName)
                                    : (selection.mapEventName ?? selection.eventName);

                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            const payload = selection.mapPayload
                                ? selection.mapPayload(value as never)
                                : value;

                            return {
                        eventName,
                        payload,
                        replayed: false,
                        emittedAt: new Date().toISOString(),
                            } satisfies CoreEventAdapterEvent;
                        }),
                    ),
            );

            return merge(...streams);
        };

        this.namespaceAdapters.set(namespace, adapter);
    }

    query(from: CoreEventQueryNamespaceInput): CoreEventSyncQueryBuilder {
        return new CoreEventSyncQueryBuilder(this, from);
    }

    select<
        TService extends BaseEventService<any>,
        K extends EventNamesOf<TService>,
        TAlias extends string | undefined = undefined,
    >(
        input: ServiceQuerySelectInput<TService, K, TAlias>,
    ): CoreEventServiceQueryBuilder<
        Record<AliasForService<TService, TAlias>, SelectedServiceEnvelope<TService, K>>
    > {
        const alias = (input.alias ?? input.service.namespace) as AliasForService<TService, TAlias>;
        return new CoreEventServiceQueryBuilder<
            Record<AliasForService<TService, TAlias>, SelectedServiceEnvelope<TService, K>>
        >(
            {
                alias,
                stream$: selectedServiceObservable(
                    input.service,
                    input.eventName,
                    input.input,
                    input.mapEventName,
                    input.mapPayload,
                ),
            },
        );
    }

    selectMany<
        TService extends BaseEventService<any>,
        TSelections extends readonly AnyServiceSelection<TService>[],
        TAlias extends string | undefined = undefined,
    >(
        input: ServiceQuerySelectManyInput<TService, TSelections, TAlias>,
    ): CoreEventServiceQueryBuilder<
        Record<
            AliasForService<TService, TAlias>,
            SelectedServiceEnvelope<TService, TSelections[number]["eventName"]>
        >
    > {
        const alias = (input.alias ?? input.service.namespace) as AliasForService<TService, TAlias>;
        const sources = input.selections.map((selection) =>
            selectedServiceObservable(
                input.service,
                selection.eventName,
                selection.input,
                selection.mapEventName,
                selection.mapPayload,
            ),
        );

        return new CoreEventServiceQueryBuilder<
            Record<
                AliasForService<TService, TAlias>,
                SelectedServiceEnvelope<TService, TSelections[number]["eventName"]>
            >
        >({
            alias,
            stream$: merge(...sources),
        });
    }

    queryFromService<TService extends BaseEventService<any>, TAlias extends string>(input: {
        namespace: string;
        service: TService;
        alias: TAlias;
        name?: string;
        description?: string | null;
        scope?: CoreEventStreamDefinition["scope"];
        scopeId?: string | null;
        filters?: Record<string, unknown> | null;
        isActive?: boolean;
        replayDefault?: boolean;
        replayLimitDefault?: number;
    }): CoreEventSyncQueryBuilder<Record<TAlias, ServiceEventEnvelope<TService>>> {
        const source: CoreEventQueryNamespaceInput = {
            namespace: input.namespace,
            alias: input.alias,
            name: input.name,
            description: input.description,
            scope: input.scope,
            scopeId: input.scopeId,
            filters: input.filters,
            isActive: input.isActive,
            replayDefault: input.replayDefault,
            replayLimitDefault: input.replayLimitDefault,
        };
        return new CoreEventSyncQueryBuilder<Record<TAlias, ServiceEventEnvelope<TService>>>(
            this,
            source,
        );
    }

    async listStreams(input: CoreEventStreamListInput) {
        if (!this.repository) {
            throw new BadRequestException(
                "No CoreEventStreamRepository provider configured. Provide CORE_EVENT_STREAM_REPOSITORY in your app module.",
            );
        }
        return this.repository.findMany(input);
    }

    async getStreamById(id: string): Promise<CoreEventStreamDefinition> {
        if (!this.repository) {
            throw new BadRequestException(
                "No CoreEventStreamRepository provider configured. Provide CORE_EVENT_STREAM_REPOSITORY in your app module.",
            );
        }
        const definition = await this.repository.findById(id);
        if (!definition) {
            throw new NotFoundException(`Core event stream definition with id '${id}' not found`);
        }
        return definition;
    }

    streamSync(input: {
        id: string;
        replay: boolean;
        replayLimit?: number;
    }): Observable<CoreSyncedEventEnvelope> {
        return defer(() => from(this.getStreamById(input.id))).pipe(
            mergeMap((definition) => {
                if (!definition.isActive) {
                    throw new BadRequestException(`Core event stream '${definition.id}' is inactive`);
                }

                const adapter = this.namespaceAdapters.get(definition.namespace);
                if (!adapter) {
                    throw new BadRequestException(
                        `No core event namespace adapter registered for '${definition.namespace}'`,
                    );
                }

                const replayLimit = input.replayLimit ?? 1;
                const source = adapter({
                    definition,
                    replay: input.replay,
                    replayLimit,
                });

                return this.withEnvelope(definition, source);
            }),
        );
    }

    async collectNamespaceEvents(
        source: CoreEventQueryNamespaceInput,
        replay: boolean,
        replayLimit?: number,
    ): Promise<CoreSyncedEventEnvelope[]> {
        const adapter = this.namespaceAdapters.get(source.namespace);
        if (!adapter) {
            throw new BadRequestException(
                `No core event namespace adapter registered for '${source.namespace}'`,
            );
        }

        const definition = this.toVirtualDefinition(source);
        const effectiveReplayLimit = replayLimit ?? 1;
        const stream = adapter({
            definition,
            replay,
            replayLimit: effectiveReplayLimit,
        });

        return firstValueFrom(
            this.withEnvelope(definition, stream).pipe(toArray()),
        );
    }

    private toVirtualDefinition(source: CoreEventQueryNamespaceInput): CoreEventStreamDefinition {
        const now = new Date().toISOString();
        return {
            id: randomUUID(),
            name: source.name ?? `${source.namespace}-query-stream`,
            namespace: source.namespace,
            description: source.description ?? null,
            isActive: source.isActive ?? true,
            scope: source.scope ?? "global",
            scopeId: source.scopeId ?? null,
            filters: source.filters ?? null,
            replayDefault: source.replayDefault ?? true,
            replayLimitDefault: source.replayLimitDefault ?? 1,
            createdBy: null,
            createdAt: now,
            updatedAt: now,
        };
    }

    private withEnvelope(
        definition: CoreEventStreamDefinition,
        source: Observable<CoreEventAdapterEvent>,
    ): Observable<CoreSyncedEventEnvelope> {
        return defer(() => {
            let sequence = 0;

            return source.pipe(
                map((event) => {
                    sequence += 1;

                    return {
                        streamId: definition.id,
                        namespace: definition.namespace,
                        eventName: event.eventName,
                        payload: event.payload,
                        sequence,
                        replayed: event.replayed,
                        emittedAt: event.emittedAt ?? new Date().toISOString(),
                    } satisfies CoreSyncedEventEnvelope;
                }),
            );
        });
    }
}

function selectedServiceObservable<
    TService extends BaseEventService<any>,
    K extends EventNamesOf<TService>,
>(
    service: TService,
    eventName: K,
    input: EventInput<ContractsOf<TService>[K]> | undefined,
    mapEventName?: string | ((eventName: K) => string),
    mapPayload?: (payload: EventOutput<ContractsOf<TService>[K]>) => unknown,
): Observable<SelectedServiceEnvelope<TService, K>> {
    type SelectedSourceValue = {
        input: EventInput<ContractsOf<TService>[K]>;
        output: EventOutput<ContractsOf<TService>[K]>;
    }

    const source$: Observable<SelectedSourceValue> = input === undefined
        ? service.subscribeAny$(eventName).pipe(
            map((value: SelectedSourceValue): SelectedSourceValue => ({
                input: value.input,
                output: value.output,
            })),
        )
        : service.subscribe$(eventName, input).pipe(
            map((value: EventOutput<ContractsOf<TService>[K]>): SelectedSourceValue => ({
                input,
                output: value,
            })),
        );

    return source$.pipe(
        map((value, index) => {
            const resolvedEventName =
                typeof mapEventName === "function" ? mapEventName(eventName) : (mapEventName ?? eventName);
            const payload = mapPayload ? mapPayload(value.output) : value.output;

            return {
                streamId: randomUUID(),
                namespace: service.namespace,
                eventName: resolvedEventName as K,
                payload,
                input: value.input,
                sequence: index + 1,
                replayed: false,
                emittedAt: new Date().toISOString(),
            } as SelectedServiceEnvelope<TService, K>;
        }),
    );
}

function hasInputValue(
    envelope: CoreSyncedEventEnvelope,
): envelope is CoreSyncedEventEnvelope & { input: unknown } {
    return "input" in envelope;
}

type FuzzyField = "namespace" | "eventName" | "payload" | "input";

function buildFuzzyHaystack(row: CoreEventQueryRow, fields: FuzzyField[]): string {
    return Object.values(row)
        .filter((value): value is CoreSyncedEventEnvelope => value !== null)
        .map((value) => {
            const inputValue = (value as { input?: unknown }).input;
            const parts: string[] = [];
            if (fields.includes("namespace")) {
                parts.push(value.namespace);
            }
            if (fields.includes("eventName")) {
                parts.push(value.eventName);
            }
            if (fields.includes("payload")) {
                parts.push(JSON.stringify(value.payload ?? {}));
            }
            if (fields.includes("input")) {
                parts.push(JSON.stringify(inputValue ?? {}));
            }
            return parts.join(" ");
        })
        .join(" ")
        .toLowerCase();
}

function defaultSubscriptionsFromFilters<TService extends BaseEventService<any>>(
    definition: CoreEventStreamDefinition,
): NamespaceEventSubscription<TService>[] {
    const filters = definition.filters ?? {};
    const eventName = filters.eventName;
    const input = filters.input;

    if (typeof eventName !== "string" || typeof input !== "object" || input === null) {
        throw new BadRequestException(
            "Core stream filters must include 'eventName' (string) and 'input' (object) when using registerNamespaceEventService without a custom resolver",
        );
    }

    return [
        {
            eventName: eventName as EventNamesOf<TService>,
            input: input as EventInput<ContractsOf<TService>[EventNamesOf<TService>]>,
        },
    ];
}
