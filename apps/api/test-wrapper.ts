import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ModulesContainer } from "@nestjs/core";
import { CLIModule } from "./src/cli/cli.module";
import { STATIC_CONTEXT } from "@nestjs/core/injector/constants";

async function test() {
  console.log("Starting test...");
  
  try {
    const app = await NestFactory.createApplicationContext(CLIModule, { logger: false });
    console.log("App context created");
    
    const container = app.get(ModulesContainer);
    console.log("Got ModulesContainer");
    
    for (const [key, module] of container.entries()) {
      const providers = module.providers;
      for (const [name, wrapper] of providers.entries()) {
        if (name === "SeedCommand" || name === "MigrateCommand") {
          console.log("\n===" + name + "===");
          console.log("scope:", wrapper.scope);
          console.log("metatype:", wrapper.metatype?.name);
          const inst = wrapper.getInstanceByContextId(STATIC_CONTEXT, wrapper.id);
          console.log("instanceHost.instance exists:", !!inst?.instance);
          console.log("instanceHost.isResolved:", inst?.isResolved);
          if (inst?.instance) {
            console.log("instance.databaseService:", !!(inst.instance as any).databaseService);
          }
        }
      }
    }
    
    await app.close();
    console.log("Done");
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
