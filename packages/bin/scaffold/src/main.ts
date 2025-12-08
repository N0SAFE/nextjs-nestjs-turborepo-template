#!/usr/bin/env node
/**
 * Scaffold CLI - Entry Point
 *
 * This is the main entry point for the scaffold CLI tool.
 * It bootstraps the NestJS application using nest-commander.
 */
import { CommandFactory } from "nest-commander";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  try {
    await CommandFactory.run(AppModule, {
      logger: ["error", "warn"],
      errorHandler: (error: Error) => {
        console.error(`\n❌ Error: ${error.message}\n`);
        if (process.env.DEBUG === "true") {
          console.error(error.stack);
        }
        process.exit(1);
      },
      serviceErrorHandler: (error: Error) => {
        console.error(`\n❌ Service Error: ${error.message}\n`);
        if (process.env.DEBUG === "true") {
          console.error(error.stack);
        }
        process.exit(1);
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Fatal Error: ${error.message}\n`);
      if (process.env.DEBUG === "true") {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

void bootstrap();
