import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { apiReference } from "@scalar/nestjs-api-reference";
import { generateSpec } from "./openapi";
import { AuthService } from "./core/modules/auth/services/auth.service";
import { isErrorResult, merge } from "openapi-merge";
import type {Express} from 'express';
import { buildAllowedOrigins, normalizeUrl, isLocalhostOrigin } from "./core/utils/cors.utils";
import { logger } from "@repo/logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: process.env.NODE_ENV !== "production",
    bodyParser: false, // Disable NestJS body parser for oRPC
  });

  const authService = await app.resolve<AuthService>(AuthService);

  // Build list of allowed origins for CORS
  // @ts-expect-error - process.env typing
  const allowedOrigins = buildAllowedOrigins(process.env);

  // Enable CORS with flexible origin matching
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Normalize the incoming origin
      const normalizedOrigin = normalizeUrl(origin);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      
      // In development, be more permissive with localhost
      if (process.env.NODE_ENV !== 'production' && isLocalhostOrigin(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      
      // Reject the origin
      logger.warn(`CORS: Rejected origin: ${origin}`);
      logger.warn(`CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
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
          oas: (await authService.generateAuthOpenAPISchema()) as any,
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
  logger.info(`🚀 NestJS API with oRPC running on port ${String(port)}`);
  logger.info(
    `📘 OpenAPI JSON available at http://localhost:${String(port)}/openapi.json`
  );
  logger.info(`📗 Scalar API Reference at http://localhost:${String(port)}/reference`);
}

bootstrap().catch((error: unknown) => {
  logger.error("Failed to start the application", { error });
  process.exit(1);
});
