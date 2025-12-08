/**
 * Remove Command Tests
 *
 * Tests for the scaffold remove command functionality.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RemoveCommand } from "../remove.command";
import * as fs from "fs";

// Mock fs module
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn(),
  unlinkSync: vi.fn(),
  rmdirSync: vi.fn(),
  rmSync: vi.fn(),
  readdirSync: vi.fn(),
}));

// Mock path.parse to return proper root
vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...actual,
    parse: vi.fn().mockReturnValue({ root: "/" }),
  };
});

describe("RemoveCommand", () => {
  let command: RemoveCommand;

  // Mock implementations
  const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    box: vi.fn(),
    header: vi.fn(),
    keyValue: vi.fn(),
    newline: vi.fn(),
    debug: vi.fn(),
  };

  const mockSpinner = {
    start: vi.fn(),
    stop: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  };

  const mockPrompt = {
    confirm: vi.fn(),
    select: vi.fn(),
    text: vi.fn(),
    multiselect: vi.fn(),
  };

  const mockFileSystem = {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    exists: vi.fn(),
    remove: vi.fn(),
    copy: vi.fn(),
  };

  const mockPluginRegistry = {
    get: vi.fn(),
    getAll: vi.fn(),
    getByCategory: vi.fn(),
    has: vi.fn(),
    register: vi.fn(),
  };

  const mockPluginResolver = {
    resolveDependencies: vi.fn(),
    checkConflicts: vi.fn(),
    resolveOrder: vi.fn(),
  };

  const mockGeneratorCollection = {
    getGeneratorByPluginId: vi.fn(),
    getAllGenerators: vi.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset process.exit mock
    vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    // Directly instantiate command with mocks
    command = new RemoveCommand(
      mockLogger as any,
      mockSpinner as any,
      mockPrompt as any,
      mockFileSystem as any,
      mockPluginRegistry as any,
      mockPluginResolver as any,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("run", () => {
    it("should error if no plugin ID is provided", async () => {
      await expect(command.run([], {})).rejects.toThrow("process.exit called");
      
      expect(mockLogger.error).toHaveBeenCalledWith("Plugin ID is required");
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Usage: scaffold remove <plugin-id>")
      );
    });

    it("should display the plugin name in the box header", async () => {
      // Mock project detection to fail early
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      await expect(command.run(["my-plugin"], {})).rejects.toThrow();
      
      expect(mockLogger.box).toHaveBeenCalledWith(
        "🗑️  Removing Plugin: my-plugin",
        expect.any(Object)
      );
    });

    it("should error if project root cannot be detected", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      await expect(command.run(["my-plugin"], {})).rejects.toThrow("process.exit called");
      
      expect(mockLogger.error).toHaveBeenCalledWith("Could not detect project root");
    });

    it("should error if plugin is not installed", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["other-plugin"] });
        }
        return "";
      });
      
      await expect(command.run(["nonexistent-plugin"], {})).rejects.toThrow("process.exit called");
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Plugin 'nonexistent-plugin' is not installed"
      );
      
      cwdSpy.mockRestore();
    });
  });

  describe("option parsing", () => {
    it("should return true for keep-files flag", () => {
      expect(command.parseKeepFiles()).toBe(true);
    });

    it("should return true for force flag", () => {
      expect(command.parseForce()).toBe(true);
    });

    it("should return true for dry-run flag", () => {
      expect(command.parseDryRun()).toBe(true);
    });

    it("should return true for yes flag", () => {
      expect(command.parseYes()).toBe(true);
    });
  });

  describe("dependency checking", () => {
    it("should error if other plugins depend on the one being removed", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ 
            name: "test", 
            plugins: ["base-plugin", "dependent-plugin"] 
          });
        }
        return "";
      });
      
      // Make dependent-plugin depend on base-plugin
      mockPluginRegistry.get.mockImplementation((id: string) => {
        if (id === "dependent-plugin") {
          return { id, name: "Dependent", dependencies: ["base-plugin"] };
        }
        return { id, name: id };
      });
      
      await expect(command.run(["base-plugin"], {})).rejects.toThrow("process.exit called");
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Cannot remove 'base-plugin'")
      );
      
      cwdSpy.mockRestore();
    });

    it("should allow forcing removal with --force", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ 
            name: "test", 
            plugins: ["base-plugin", "dependent-plugin"] 
          });
        }
        return "";
      });
      
      // Make dependent-plugin depend on base-plugin
      mockPluginRegistry.get.mockImplementation((id: string) => {
        if (id === "dependent-plugin") {
          return { id, name: "Dependent", dependencies: ["base-plugin"] };
        }
        return { id, name: id };
      });
      
      mockPrompt.confirm.mockResolvedValue(false); // User aborts
      
      try {
        await command.run(["base-plugin"], { force: true });
      } catch {
        // May throw due to user abort
      }
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Proceeding anyway due to --force flag"
      );
      
      cwdSpy.mockRestore();
    });
  });

  describe("dry run mode", () => {
    it("should show changes without applying them", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        if (pathStr === "/test/project/turbo.json") return true; // Known file for turbo plugin
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["turbo"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "turbo", name: "Turbo" });
      
      await command.run(["turbo"], { dryRun: true, yes: true });
      
      expect(mockLogger.header).toHaveBeenCalledWith("Dry run - no changes made");
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      
      cwdSpy.mockRestore();
    });
  });

  describe("file removal", () => {
    it("should remove files associated with the plugin", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        if (pathStr === "/test/project/turbo.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["turbo"] });
        }
        return "";
      });
      
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([]);
      
      mockPluginRegistry.get.mockReturnValue({ id: "turbo", name: "Turbo" });
      
      await command.run(["turbo"], { yes: true });
      
      expect(mockLogger.success).toHaveBeenCalledWith(
        expect.stringContaining("Plugin 'turbo' removed successfully")
      );
      
      cwdSpy.mockRestore();
    });

    it("should skip file removal with --keep-files", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        if (pathStr === "/test/project/turbo.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["turbo"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "turbo", name: "Turbo" });
      
      await command.run(["turbo"], { yes: true, keepFiles: true });
      
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("keeping files due to --keep-files")
      );
      
      cwdSpy.mockRestore();
    });
  });

  describe("configuration update", () => {
    it("should update scaffold.json to remove the plugin", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["turbo", "other"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "turbo", name: "Turbo" });
      
      await command.run(["turbo"], { yes: true });
      
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
        "/test/project/scaffold.json",
        expect.stringContaining('"plugins"')
      );
      
      // Verify the written content doesn't include 'turbo'
      const writeCall = mockFileSystem.writeFile.mock.calls[0];
      const writtenContent = JSON.parse(writeCall![1]);
      expect(writtenContent.plugins).not.toContain("turbo");
      expect(writtenContent.plugins).toContain("other");
      
      cwdSpy.mockRestore();
    });
  });

  describe("project detection", () => {
    it("should detect project root from scaffold.json", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["my-plugin"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "my-plugin", name: "My Plugin" });
      mockPrompt.confirm.mockResolvedValue(false);
      
      try {
        await command.run(["my-plugin"], {});
      } catch {
        // Expected to throw due to user abort
      }
      
      expect(mockLogger.keyValue).toHaveBeenCalledWith("Project root", "/test/project");
      
      cwdSpy.mockRestore();
    });

    it("should detect project root from turbo.json", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/monorepo");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/monorepo/scaffold.json") return false;
        if (pathStr === "/test/monorepo/turbo.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/monorepo/turbo.json") {
          return JSON.stringify({ pipeline: {} });
        }
        return "";
      });
      
      // Need to fail at config loading to proceed
      await expect(command.run(["my-plugin"], {})).rejects.toThrow("process.exit called");
      
      expect(mockLogger.keyValue).toHaveBeenCalledWith("Project root", "/test/monorepo");
      
      cwdSpy.mockRestore();
    });
  });

  describe("user confirmation", () => {
    it("should prompt for confirmation before removing", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["my-plugin"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "my-plugin", name: "My Plugin" });
      mockPrompt.confirm.mockResolvedValue(false);
      
      await command.run(["my-plugin"], {});
      
      expect(mockPrompt.confirm).toHaveBeenCalledWith(
        "Proceed with removal?",
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith("Aborted");
      
      cwdSpy.mockRestore();
    });

    it("should skip confirmation with --yes flag", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["my-plugin"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "my-plugin", name: "My Plugin" });
      
      await command.run(["my-plugin"], { yes: true });
      
      expect(mockPrompt.confirm).not.toHaveBeenCalled();
      expect(mockLogger.success).toHaveBeenCalled();
      
      cwdSpy.mockRestore();
    });
  });
});
