/**
 * Dependency Service
 *
 * Handles package manager operations for dependency installation.
 */
import { Injectable } from "@nestjs/common";
import { CommandExecutorService } from "./command-executor.service";
import { LoggerService } from "../io/logger.service";
import type { PackageManager } from "../../types/config.types";
import type { DependencySpec } from "../../types/generator.types";

export interface InstallOptions {
  /** Working directory */
  cwd: string;
  /** Package manager to use */
  packageManager?: PackageManager;
  /** Install only production dependencies */
  production?: boolean;
  /** Frozen lockfile mode */
  frozen?: boolean;
}

export interface AddDependencyOptions {
  /** Working directory */
  cwd: string;
  /** Package manager to use */
  packageManager?: PackageManager;
}

@Injectable()
export class DependencyService {
  private readonly defaultPackageManager: PackageManager = "bun";

  constructor(
    private readonly executor: CommandExecutorService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Install all dependencies
   */
  async install(options: InstallOptions): Promise<void> {
    const pm = options.packageManager ?? this.defaultPackageManager;
    const args = this.getInstallArgs(pm, options);

    await this.executor.run(pm, args, { cwd: options.cwd });
  }

  /**
   * Add dependencies to a project
   */
  async add(
    dependencies: DependencySpec[],
    options: AddDependencyOptions,
  ): Promise<void> {
    const pm = options.packageManager ?? this.defaultPackageManager;

    // Group by type
    const prodDeps = dependencies.filter((d) => d.type === "prod");
    const devDeps = dependencies.filter((d) => d.type === "dev");
    const peerDeps = dependencies.filter((d) => d.type === "peer");

    // Install production dependencies
    if (prodDeps.length > 0) {
      const packages = prodDeps.map((d) => `${d.name}@${d.version}`);
      await this.executor.run(pm, [...this.getAddArgs(pm, "prod"), ...packages], {
        cwd: options.cwd,
      });
    }

    // Install dev dependencies
    if (devDeps.length > 0) {
      const packages = devDeps.map((d) => `${d.name}@${d.version}`);
      await this.executor.run(pm, [...this.getAddArgs(pm, "dev"), ...packages], {
        cwd: options.cwd,
      });
    }

    // Install peer dependencies
    if (peerDeps.length > 0) {
      const packages = peerDeps.map((d) => `${d.name}@${d.version}`);
      await this.executor.run(pm, [...this.getAddArgs(pm, "peer"), ...packages], {
        cwd: options.cwd,
      });
    }
  }

  /**
   * Remove dependencies from a project
   */
  async remove(
    packageNames: string[],
    options: AddDependencyOptions,
  ): Promise<void> {
    const pm = options.packageManager ?? this.defaultPackageManager;
    const args = this.getRemoveArgs(pm);

    await this.executor.run(pm, [...args, ...packageNames], { cwd: options.cwd });
  }

  /**
   * Check if dependencies are installed
   */
  async checkInstalled(cwd: string): Promise<boolean> {
    const { FileSystemService } = await import("../io/file-system.service");
    const fs = new FileSystemService();
    const nodeModulesPath = fs.join(cwd, "node_modules");
    return fs.exists(nodeModulesPath);
  }

  /**
   * Get package manager version
   */
  async getVersion(pm: PackageManager = this.defaultPackageManager): Promise<string | null> {
    try {
      const result = await this.executor.run(pm, ["--version"], {
        silent: true,
      });
      return result.trim();
    } catch {
      return null;
    }
  }

  /**
   * Check if a package manager is available
   */
  async isAvailable(pm: PackageManager): Promise<boolean> {
    const version = await this.getVersion(pm);
    return version !== null;
  }

  /**
   * Get the best available package manager
   */
  async detectPackageManager(): Promise<PackageManager> {
    // Check in order of preference
    const managers: PackageManager[] = ["bun", "pnpm", "yarn", "npm"];

    for (const pm of managers) {
      if (await this.isAvailable(pm)) {
        return pm;
      }
    }

    return "npm"; // Fallback to npm
  }

  /**
   * Get install command arguments
   */
  private getInstallArgs(pm: PackageManager, options: InstallOptions): string[] {
    switch (pm) {
      case "npm":
        return [
          "install",
          ...(options.production ? ["--omit=dev"] : []),
          ...(options.frozen ? ["--ci"] : []),
        ];
      case "yarn":
        return [
          "install",
          ...(options.production ? ["--production"] : []),
          ...(options.frozen ? ["--frozen-lockfile"] : []),
        ];
      case "pnpm":
        return [
          "install",
          ...(options.production ? ["--prod"] : []),
          ...(options.frozen ? ["--frozen-lockfile"] : []),
        ];
      case "bun":
        return [
          "install",
          ...(options.production ? ["--production"] : []),
          ...(options.frozen ? ["--frozen-lockfile"] : []),
        ];
    }
  }

  /**
   * Get add command arguments
   */
  private getAddArgs(
    pm: PackageManager,
    type: "prod" | "dev" | "peer",
  ): string[] {
    switch (pm) {
      case "npm":
        return [
          "install",
          ...(type === "dev" ? ["--save-dev"] : []),
          ...(type === "peer" ? ["--save-peer"] : []),
        ];
      case "yarn":
        return [
          "add",
          ...(type === "dev" ? ["--dev"] : []),
          ...(type === "peer" ? ["--peer"] : []),
        ];
      case "pnpm":
        return [
          "add",
          ...(type === "dev" ? ["--save-dev"] : []),
          ...(type === "peer" ? ["--save-peer"] : []),
        ];
      case "bun":
        return [
          "add",
          ...(type === "dev" ? ["--dev"] : []),
          // Bun doesn't have peer flag, handled in package.json directly
        ];
    }
  }

  /**
   * Get remove command arguments
   */
  private getRemoveArgs(pm: PackageManager): string[] {
    switch (pm) {
      case "npm":
        return ["uninstall"];
      case "yarn":
        return ["remove"];
      case "pnpm":
        return ["remove"];
      case "bun":
        return ["remove"];
    }
  }
}
