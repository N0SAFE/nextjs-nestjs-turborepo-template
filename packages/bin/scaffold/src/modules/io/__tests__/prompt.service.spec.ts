/**
 * Prompt Service Tests
 *
 * Tests for interactive user prompts for CLI input.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PromptService, type SelectOption, type TextOptions, type NumberOptions, type ConfirmOptions } from "../prompt.service";
import { UserCancelledError } from "../../../types/errors.types";

// Mock prompts
const mockPrompts = vi.fn();
vi.mock("prompts", () => ({
  default: (questions: unknown, options?: { onCancel?: () => boolean }) => mockPrompts(questions, options),
}));

// Mock kleur
vi.mock("kleur", () => ({
  default: {
    blue: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    red: (s: string) => s,
    dim: (s: string) => s,
  },
}));

describe("PromptService", () => {
  let service: PromptService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new PromptService();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
    mockPrompts.mockReset();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("constructor", () => {
    it("should create instance", () => {
      expect(service).toBeDefined();
    });
  });

  describe("text", () => {
    it("should show a text input prompt", async () => {
      mockPrompts.mockResolvedValue({ value: "test input" });

      const result = await service.text("Enter your name:");
      expect(result).toBe("test input");
      expect(mockPrompts).toHaveBeenCalled();
    });

    it("should show text prompt with options", async () => {
      mockPrompts.mockResolvedValue({ value: "custom value" });

      const options: TextOptions = {
        placeholder: "placeholder text",
        initial: "initial value",
        validate: (v) => v.length > 0 || "Value is required",
        format: (v) => v.trim(),
      };

      const result = await service.text("Enter value:", options);
      expect(result).toBe("custom value");
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.text("Enter:")).rejects.toThrow(UserCancelledError);
    });
  });

  describe("password", () => {
    it("should show a password input prompt", async () => {
      mockPrompts.mockResolvedValue({ value: "secret123" });

      const result = await service.password("Enter password:");
      expect(result).toBe("secret123");
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.password("Password:")).rejects.toThrow(UserCancelledError);
    });
  });

  describe("number", () => {
    it("should show a number input prompt", async () => {
      mockPrompts.mockResolvedValue({ value: 42 });

      const result = await service.number("Enter a number:");
      expect(result).toBe(42);
    });

    it("should show number prompt with options", async () => {
      mockPrompts.mockResolvedValue({ value: 50 });

      const options: NumberOptions = {
        initial: 10,
        min: 1,
        max: 100,
        step: 5,
        float: false,
      };

      const result = await service.number("Enter count:", options);
      expect(result).toBe(50);
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.number("Number:")).rejects.toThrow(UserCancelledError);
    });
  });

  describe("confirm", () => {
    it("should show a confirmation prompt", async () => {
      mockPrompts.mockResolvedValue({ value: true });

      const result = await service.confirm("Are you sure?");
      expect(result).toBe(true);
    });

    it("should show confirmation with options", async () => {
      mockPrompts.mockResolvedValue({ value: false });

      const options: ConfirmOptions = {
        initial: true,
        active: "Yes",
        inactive: "No",
      };

      const result = await service.confirm("Continue?", options);
      expect(result).toBe(false);
    });

    it("should use default initial value of false", async () => {
      mockPrompts.mockResolvedValue({ value: false });

      await service.confirm("Confirm?");
      // Default is false
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.confirm("Sure?")).rejects.toThrow(UserCancelledError);
    });
  });

  describe("select", () => {
    const choices: SelectOption[] = [
      { title: "Option 1", value: "opt1" },
      { title: "Option 2", value: "opt2", description: "Second option" },
      { title: "Option 3", value: "opt3", disabled: true },
    ];

    it("should show a single-select prompt", async () => {
      mockPrompts.mockResolvedValue({ value: "opt2" });

      const result = await service.select("Choose an option:", choices);
      expect(result).toBe("opt2");
    });

    it("should show select with initial option", async () => {
      mockPrompts.mockResolvedValue({ value: "opt2" });

      const result = await service.select("Choose:", choices, { initial: 1 });
      expect(result).toBe("opt2");
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.select("Select:", choices)).rejects.toThrow(UserCancelledError);
    });
  });

  describe("multiselect", () => {
    const choices: SelectOption[] = [
      { title: "Feature A", value: "a" },
      { title: "Feature B", value: "b" },
      { title: "Feature C", value: "c" },
    ];

    it("should show a multi-select prompt", async () => {
      mockPrompts.mockResolvedValue({ value: ["a", "c"] });

      const result = await service.multiselect("Select features:", choices);
      expect(result).toEqual(["a", "c"]);
    });

    it("should show multiselect with options", async () => {
      mockPrompts.mockResolvedValue({ value: ["b"] });

      const result = await service.multiselect("Select:", choices, {
        min: 1,
        max: 2,
        hint: "Press space to select",
      });
      expect(result).toEqual(["b"]);
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.multiselect("Select:", choices)).rejects.toThrow(UserCancelledError);
    });
  });

  describe("autocomplete", () => {
    const choices: SelectOption[] = [
      { title: "Apple", value: "apple" },
      { title: "Banana", value: "banana" },
      { title: "Cherry", value: "cherry" },
    ];

    it("should show an autocomplete prompt", async () => {
      mockPrompts.mockResolvedValue({ value: "banana" });

      const result = await service.autocomplete("Search fruits:", choices);
      expect(result).toBe("banana");
    });

    it("should show autocomplete with limit", async () => {
      mockPrompts.mockResolvedValue({ value: "apple" });

      const result = await service.autocomplete("Search:", choices, { limit: 5 });
      expect(result).toBe("apple");
    });

    it("should show autocomplete with custom suggest function", async () => {
      mockPrompts.mockResolvedValue({ value: "cherry" });

      const suggest = vi.fn().mockResolvedValue([choices[2]]);
      const result = await service.autocomplete("Search:", choices, { suggest });
      expect(result).toBe("cherry");
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.autocomplete("Search:", choices)).rejects.toThrow(UserCancelledError);
    });
  });

  describe("toggle", () => {
    it("should show a toggle prompt", async () => {
      mockPrompts.mockResolvedValue({ value: true });

      const result = await service.toggle("Enable feature?");
      expect(result).toBe(true);
    });

    it("should show toggle with custom labels", async () => {
      mockPrompts.mockResolvedValue({ value: false });

      const result = await service.toggle("Enable?", {
        active: "on",
        inactive: "off",
        initial: true,
      });
      expect(result).toBe(false);
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.toggle("Toggle:")).rejects.toThrow(UserCancelledError);
    });
  });

  describe("form", () => {
    it("should run a series of prompts", async () => {
      mockPrompts.mockResolvedValue({
        name: "John",
        age: 30,
        confirmed: true,
      });

      const questions = [
        { type: "text", name: "name", message: "Name?" },
        { type: "number", name: "age", message: "Age?" },
        { type: "confirm", name: "confirmed", message: "Confirm?" },
      ];

      const result = await service.form<{ name: string; age: number; confirmed: boolean }>(questions as any);
      expect(result).toEqual({
        name: "John",
        age: 30,
        confirmed: true,
      });
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.form([{ type: "text", name: "test", message: "Test?" }] as any))
        .rejects.toThrow(UserCancelledError);
    });
  });

  describe("pressAnyKey", () => {
    it("should display message and wait for input", async () => {
      mockPrompts.mockResolvedValue({});

      await service.pressAnyKey();
      expect(consoleSpy).toHaveBeenCalled();
      expect(mockPrompts).toHaveBeenCalled();
    });

    it("should display custom message", async () => {
      mockPrompts.mockResolvedValue({});

      await service.pressAnyKey("Press Enter...");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Press Enter..."));
    });

    it("should throw on cancellation", async () => {
      mockPrompts.mockImplementation(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.pressAnyKey()).rejects.toThrow(UserCancelledError);
    });
  });

  describe("message", () => {
    it("should display info message", () => {
      service.message("Information", "info");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Information"));
    });

    it("should display success message", () => {
      service.message("Success!", "success");
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should display warning message", () => {
      service.message("Warning!", "warn");
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should display error message", () => {
      service.message("Error!", "error");
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should default to info type", () => {
      service.message("Default message");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("cancellation handling", () => {
    it("should reset cancelled flag after throw", async () => {
      // First call triggers cancellation
      mockPrompts.mockImplementationOnce(async (_q, opts) => {
        opts?.onCancel?.();
        return {};
      });

      await expect(service.text("First")).rejects.toThrow(UserCancelledError);

      // Second call should work normally
      mockPrompts.mockResolvedValueOnce({ value: "success" });
      const result = await service.text("Second");
      expect(result).toBe("success");
    });
  });
});
