/**
 * Add Command Tests
 *
 * Tests for the scaffold add command functionality.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AddCommand } from "../add.command";
import * as fs from "fs";

// Mock fs module
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn(),
}));

// Mock path.parse to return proper root
vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...actual,
    parse: vi.fn().mockReturnValue({ root: "/" }),
  };
});

describe("AddCommand", () => {
  let command: AddCommand;

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
    getAllDependencies: vi.fn().mockReturnValue([]),
    canAdd: vi.fn().mockReturnValue({ canAdd: true }),
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
    command = new AddCommand(
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
        expect.stringContaining("Usage: scaffold add <plugin-id>")
      );
    });

    it("should display the plugin name in the box header", async () => {
      // Mock project detection to fail early
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      await expect(command.run(["my-plugin"], {})).rejects.toThrow();
      
      expect(mockLogger.box).toHaveBeenCalledWith(
        "🔌 Adding Plugin: my-plugin",
        expect.any(Object)
      );
    });

    it("should error if project root cannot be detected", async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      await expect(command.run(["my-plugin"], {})).rejects.toThrow("process.exit called");
      
      expect(mockLogger.error).toHaveBeenCalledWith("Could not detect project root");
    });

    it("should error if plugin is not found in registry", async () => {
      // Mock project root detection
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr.includes("package.json")) return true;
        if (pathStr.includes("scaffold.json")) return false;
        return false;
      });
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: "test-project" }));
      
      mockPluginRegistry.get.mockReturnValue(null);
      
      await expect(command.run(["nonexistent-plugin"], {})).rejects.toThrow("process.exit called");
      
      expect(mockLogger.error).toHaveBeenCalledWith("Plugin 'nonexistent-plugin' not found");
    });
  });

  describe("option parsing", () => {
    it("should parse config option as JSON", () => {
      const result = command.parseConfig('{"key": "value"}');
      expect(result).toEqual({ key: "value" });
    });

    it("should return empty object for invalid JSON", () => {
      const result = command.parseConfig("invalid json");
      expect(result).toEqual({});
    });

    it("should return true for skip-install flag", () => {
      expect(command.parseSkipInstall()).toBe(true);
    });

    it("should return true for dry-run flag", () => {
      expect(command.parseDryRun()).toBe(true);
    });

    it("should return true for force flag", () => {
      expect(command.parseForce()).toBe(true);
    });

    it("should return true for yes flag", () => {
      expect(command.parseYes()).toBe(true);
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
          return JSON.stringify({ name: "test", plugins: [] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "test-plugin", name: "Test" });
      mockPluginResolver.resolveDependencies.mockReturnValue([]);
      mockPluginResolver.checkConflicts.mockReturnValue([]);
      mockPrompt.confirm.mockResolvedValue(false);
      
      try {
        await command.run(["test-plugin"], {});
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
      
      mockPluginRegistry.get.mockReturnValue({ id: "test-plugin", name: "Test" });
      mockPluginResolver.resolveDependencies.mockReturnValue([]);
      mockPluginResolver.checkConflicts.mockReturnValue([]);
      mockPrompt.confirm.mockResolvedValue(false);
      
      try {
        await command.run(["test-plugin"], {});
      } catch {
        // Expected to throw due to user abort
      }
      
      expect(mockLogger.keyValue).toHaveBeenCalledWith("Project root", "/test/monorepo");
      
      cwdSpy.mockRestore();
    });
  });

  describe("plugin installation", () => {
    it("should warn if plugin is already installed", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["existing-plugin"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "existing-plugin", name: "Existing" });
      mockPrompt.confirm.mockResolvedValue(false);
      
      try {
        await command.run(["existing-plugin"], {});
      } catch {
        // May throw due to user abort
      }
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Plugin 'existing-plugin' is already installed"
      );
      
      cwdSpy.mockRestore();
    });

    it("should check for missing dependencies", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: [] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "child-plugin", name: "Child" });
      // Use new API: getAllDependencies returns all deps including parent-plugin
      mockPluginResolver.getAllDependencies.mockReturnValue(["parent-plugin"]);
      mockPluginResolver.canAdd.mockReturnValue({ canAdd: true });
      mockPrompt.confirm.mockResolvedValue(false);
      
      try {
        await command.run(["child-plugin"], {});
      } catch {
        // Expected to throw due to user abort
      }
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("requires: parent-plugin")
      );
      
      cwdSpy.mockRestore();
    });

    it("should check for conflicts", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["conflicting-plugin"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "new-plugin", name: "New" });
      // Use new API: getAllDependencies and canAdd
      mockPluginResolver.getAllDependencies.mockReturnValue([]);
      mockPluginResolver.canAdd.mockReturnValue({ 
        canAdd: false, 
        reason: "conflicts with: conflicting-plugin" 
      });
      
      await expect(command.run(["new-plugin"], {})).rejects.toThrow("process.exit called");
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("conflicts with: conflicting-plugin")
      );
      
      cwdSpy.mockRestore();
    });

    it("should allow forcing through conflicts", async () => {
      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/test/project");
      
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") return true;
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: ["conflicting-plugin"] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ id: "new-plugin", name: "New" });
      // Use new API: getAllDependencies and canAdd
      mockPluginResolver.getAllDependencies.mockReturnValue([]);
      mockPluginResolver.canAdd.mockReturnValue({ 
        canAdd: false, 
        reason: "conflicts with: conflicting-plugin" 
      });
      mockPrompt.confirm.mockResolvedValue(false); // User aborts
      
      try {
        await command.run(["new-plugin"], { force: true });
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
        return false;
      });
      
      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = String(p);
        if (pathStr === "/test/project/scaffold.json") {
          return JSON.stringify({ name: "test", plugins: [] });
        }
        return "";
      });
      
      mockPluginRegistry.get.mockReturnValue({ 
        id: "test-plugin", 
        name: "Test",
        description: "A test plugin"
      });
      // Use new API: getAllDependencies and canAdd
      mockPluginResolver.getAllDependencies.mockReturnValue([]);
      mockPluginResolver.canAdd.mockReturnValue({ canAdd: true });
      
      await command.run(["test-plugin"], { dryRun: true, yes: true });
      
      expect(mockLogger.header).toHaveBeenCalledWith("Dry run - no changes made");
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled();
      
      cwdSpy.mockRestore();
    });
  });
});
