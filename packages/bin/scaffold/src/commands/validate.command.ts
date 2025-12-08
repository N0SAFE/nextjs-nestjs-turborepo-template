/**
 * Validate Command
 *
 * Validate configuration files and project setups.
 */
import { Command, CommandRunner, Option } from "nest-commander";
import { LoggerService } from "../modules/io/logger.service";
import { FileSystemService } from "../modules/io/file-system.service";
import { ConfigParserService } from "../modules/config/config-parser.service";
import { ConfigValidatorService } from "../modules/config/config-validator.service";
import { PluginResolverService } from "../modules/plugin/plugin-resolver.service";
import { PluginRegistryService } from "../modules/plugin/plugin-registry.service";
import { SpinnerService } from "../modules/io/spinner.service";

interface ValidateOptions {
  config?: string;
  strict?: boolean;
  json?: boolean;
}

@Command({
  name: "validate",
  description: "Validate a scaffold configuration file",
})
export class ValidateCommand extends CommandRunner {
  constructor(
    private readonly logger: LoggerService,
    private readonly fs: FileSystemService,
    private readonly configParser: ConfigParserService,
    private readonly configValidator: ConfigValidatorService,
    private readonly pluginResolver: PluginResolverService,
    private readonly pluginRegistry: PluginRegistryService,
    private readonly spinner: SpinnerService,
  ) {
    super();
  }

