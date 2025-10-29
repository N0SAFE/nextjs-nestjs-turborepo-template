import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { apiReference } from "@scalar/nestjs-api-reference";
import { FlubErrorHandler } from "nestjs-flub";
import { generateSpec } from "./openapi";
import { AuthService } from "./core/modules/auth/services/auth.service";
import { isErrorResult, merge } from "openapi-merge";
import type {Express} from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: process.env.NODE_ENV !== "production",
    bodyParser: false, // Disable NestJS body parser for oRPC
  });

  const authService = app.get<AuthService>(AuthService);

  app.useGlobalFilters(new FlubErrorHandler());
  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000",
    credentials: true,
  });

  app.useLogger(["log", "error", "warn", "debug", "verbose"]);

  // Serve OpenAPI JSON generated from the oRPC app contract
  const http = app.getHttpAdapter().getInstance() as Express
   
  http.get("/openapi.json", async (_req, res) => {
    try {
      const mergeResult = merge([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { oas: (await generateSpec()) as any },
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          oas: (await authService.api.generateOpenAPISchema({})) as any,
          pathModification: { prepend: "/api/auth" },
        },
      ]);

      if (isErrorResult(mergeResult)) {
        throw new Error(
          `Failed to merge OpenAPI specs: ${mergeResult.message} (${mergeResult.type})}`
        );
      }

      const spec = mergeResult.output;

      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(spec));
    } catch (err) {
      // Avoid leaking details in production
      const message =
        err instanceof Error ? err.message : "Failed to generate OpenAPI spec";
      res.status(500).send({ error: message });
    }
  });

  // Serve Scalar API Reference UI
  app.use(
    "/reference",
    apiReference({
      // Use the OpenAPI endpoint served above
      url: "/openapi.json",
      // Pick a readable theme; adjust as preferred
      // theme: 'purple',
    })
  );

  const port = process.env.API_PORT ?? 3005;
  await app.listen(port);
  console.log(`🚀 NestJS API with oRPC running on port ${String(port)}`);
  console.log(
    `📘 OpenAPI JSON available at http://localhost:${String(port)}/openapi.json`
  );
  console.log(`📗 Scalar API Reference at http://localhost:${String(port)}/reference`);
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start the application:", error);
  process.exit(1);
});
