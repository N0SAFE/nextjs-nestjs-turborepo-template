/**
 * FileSystemService Tests
 *
 * Tests for the file system service which provides file operations
 * with error handling and path utilities.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FileSystemService } from "../file-system.service";
import { FileSystemError } from "../../../types/errors.types";
import type { FileSpec } from "../../../types/generator.types";

// Mock fs-extra
vi.mock("fs-extra", () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    access: vi.fn(),
    stat: vi.fn(),
    copy: vi.fn(),
    remove: vi.fn(),
    readJson: vi.fn(),
    writeJson: vi.fn(),
    pathExists: vi.fn(),
    chmod: vi.fn(),
  },
  ensureDir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
  copy: vi.fn(),
  remove: vi.fn(),
  readJson: vi.fn(),
  writeJson: vi.fn(),
  pathExists: vi.fn(),
  chmod: vi.fn(),
}));

// Mock glob
vi.mock("glob", () => ({
  glob: vi.fn(),
}));

import * as fs from "fs-extra";
import { glob } from "glob";

describe("FileSystemService", () => {
  let service: FileSystemService;
  
  beforeEach(() => {
    service = new FileSystemService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("ensureDir", () => {
    it("should create directory if it does not exist", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      
      await service.ensureDir("/path/to/dir");
      
      expect(fs.ensureDir).toHaveBeenCalledWith("/path/to/dir");
    });

    it("should throw FileSystemError on failure", async () => {
      vi.mocked(fs.ensureDir).mockRejectedValue(new Error("Permission denied"));
      
      await expect(service.ensureDir("/path/to/dir")).rejects.toThrow(FileSystemError);
      await expect(service.ensureDir("/path/to/dir")).rejects.toThrow("Permission denied");
    });
  });

  describe("writeFile", () => {
    it("should ensure directory exists and write file", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      await service.writeFile("/path/to/file.txt", "content");
      
      expect(fs.ensureDir).toHaveBeenCalledWith("/path/to");
      expect(fs.writeFile).toHaveBeenCalledWith("/path/to/file.txt", "content", "utf-8");
    });

    it("should throw FileSystemError on failure", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockRejectedValue(new Error("Disk full"));
      
      await expect(service.writeFile("/path/to/file.txt", "content")).rejects.toThrow(FileSystemError);
    });
  });

  describe("readFile", () => {
    it("should read file content", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("file content" as unknown as void);
      
      const result = await service.readFile("/path/to/file.txt");
      
      expect(result).toBe("file content");
      expect(fs.readFile).toHaveBeenCalledWith("/path/to/file.txt", "utf-8");
    });

    it("should throw FileSystemError when file not found", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT: no such file"));
      
      await expect(service.readFile("/nonexistent.txt")).rejects.toThrow(FileSystemError);
    });
  });

  describe("exists", () => {
    it("should return true when path exists", async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      
      const result = await service.exists("/path/to/file");
      
      expect(result).toBe(true);
    });

    it("should return false when path does not exist", async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));
      
      const result = await service.exists("/nonexistent");
      
      expect(result).toBe(false);
    });
  });

  describe("isDirectory", () => {
    it("should return true for directories", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
        isFile: () => false,
      } as any);
      
      const result = await service.isDirectory("/path/to/dir");
      
      expect(result).toBe(true);
    });

    it("should return false for files", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      } as any);
      
      const result = await service.isDirectory("/path/to/file.txt");
      
      expect(result).toBe(false);
    });

    it("should return false when path does not exist", async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT"));
      
      const result = await service.isDirectory("/nonexistent");
      
      expect(result).toBe(false);
    });
  });

  describe("isFile", () => {
    it("should return true for files", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => false,
        isFile: () => true,
      } as any);
      
      const result = await service.isFile("/path/to/file.txt");
      
      expect(result).toBe(true);
    });

    it("should return false for directories", async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true,
        isFile: () => false,
      } as any);
      
      const result = await service.isFile("/path/to/dir");
      
      expect(result).toBe(false);
    });
  });

  describe("copy", () => {
    it("should copy files or directories", async () => {
      vi.mocked(fs.copy).mockResolvedValue(undefined);
      
      await service.copy("/src/path", "/dest/path");
      
      expect(fs.copy).toHaveBeenCalledWith("/src/path", "/dest/path");
    });

    it("should throw FileSystemError on failure", async () => {
      vi.mocked(fs.copy).mockRejectedValue(new Error("Copy failed"));
      
      await expect(service.copy("/src", "/dest")).rejects.toThrow(FileSystemError);
    });
  });

  describe("remove", () => {
    it("should remove files or directories", async () => {
      vi.mocked(fs.remove).mockResolvedValue(undefined);
      
      await service.remove("/path/to/remove");
      
      expect(fs.remove).toHaveBeenCalledWith("/path/to/remove");
    });

    it("should throw FileSystemError on failure", async () => {
      vi.mocked(fs.remove).mockRejectedValue(new Error("Cannot remove"));
      
      await expect(service.remove("/protected")).rejects.toThrow(FileSystemError);
    });
  });

  describe("readJson", () => {
    it("should read and parse JSON file", async () => {
      const jsonData = { name: "test", version: "1.0.0" };
      vi.mocked(fs.readJson).mockResolvedValue(jsonData);
      
      const result = await service.readJson<typeof jsonData>("/path/to/package.json");
      
      expect(result).toEqual(jsonData);
    });

    it("should throw FileSystemError on invalid JSON", async () => {
      vi.mocked(fs.readJson).mockRejectedValue(new Error("Unexpected token"));
      
      await expect(service.readJson("/invalid.json")).rejects.toThrow(FileSystemError);
    });
  });

  describe("writeJson", () => {
    it("should write object as JSON with default spacing", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      
      const data = { name: "test" };
      await service.writeJson("/path/to/config.json", data);
      
      expect(fs.writeJson).toHaveBeenCalledWith("/path/to/config.json", data, { spaces: 2 });
    });

    it("should write object as JSON with custom spacing", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined);
      
      const data = { name: "test" };
      await service.writeJson("/path/to/config.json", data, { spaces: 4 });
      
      expect(fs.writeJson).toHaveBeenCalledWith("/path/to/config.json", data, { spaces: 4 });
    });
  });

  describe("glob", () => {
    it("should find files matching pattern", async () => {
      vi.mocked(glob).mockResolvedValue(["file1.ts", "file2.ts"]);
      
      const result = await service.glob("*.ts", { cwd: "/project" });
      
      expect(result).toEqual(["file1.ts", "file2.ts"]);
      expect(glob).toHaveBeenCalledWith("*.ts", {
        cwd: "/project",
        ignore: undefined,
        nodir: true,
      });
    });

    it("should support ignore patterns", async () => {
      vi.mocked(glob).mockResolvedValue(["src/index.ts"]);
      
      await service.glob("**/*.ts", { 
        cwd: "/project", 
        ignore: ["node_modules/**"] 
      });
      
      expect(glob).toHaveBeenCalledWith("**/*.ts", {
        cwd: "/project",
        ignore: ["node_modules/**"],
        nodir: true,
      });
    });

    it("should throw FileSystemError on failure", async () => {
      vi.mocked(glob).mockRejectedValue(new Error("Glob error"));
      
      await expect(service.glob("**/*")).rejects.toThrow(FileSystemError);
    });
  });

  describe("createTempDir", () => {
    it("should create temporary directory with default prefix", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      
      const result = await service.createTempDir();
      
      expect(result).toMatch(/scaffold-\d+$/);
      expect(fs.ensureDir).toHaveBeenCalled();
    });

    it("should create temporary directory with custom prefix", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      
      const result = await service.createTempDir("test");
      
      expect(result).toMatch(/test-\d+$/);
    });
  });

  describe("applyFileSpec", () => {
    it("should create file with content", async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT")); // file doesn't exist
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      const spec: FileSpec = {
        path: "src/index.ts",
        operation: "create",
        content: "export {}",
      };
      
      await service.applyFileSpec(spec, "/project");
      
      expect(fs.writeFile).toHaveBeenCalledWith("/project/src/index.ts", "export {}", "utf-8");
    });

    it("should skip create if file exists and overwrite is false", async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined); // file exists
      
      const spec: FileSpec = {
        path: "existing.ts",
        operation: "create",
        content: "new content",
        overwrite: false,
      };
      
      await service.applyFileSpec(spec, "/project");
      
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it("should create file even if exists when overwrite is true", async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined); // file exists
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      const spec: FileSpec = {
        path: "existing.ts",
        operation: "create",
        content: "new content",
        overwrite: true,
      };
      
      await service.applyFileSpec(spec, "/project");
      
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it("should set file permissions when specified", async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.chmod).mockResolvedValue(undefined);
      
      const spec: FileSpec = {
        path: "script.sh",
        operation: "create",
        content: "#!/bin/bash",
        permissions: 0o755,
      };
      
      await service.applyFileSpec(spec, "/project");
      
      expect(fs.chmod).toHaveBeenCalledWith("/project/script.sh", 0o755);
    });

    it("should modify existing file", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      
      const spec: FileSpec = {
        path: "config.json",
        operation: "modify",
        content: '{"updated": true}',
      };
      
      await service.applyFileSpec(spec, "/project");
      
      expect(fs.writeFile).toHaveBeenCalledWith("/project/config.json", '{"updated": true}', "utf-8");
    });

    it("should delete file", async () => {
      vi.mocked(fs.remove).mockResolvedValue(undefined);
      
      const spec: FileSpec = {
        path: "to-delete.ts",
        operation: "delete",
      };
      
      await service.applyFileSpec(spec, "/project");
      
      expect(fs.remove).toHaveBeenCalledWith("/project/to-delete.ts");
    });

    it("should skip file when operation is skip", async () => {
      const spec: FileSpec = {
        path: "skip-me.ts",
        operation: "skip",
      };
      
      await service.applyFileSpec(spec, "/project");
      
      expect(fs.writeFile).not.toHaveBeenCalled();
      expect(fs.remove).not.toHaveBeenCalled();
    });
  });

  describe("path utilities", () => {
    describe("relative", () => {
      it("should return relative path", () => {
        const result = service.relative("/project/src", "/project/src/components/Button.tsx");
        expect(result).toBe("components/Button.tsx");
      });
    });

    describe("join", () => {
      it("should join path segments", () => {
        const result = service.join("/project", "src", "index.ts");
        expect(result).toBe("/project/src/index.ts");
      });
    });

    describe("resolve", () => {
      it("should resolve to absolute path", () => {
        const result = service.resolve("/project", "src", "../lib");
        expect(result).toContain("/project/lib");
      });
    });

    describe("dirname", () => {
      it("should return directory name", () => {
        const result = service.dirname("/project/src/index.ts");
        expect(result).toBe("/project/src");
      });
    });

    describe("basename", () => {
      it("should return base name", () => {
        const result = service.basename("/project/src/index.ts");
        expect(result).toBe("index.ts");
      });

      it("should remove extension when specified", () => {
        const result = service.basename("/project/src/index.ts", ".ts");
        expect(result).toBe("index");
      });
    });

    describe("extname", () => {
      it("should return file extension", () => {
        const result = service.extname("/project/src/index.ts");
        expect(result).toBe(".ts");
      });

      it("should return empty string for no extension", () => {
        const result = service.extname("/project/Dockerfile");
        expect(result).toBe("");
      });
    });
  });
});
