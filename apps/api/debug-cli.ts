import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { CLIModule } from "./src/cli/cli.module";
import { DATABASE_SERVICE } from "./src/cli/tokens";
import { DatabaseService } from "./src/core/modules/database/services/database.service";
import { SeedCommand } from "./src/cli/commands/seed.command";

async function test() {
  console.log("Creating app context...");
  const app = await NestFactory.createApplicationContext(CLIModule, {
    logger: ["error", "warn"],
  });
  
  console.log("App context created");
  
  try {
    const dbServiceByToken = app.get(DATABASE_SERVICE);
    console.log("DatabaseService by token:", !!dbServiceByToken, dbServiceByToken?.constructor?.name);
  } catch (e: any) {
    console.log("DatabaseService by token ERROR:", e.message);
  }
  
  try {
    const dbServiceByClass = app.get(DatabaseService);
    console.log("DatabaseService by class:", !!dbServiceByClass, dbServiceByClass?.constructor?.name);
  } catch (e: any) {
    console.log("DatabaseService by class ERROR:", e.message);
  }

  try {
    // Use resolve() for scoped providers
    const seedCommand = await app.resolve(SeedCommand);
    console.log("SeedCommand resolved via resolve():", !!seedCommand);
    console.log("SeedCommand.databaseService:", !!(seedCommand as any).databaseService);
    console.log("SeedCommand.authService:", !!(seedCommand as any).authService);
    console.log("SeedCommand.configService:", !!(seedCommand as any).configService);
    
    if ((seedCommand as any).databaseService) {
      console.log("databaseService type:", (seedCommand as any).databaseService.constructor?.name);
    }
  } catch (e: any) {
    console.log("SeedCommand ERROR:", e.message);
    console.error(e);
  }
  
  await app.close();
}

test().catch(console.error);
