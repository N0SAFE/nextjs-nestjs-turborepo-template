/**
 * File System Service
 *
 * Provides file system operations with error handling and path utilities.
 */
import { Injectable } from "@nestjs/common";
import * as fs from "fs-extra";
import * as path from "node:path";
import { glob } from "glob";
import { FileSystemError } from "../../types/errors.types";
import type { FileSpec } from "../../types/generator.types";

@Injectable()
export class FileSystemService {
  /**
   * Ensure a directory exists, creating it if necessary
   */
  async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.ensureDir(dirPath);
    } catch (error) {
      throw new FileSystemError(
        "ensureDir",
        dirPath,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Write content to a file, creating directories as needed
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, "utf-8");
    } catch (error) {
      throw new FileSystemError(
        "writeFile",
        filePath,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Read content from a file
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      throw new FileSystemError(
        "readFile",
        filePath,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Check if a path exists
   */
  async exists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a path is a directory
   */
  async isDirectory(targetPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(targetPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if a path is a file
   */
  async isFile(targetPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(targetPath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Copy a file or directory
   */
  async copy(src: string, dest: string): Promise<void> {
    try {
      await fs.copy(src, dest);
    } catch (error) {
      throw new FileSystemError(
        "copy",
        `${src} -> ${dest}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Remove a file or directory
   */
  async remove(targetPath: string): Promise<void> {
    try {
      await fs.remove(targetPath);
    } catch (error) {
      throw new FileSystemError(
        "remove",
        targetPath,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Read and parse a JSON file
   */
  async readJson<T = unknown>(filePath: string): Promise<T> {
    try {
      return await fs.readJson(filePath);
    } catch (error) {
      throw new FileSystemError(
        "readJson",
        filePath,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Write an object to a JSON file
   */
  async writeJson(
    filePath: string,
    data: unknown,
    options?: { spaces?: number },
  ): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeJson(filePath, data, { spaces: options?.spaces ?? 2 });
    } catch (error) {
      throw new FileSystemError(
        "writeJson",
        filePath,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Find files matching a glob pattern
   */
  async glob(
    pattern: string,
    options?: { cwd?: string; ignore?: string[] },
  ): Promise<string[]> {
    try {
      return await glob(pattern, {
        cwd: options?.cwd,
        ignore: options?.ignore,
        nodir: true,
      });
    } catch (error) {
      throw new FileSystemError(
        "glob",
        pattern,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Create a temporary directory
   */
  async createTempDir(prefix?: string): Promise<string> {
    try {
      const tmpDir = path.join(
        process.env.TMPDIR || "/tmp",
        `${prefix ?? "scaffold"}-${Date.now()}`,
      );
      await fs.ensureDir(tmpDir);
      return tmpDir;
    } catch (error) {
      throw new FileSystemError(
        "createTempDir",
        prefix ?? "scaffold",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Apply a file specification (create, modify, delete)
   */
  async applyFileSpec(spec: FileSpec, basePath: string): Promise<void> {
    const fullPath = path.join(basePath, spec.path);

    switch (spec.operation) {
      case "create":
        if (!spec.overwrite && (await this.exists(fullPath))) {
          return; // Skip if exists and overwrite is false
        }
        await this.writeFile(fullPath, spec.content ?? "");
        if (spec.permissions) {
          await fs.chmod(fullPath, spec.permissions);
        }
        break;

      case "modify":
        await this.writeFile(fullPath, spec.content ?? "");
        break;

      case "delete":
        await this.remove(fullPath);
        break;

      case "skip":
        // Do nothing
        break;
    }
  }

  /**
   * Get relative path from base to target
   */
  relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Join path segments
   */
  join(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Resolve to absolute path
   */
  resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Get directory name of a path
   */
  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Get base name of a path
   */
  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * Get file extension
   */
  extname(filePath: string): string {
    return path.extname(filePath);
  }
}