  async run(_passedParams: string[], options: ValidateOptions): Promise<void> {
    const configPath = options.config || "scaffold.config.json";

    this.logger.box("🔍 Validating Configuration", { title: "Validate" });
    this.logger.newline();

    const results: ValidationResults = {
      configFile: { valid: false, errors: [], warnings: [] },
      schema: { valid: false, errors: [], warnings: [] },
      plugins: { valid: false, errors: [], warnings: [] },
      dependencies: { valid: false, errors: [], warnings: [] },
    };

    // Step 1: Check config file exists
    this.spinner.start("Checking configuration file...");
    const exists = await this.fs.exists(configPath);
    if (!exists) {
      this.spinner.fail(`Configuration file not found: ${configPath}`);
      results.configFile.errors.push(`File not found: ${configPath}`);
      this.outputResults(results, options);
      return;
    }
    this.spinner.succeed(`Found configuration file: ${configPath}`);
    results.configFile.valid = true;

    // Step 2: Parse config
    this.spinner.start("Parsing configuration...");
    let config: unknown;
    try {
      const rawConfig = await this.configParser.loadFromFile(configPath);
      config = rawConfig;
      this.spinner.succeed("Configuration parsed successfully");
    } catch (error) {
      this.spinner.fail("Failed to parse configuration");
      results.schema.errors.push(
        `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.outputResults(results, options);
      return;
    }

    // Step 3: Validate schema
    this.spinner.start("Validating schema...");
    const schemaResult = await this.configValidator.validateAsync(config as Record<string, unknown>);
    if (!schemaResult.valid) {
      this.spinner.fail("Schema validation failed");
      for (const error of schemaResult.errors) {
        results.schema.errors.push(error);
      }
      this.outputResults(results, options);
      return;
    }
    this.spinner.succeed("Schema validation passed");
    results.schema.valid = true;

    // Step 4: Resolve config
    this.spinner.start("Resolving configuration...");
    const resolvedConfig = await this.configParser.resolveConfig(
      schemaResult.data as Record<string, unknown>,
    );

    // Step 5: Validate plugins
    this.spinner.start("Validating plugins...");
    const enabledPlugins = this.getEnabledPlugins(resolvedConfig as unknown as Record<string, unknown>);

    for (const pluginId of enabledPlugins) {
      if (!this.pluginRegistry.has(pluginId)) {
        results.plugins.errors.push(`Unknown plugin: ${pluginId}`);
      }
    }

    if (results.plugins.errors.length === 0) {
      this.spinner.succeed("All plugins are valid");
      results.plugins.valid = true;
    } else {
      this.spinner.fail("Some plugins are invalid");
    }

    // Step 6: Check plugin dependencies
    this.spinner.start("Checking plugin dependencies...");
    const resolutionResult = this.pluginResolver.resolve(enabledPlugins);

    if (resolutionResult.missingDependencies.length > 0 || resolutionResult.conflicts.length > 0) {
      for (const missing of resolutionResult.missingDependencies) {
        results.dependencies.errors.push(
          `Plugin '${missing.pluginId}' requires '${missing.dependencyId}'`
        );
      }
      for (const conflict of resolutionResult.conflicts) {
        results.dependencies.errors.push(
          conflict.reason ?? `Plugin '${conflict.pluginId}' conflicts with '${conflict.conflictsWith}'`
        );
      }
      this.spinner.fail("Plugin dependency issues found");
    } else {
      this.spinner.succeed("Plugin dependencies resolved");
      results.dependencies.valid = true;
    }

    // Generate warnings
    const plugins = enabledPlugins
      .filter(id => this.pluginRegistry.has(id))
      .map(id => this.pluginRegistry.get(id));
    const warnings = this.pluginResolver.generateWarnings(plugins);
    if (warnings.length > 0) {
      for (const warning of warnings) {
        results.dependencies.warnings.push(warning);
      }
    }

    // Step 7: Additional strict validations
    if (options.strict) {
      this.spinner.start("Running strict validations...");
      this.runStrictValidations(resolvedConfig as unknown as Record<string, unknown>, results);
      this.spinner.succeed("Strict validations complete");
    }

    this.logger.newline();
    this.outputResults(results, options);
  }

  private getEnabledPlugins(config: Record<string, unknown>): string[] {
    const plugins: string[] = [];
    const pluginConfig = config.plugins as Record<string, unknown> | undefined;

    if (pluginConfig) {
      for (const [key, value] of Object.entries(pluginConfig)) {
        if (value === true || (typeof value === "object" && value !== null)) {
          plugins.push(key);
        }
      }
    }

    return plugins;
  }

  private runStrictValidations(
    config: Record<string, unknown>,
    results: ValidationResults,
  ): void {
    // Check for recommended fields
    if (!config.description) {
      results.schema.warnings.push("Missing recommended field: description");
    }

    if (!config.author) {
      results.schema.warnings.push("Missing recommended field: author");
    }

    if (!config.license) {
      results.schema.warnings.push("Missing recommended field: license");
    }

    // Check port conflicts
    const ports = config.ports as Record<string, number> | undefined;
    if (ports) {
      const usedPorts = new Set<number>();
      for (const [service, port] of Object.entries(ports)) {
        if (usedPorts.has(port)) {
          results.schema.errors.push(`Port conflict: ${port} is used by multiple services`);
        }
        usedPorts.add(port);

        // Check for privileged ports
        if (port < 1024) {
          results.schema.warnings.push(
            `Port ${port} (${service}) is a privileged port and may require elevated permissions`,
          );
        }
      }
    }

    // Check git configuration
    const git = config.git as Record<string, unknown> | undefined;
    if (git?.enabled === false) {
      results.plugins.warnings.push(
        "Git is disabled. Consider enabling for version control.",
      );
    }
  }

  private outputResults(results: ValidationResults, options: ValidateOptions): void {
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    const allValid = Object.values(results).every((r) => r.valid);
    const hasWarnings = Object.values(results).some((r) => r.warnings.length > 0);

    // Summary
    this.logger.header("Validation Results");

    const categories = [
      { key: "configFile", label: "Configuration File" },
      { key: "schema", label: "Schema Validation" },
      { key: "plugins", label: "Plugin Validation" },
      { key: "dependencies", label: "Dependency Resolution" },
    ] as const;

    for (const { key, label } of categories) {
      const result = results[key];
      const status = result.valid
        ? "✅ PASS"
        : result.errors.length > 0
          ? "❌ FAIL"
          : "⚠️ WARN";
      this.logger.info(`${status.padEnd(10)} ${label}`);

      for (const error of result.errors) {
        this.logger.error(`           └─ ${error}`);
      }
      for (const warning of result.warnings) {
        this.logger.warn(`           └─ ${warning}`);
      }
    }

    this.logger.newline();

    if (allValid && !hasWarnings) {
      this.logger.success("Configuration is valid! ✨");
    } else if (allValid && hasWarnings) {
      this.logger.success("Configuration is valid with warnings.");
    } else {
      this.logger.error("Configuration has errors that must be fixed.");
      process.exitCode = 1;
    }
  }

  @Option({
    flags: "-c, --config <path>",
    description: "Path to configuration file (default: scaffold.config.json)",
  })
  parseConfig(val: string): string {
    return val;
  }

  @Option({
    flags: "-s, --strict",
    description: "Enable strict validation mode",
  })
  parseStrict(): boolean {
    return true;
  }

  @Option({
    flags: "--json",
    description: "Output results as JSON",
  })
  parseJson(): boolean {
    return true;
  }
}

interface ValidationCategory {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationResults {
  configFile: ValidationCategory;
  schema: ValidationCategory;
  plugins: ValidationCategory;
  dependencies: ValidationCategory;
}
