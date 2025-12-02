import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { apiReference } from "@scalar/nestjs-api-reference";
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

  // Normalize URL by removing trailing slash
  const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

  // Build list of allowed origins for CORS
  const allowedOrigins: string[] = [];
  
  // Add configured app URL (public facing URL)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    allowedOrigins.push(normalizeUrl(appUrl));
  }
  
  // Add internal app URL (Docker network URL) if different
  const internalAppUrl = process.env.APP_URL;
  if (internalAppUrl && internalAppUrl !== appUrl) {
    allowedOrigins.push(normalizeUrl(internalAppUrl));
  }
  
  // Add additional trusted origins
  const trustedOrigins = process.env.TRUSTED_ORIGINS;
  if (trustedOrigins) {
    trustedOrigins.split(',').forEach(origin => {
      const trimmed = origin.trim();
      if (trimmed) {
        allowedOrigins.push(normalizeUrl(trimmed));
      }
    });
  }
  
  // Fallback to localhost:3000 if no origins configured
  if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:3000');
  }

  // Enable CORS with flexible origin matching
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      
      // Normalize the incoming origin
      const normalizedOrigin = normalizeUrl(origin);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      
      // In development, be more permissive with localhost
      if (process.env.NODE_ENV !== 'production') {
        const localhostPattern = /^https?:\/\/localhost(:\d+)?$/;
        const ipPattern = /^https?:\/\/127\.0\.0\.1(:\d+)?$/;
        if (localhostPattern.test(normalizedOrigin) || ipPattern.test(normalizedOrigin)) {
          return callback(null, true);
        }
      }
      
      // Reject the origin
      console.warn(`CORS: Rejected origin: ${origin}`);
      console.warn(`CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
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
