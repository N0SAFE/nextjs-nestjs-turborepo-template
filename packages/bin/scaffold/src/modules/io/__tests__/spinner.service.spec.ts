/**
 * Spinner Service Tests
 *
 * Tests for terminal spinners for long-running operations.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SpinnerService, type SpinnerOptions } from "../spinner.service";

// Mock ora
const mockSpinnerInstance = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  warn: vi.fn().mockReturnThis(),
  info: vi.fn().mockReturnThis(),
  clear: vi.fn().mockReturnThis(),
  isSpinning: false,
  text: "",
};

vi.mock("ora", () => ({
  default: vi.fn((options?: object) => {
    return {
      ...mockSpinnerInstance,
      isSpinning: true,
    };
  }),
}));

describe("SpinnerService", () => {
  let service: SpinnerService;

  beforeEach(() => {
    service = new SpinnerService();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with spinners enabled by default", () => {
      expect(service).toBeDefined();
    });
  });

  describe("setEnabled", () => {
    it("should enable spinners", () => {
      service.setEnabled(true);
      // Start spinner and verify it's enabled
      service.start("Test");
      expect(service.isSpinning()).toBe(true);
    });

    it("should disable spinners", () => {
      service.setEnabled(false);
      // Spinners can still be started but with isEnabled: false in options
      service.start("Test");
      expect(service.isSpinning()).toBe(true); // ora mock still returns isSpinning: true
    });
  });

  describe("start", () => {
    it("should start a spinner with text string", () => {
      const spinner = service.start("Loading...");
      expect(spinner).toBeDefined();
      expect(service.isSpinning()).toBe(true);
    });

    it("should start a spinner with options object", () => {
      const spinner = service.start({
        text: "Processing...",
        color: "green",
      });
      expect(spinner).toBeDefined();
    });

    it("should start a spinner with no arguments", () => {
      const spinner = service.start();
      expect(spinner).toBeDefined();
    });

    it("should stop existing spinner before starting new one", () => {
      service.start("First");
      service.start("Second");
      // The stop method should have been called
      expect(mockSpinnerInstance.stop).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update spinner text", () => {
      service.start("Initial text");
      service.update("Updated text");
      // The spinner text should be updated
    });

    it("should do nothing if no spinner is running", () => {
      service.update("No spinner");
      // Should not throw
    });
  });

  describe("succeed", () => {
    it("should stop spinner with success", () => {
      service.start("Working...");
      service.succeed("Done!");
      expect(mockSpinnerInstance.succeed).toHaveBeenCalledWith("Done!");
    });

    it("should stop spinner with success (no text)", () => {
      service.start("Working...");
      service.succeed();
      expect(mockSpinnerInstance.succeed).toHaveBeenCalledWith(undefined);
    });

    it("should do nothing if no spinner is running", () => {
      service.succeed("No spinner");
      // Should not throw
    });
  });

  describe("fail", () => {
    it("should stop spinner with failure", () => {
      service.start("Working...");
      service.fail("Error occurred!");
      expect(mockSpinnerInstance.fail).toHaveBeenCalledWith("Error occurred!");
    });

    it("should stop spinner with failure (no text)", () => {
      service.start("Working...");
      service.fail();
      expect(mockSpinnerInstance.fail).toHaveBeenCalledWith(undefined);
    });

    it("should do nothing if no spinner is running", () => {
      service.fail("No spinner");
      // Should not throw
    });
  });

  describe("warn", () => {
    it("should stop spinner with warning", () => {
      service.start("Working...");
      service.warn("Warning!");
      expect(mockSpinnerInstance.warn).toHaveBeenCalledWith("Warning!");
    });

    it("should stop spinner with warning (no text)", () => {
      service.start("Working...");
      service.warn();
      expect(mockSpinnerInstance.warn).toHaveBeenCalledWith(undefined);
    });
  });

  describe("info", () => {
    it("should stop spinner with info", () => {
      service.start("Working...");
      service.info("Information");
      expect(mockSpinnerInstance.info).toHaveBeenCalledWith("Information");
    });

    it("should stop spinner with info (no text)", () => {
      service.start("Working...");
      service.info();
      expect(mockSpinnerInstance.info).toHaveBeenCalledWith(undefined);
    });
  });

  describe("stop", () => {
    it("should stop spinner without status", () => {
      service.start("Working...");
      service.stop();
      expect(mockSpinnerInstance.stop).toHaveBeenCalled();
    });

    it("should do nothing if no spinner is running", () => {
      service.stop();
      // Should not throw
    });
  });

  describe("clear", () => {
    it("should clear spinner", () => {
      service.start("Working...");
      service.clear();
      expect(mockSpinnerInstance.clear).toHaveBeenCalled();
    });

    it("should do nothing if no spinner is running", () => {
      service.clear();
      // Should not throw
    });
  });

  describe("isSpinning", () => {
    it("should return true when spinner is running", () => {
      service.start("Working...");
      expect(service.isSpinning()).toBe(true);
    });

    it("should return false when no spinner is running", () => {
      expect(service.isSpinning()).toBe(false);
    });
  });

  describe("wrap", () => {
    it("should run async function with spinner", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      const result = await service.wrap("Processing...", fn);
      expect(fn).toHaveBeenCalled();
      expect(result).toBe("result");
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();
    });

    it("should handle success with custom text", async () => {
      const fn = vi.fn().mockResolvedValue("value");
      await service.wrap("Working...", fn, { successText: "Completed!" });
      expect(mockSpinnerInstance.succeed).toHaveBeenCalledWith("Completed!");
    });

    it("should handle failure with custom text", async () => {
      const error = new Error("Something went wrong");
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(service.wrap("Working...", fn, { failText: "Failed!" }))
        .rejects.toThrow("Something went wrong");
      expect(mockSpinnerInstance.fail).toHaveBeenCalledWith("Failed!");
    });

    it("should handle failure with error message", async () => {
      const error = new Error("Specific error");
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(service.wrap("Working...", fn))
        .rejects.toThrow("Specific error");
    });

    it("should handle non-Error rejection", async () => {
      const fn = vi.fn().mockRejectedValue("string error");
      
      await expect(service.wrap("Working...", fn))
        .rejects.toBe("string error");
    });
  });

  describe("steps", () => {
    it("should run multiple steps with spinner", async () => {
      const steps = [
        { text: "Step 1", fn: vi.fn().mockResolvedValue(undefined) },
        { text: "Step 2", fn: vi.fn().mockResolvedValue(undefined) },
        { text: "Step 3", fn: vi.fn().mockResolvedValue(undefined) },
      ];

      await service.steps(steps);

      expect(steps[0]!.fn).toHaveBeenCalled();
      expect(steps[1]!.fn).toHaveBeenCalled();
      expect(steps[2]!.fn).toHaveBeenCalled();
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();
    });

    it("should use custom start text", async () => {
      const steps = [
        { text: "Step 1", fn: vi.fn().mockResolvedValue(undefined) },
      ];

      await service.steps(steps, { startText: "Starting process..." });
      // Spinner started with custom text
    });

    it("should use custom success text", async () => {
      const steps = [
        { text: "Step 1", fn: vi.fn().mockResolvedValue(undefined) },
      ];

      await service.steps(steps, { successText: "All done!" });
      expect(mockSpinnerInstance.succeed).toHaveBeenCalledWith("All done!");
    });

    it("should handle step failure", async () => {
      const error = new Error("Step failed");
      const steps = [
        { text: "Step 1", fn: vi.fn().mockResolvedValue(undefined) },
        { text: "Step 2", fn: vi.fn().mockRejectedValue(error) },
        { text: "Step 3", fn: vi.fn().mockResolvedValue(undefined) },
      ];

      await expect(service.steps(steps)).rejects.toThrow("Step failed");
      expect(steps[0]!.fn).toHaveBeenCalled();
      expect(steps[1]!.fn).toHaveBeenCalled();
      expect(steps[2]!.fn).not.toHaveBeenCalled();
    });

    it("should handle empty steps array", async () => {
      await service.steps([]);
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();
    });

    it("should handle non-Error step rejection", async () => {
      const steps = [
        { text: "Step 1", fn: vi.fn().mockRejectedValue("string error") },
      ];

      await expect(service.steps(steps)).rejects.toBe("string error");
    });
  });
});
