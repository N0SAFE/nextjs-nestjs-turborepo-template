import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { appContract } from '@repo/api-contracts';
import { apiReference } from '@scalar/nestjs-api-reference';
import { generateSpec } from './openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: process.env.NODE_ENV !== 'production',
    bodyParser: false, // Disable NestJS body parser for oRPC
  });
  
  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

  // Serve OpenAPI JSON generated from the oRPC app contract
  const http = app.getHttpAdapter().getInstance();
  http.get('/openapi.json', async (_req: any, res: any) => {
    try {
      const spec = await generateSpec();
      
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(spec));
    } catch (err) {
      // Avoid leaking details in production
      const message = err instanceof Error ? err.message : 'Failed to generate OpenAPI spec';
      res.status(500).send({ error: message });
    }
  });

  // Serve Scalar API Reference UI
  app.use(
    '/reference',
    apiReference({
      // Use the OpenAPI endpoint served above
      url: '/openapi.json',
      // Pick a readable theme; adjust as preferred
      // theme: 'purple',
    }),
  );

  const port = process.env.API_PORT || 3005;
  await app.listen(port);
  console.log(`🚀 NestJS API with oRPC running on port ${port}`);
  console.log(`📘 OpenAPI JSON available at http://localhost:${port}/openapi.json`);
  console.log(`📗 Scalar API Reference at http://localhost:${port}/reference`);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});