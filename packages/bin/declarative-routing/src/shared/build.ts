import * as watcher from "@parcel/watcher";
import { Command } from "commander";
import { red } from "kleur/colors";
import path from "path";

import { buildFiles } from "./build-tools";
import { fileRemoved, processFile, finishedProcessing } from "./watch";
import { getConfig, hasConfig, absoluteFilePath } from "../config";

export const build = new Command()
  .name("build")
  .description("initialize your project and install dependencies")
  .option("-w, --watch", "watch files continuously", false)
  .action(async (opts) => {
    if (!hasConfig()) {
      console.log(
        `This project has ${red(
          "NOT been initialized for declarative routing"
        )}.\nInitialize the project first, then run build to update if routes are added or altered.`
      );
      return;
    }

    if (opts.watch) {
      const config = getConfig();
      
      console.log(`👀 Watching for changes in ${config.src}...`);
      
      // Get absolute path of src directory for path conversion
      const srcAbsPath = absoluteFilePath(config, "");
      
      // Subscribe to file system changes
      const subscription = await watcher.subscribe(
        config.src,
        (err: Error | null, events: watcher.Event[]) => {
          if (err) {
            console.error("Watch error:", err);
            return;
          }

          for (const event of events) {
            const posixPath = event.path.replace(/\\/g, "/");
            
            // Convert absolute path to relative path from src directory
            const relativePath = path.relative(srcAbsPath, posixPath).replace(/\\/g, "/");
            
            // Check if it's a route or info file based on mode
            let isRelevant = false;
            switch (config.mode) {
              case "qwikcity":
                isRelevant = /routeInfo\.ts$/.test(relativePath) || 
                            /index\.(jsx|tsx)$/.test(relativePath) ||
                            /index@.*\.(jsx|tsx)$/.test(relativePath);
                break;
              default:
                isRelevant = /(route|page)\.info\.(ts|tsx)$/.test(relativePath) ||
                            /(route|page)\.(js|jsx|ts|tsx)$/.test(relativePath);
                break;
            }

            if (!isRelevant) continue;

            // Handle the event using relative path
            if (event.type === "delete") {
              fileRemoved(relativePath);
            } else if (event.type === "create" || event.type === "update") {
              processFile(relativePath);
            }
          }
        },
        {
          ignore: [
            "**/node_modules/**",
            "**/.git/**",
            "**/.next/**",
            "**/dist/**",
            "**/build/**",
            "**/.turbo/**",
            "**/coverage/**",
            "**/.cache/**",
            "**/tmp/**",
            "**/temp/**",
          ],
        }
      );

      // Initial build before watching
      await buildFiles();
      
      // Mark as ready for real-time updates
      finishedProcessing();

      // Handle cleanup on exit
      process.on("SIGINT", async () => {
        await subscription.unsubscribe();
        process.exit(0);
      });

      process.on("SIGTERM", async () => {
        await subscription.unsubscribe();
        process.exit(0);
      });
    } else {
      await buildFiles();
    }
  });
