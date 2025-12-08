/**
 * Logger Service Tests
 *
 * Tests for styled console logging with different levels and formatting.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LoggerService, type LogLevel, type LoggerOptions } from "../logger.service";

describe("LoggerService", () => {
  let service: LoggerService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new LoggerService();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should create instance with default options", () => {
      expect(service).toBeDefined();
    });
  });

  describe("configure", () => {
    it("should configure logger options", () => {
      service.configure({
        level: "debug",
        timestamps: true,
        verbose: true,
        prefix: "TEST",
      });

      // Verify debug messages are logged (level was set)
      service.debug("test message");
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should merge with existing options", () => {
      service.configure({ level: "debug" });
      service.configure({ prefix: "PREFIX" });

      // Debug should still work
      service.debug("test");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("setLevel", () => {
    it("should set the log level", () => {
      service.setLevel("error");
      
      // Info should not log
      service.info("test");
      expect(consoleSpy).not.toHaveBeenCalled();

      // Error should log
      service.error("error message");
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should allow debug messages when level is debug", () => {
      service.setLevel("debug");
      service.debug("debug message");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("setVerbose", () => {
    it("should enable verbose mode", () => {
      service.setVerbose(true);
      service.debug("verbose debug");
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should set level to debug when verbose is true", () => {
      service.setLevel("error"); // First set to error
      service.setVerbose(true); // This should change to debug
      service.debug("should appear");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("log levels", () => {
    beforeEach(() => {
      service.setLevel("debug"); // Enable all levels
    });

    it("should log debug messages", () => {
      service.debug("debug message");
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0]?.[0]).toContain("⚙");
    });

    it("should log info messages", () => {
      service.info("info message");
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0]?.[0]).toContain("ℹ");
    });

    it("should log success messages", () => {
      service.success("success message");
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0]?.[0]).toContain("✔");
    });

    it("should log warning messages", () => {
      service.warn("warning message");
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0]?.[0]).toContain("⚠");
    });

    it("should log error messages", () => {
      service.error("error message");
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0]?.[0]).toContain("✖");
    });

    it("should include additional arguments", () => {
      service.info("message", { extra: "data" });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        { extra: "data" }
      );
    });
  });

  describe("log level filtering", () => {
    it("should not log debug when level is info", () => {
      service.setLevel("info");
      service.debug("should not appear");
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not log info when level is warn", () => {
      service.setLevel("warn");
      service.info("should not appear");
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should not log warn when level is error", () => {
      service.setLevel("error");
      service.warn("should not appear");
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("should always log error when level is error", () => {
      service.setLevel("error");
      service.error("error message");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("formatting methods", () => {
    it("should log newline", () => {
      service.newline();
      expect(consoleSpy).toHaveBeenCalledWith();
    });

    it("should log divider with default char and length", () => {
      service.divider();
      expect(consoleSpy).toHaveBeenCalled();
      // Default length is 50
      const call = consoleSpy.mock.calls[0]?.[0] as string;
      expect(call).toBeDefined();
    });

    it("should log divider with custom char and length", () => {
      service.divider("=", 20);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log header", () => {
      service.header("Test Header");
      // Header logs newline, content, newline
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log step with progress indicator", () => {
      service.step(1, 5, "First step");
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0]?.[0] as string;
      expect(call).toContain("[1/5]");
    });

    it("should log bullet point", () => {
      service.bullet("Bullet item");
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0]?.[0] as string;
      expect(call).toContain("•");
    });

    it("should log bullet with indent", () => {
      service.bullet("Indented bullet", 2);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log tree item (not last)", () => {
      service.tree("Tree item", false);
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0]?.[0] as string;
      expect(call).toContain("├──");
    });

    it("should log tree item (last)", () => {
      service.tree("Last tree item", true);
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0]?.[0] as string;
      expect(call).toContain("└──");
    });

    it("should log tree item with indent", () => {
      service.tree("Nested item", false, 2);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log key-value pair", () => {
      service.keyValue("Key", "Value");
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0]?.[0] as string;
      expect(call).toContain("Key:");
    });

    it("should log key-value with number", () => {
      service.keyValue("Count", 42);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log key-value with boolean", () => {
      service.keyValue("Enabled", true);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("table", () => {
    it("should log a table with headers and rows", () => {
      service.table(
        ["Name", "Age", "City"],
        [
          ["Alice", 30, "NYC"],
          ["Bob", 25, "LA"],
        ]
      );
      // Should log header, divider, and rows
      expect(consoleSpy).toHaveBeenCalledTimes(4);
    });

    it("should handle empty rows", () => {
      service.table(["Col1", "Col2"], []);
      // Header + divider
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it("should handle custom padding", () => {
      service.table(
        ["A", "B"],
        [["1", "2"]],
        { padding: 4 }
      );
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it("should handle missing cell values", () => {
      service.table(
        ["A", "B", "C"],
        [["1"]] // Missing B and C
      );
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("json", () => {
    it("should log JSON with default indent", () => {
      service.json({ name: "test", value: 123 });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log JSON with custom indent", () => {
      service.json({ key: "value" }, 4);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should handle arrays", () => {
      service.json([1, 2, 3]);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should handle nested objects", () => {
      service.json({ outer: { inner: { deep: "value" } } });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("box", () => {
    it("should log a box with single line content", () => {
      service.box("Content inside box");
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log a box with multiple lines", () => {
      service.box(["Line 1", "Line 2", "Line 3"]);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log a box with title", () => {
      service.box("Content", { title: "Box Title" });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log a box with custom padding", () => {
      service.box("Padded content", { padding: 3 });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should log a box with title and padding", () => {
      service.box(["Line 1", "Line 2"], { title: "Title", padding: 2 });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("timestamps", () => {
    it("should include timestamps when enabled", () => {
      service.configure({ timestamps: true, level: "debug" });
      service.info("timestamped message");
      expect(consoleSpy).toHaveBeenCalled();
      // Timestamp format includes ISO date
      const call = consoleSpy.mock.calls[0]?.[0] as string;
      expect(call).toContain("[");
    });
  });

  describe("prefix", () => {
    it("should include prefix when set", () => {
      service.configure({ prefix: "TEST", level: "debug" });
      service.info("prefixed message");
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0]?.[0] as string;
      expect(call).toContain("[TEST]");
    });
  });
});
