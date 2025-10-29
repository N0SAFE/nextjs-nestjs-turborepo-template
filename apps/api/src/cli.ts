import { CommandFactory } from "nest-commander";
import { CLIModule } from "./cli/cli.module";

async function bootstrap() {
    await CommandFactory.run(CLIModule, {
        logger: ["error", "warn"],
        errorHandler: (err: unknown) => {
            // Don't show error for help command exit
            if (err && typeof err === "object" && "code" in err && typeof err.code === "string" && err.code === "commander.helpDisplayed") {
                process.exit(0);
            }
            console.error("CLI Error:", err);
            process.exit(1);
        },
    });
}

await bootstrap();
