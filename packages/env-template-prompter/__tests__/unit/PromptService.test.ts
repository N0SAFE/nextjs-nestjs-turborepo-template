import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PromptService } from "../../src/services/PromptService.js";
import type {
  TemplateField,
  PromptContext,
  IValidationService,
  ITransformerService,
  IConfigService,
} from "../../src/types/index.js";
import prompts from "prompts";

// Mock prompts module
vi.mock("prompts");
const mockPrompts = vi.mocked(prompts);

// Mock picocolors
vi.mock("picocolors", () => ({
  default: {
    cyan: vi.fn((text) => text),
    gray: vi.fn((text) => text),
    blue: vi.fn((text) => text),
    red: vi.fn((text) => text),
    green: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    white: vi.fn((text) => text),
  },
}));

describe("PromptService", () => {
  let promptService: PromptService;
  let mockValidationService: IValidationService;
  let mockTransformerService: ITransformerService;
  let mockConfigService: IConfigService;

  const sampleField: TemplateField = {
    key: "DATABASE_URL",
    type: "url",
    lineNumber: 1,
    rawLine: "DATABASE_URL=postgresql://localhost:5432/mydb",
    options: {
      message: "Enter database URL",
      value: "postgresql://localhost:5432/mydb",
    },
  };

  beforeEach(() => {
    mockValidationService = {
      serviceName: "ValidationService",
      validateField: vi
        .fn()
        .mockResolvedValue({ valid: true, errors: [], warnings: [] }),
      validateUrl: vi.fn(),
      validateNumber: vi.fn(),
      validateString: vi.fn(),
      validateBoolean: vi.fn(),
      validateEmail: vi.fn(),
      validatePort: vi.fn(),
      registerValidator: vi.fn(),
      unregisterValidator: vi.fn(),
      getRegisteredValidators: vi.fn().mockReturnValue([]),
      setServiceContainer: vi.fn(),
      validateVariable: vi.fn().mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      }),
    };

    mockTransformerService = {
      serviceName: "TransformerService",
      applyTransformers: vi.fn().mockResolvedValue("transformed-value"),
      transformValue: vi.fn(),
      registerTransformer: vi.fn(),
      unregisterTransformer: vi.fn(),
      getRegisteredTransformers: vi.fn(),
      getBuiltInTransformers: vi.fn(),
      resolveSourceValue: vi.fn().mockReturnValue("source-value"),
      resolvePlaceholders: vi.fn(),
      setValidationService: vi.fn(),
    };

    mockConfigService = {
      serviceName: "ConfigService",
      setDebugMode: vi.fn(),
      getConfig: vi.fn().mockReturnValue({
        debugMode: false,
        interactive: true,
        templatePath: "",
        outputPath: "",
        skipExisting: false,
      }),
      updateConfig: vi.fn(),
      debug: vi.fn(),
      addDebugHandler: vi.fn(),
      removeDebugHandler: vi.fn(),
      validateConfig: vi
        .fn()
        .mockReturnValue({ valid: true, errors: [], warnings: [] }),
    };

    promptService = new PromptService(
      mockValidationService,
      mockTransformerService,
      mockConfigService
    );

    // Reset mocks
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("promptForField", () => {
    const context: PromptContext = {
      existingValues: new Map(),
      skipExisting: false,
      interactive: true,
    };

    it("should skip field when existing value found and skipExisting is true", async () => {
      const skipContext: PromptContext = {
        existingValues: new Map([["DATABASE_URL", "existing-value"]]),
        skipExisting: true,
        interactive: true,
      };

      const result = await promptService.promptForField(
        sampleField,
        skipContext
      );

      expect(result.skipped).toBe(true);
      expect(result.value).toBe("existing-value");
    });

    it("should auto-derive field when conditions are met", async () => {
      const autoField: TemplateField = {
        ...sampleField,
        options: {
          auto_derive: true,
          transformer: "test-transformer",
          source: "SOURCE_VAR",
        },
      };

      const autoContext: PromptContext = {
        existingValues: new Map([["SOURCE_VAR", "source-value"]]),
        skipExisting: false,
        interactive: true,
      };

      const result = await promptService.promptForField(autoField, autoContext);

      expect(result.derived).toBe(true);
      expect(result.value).toBe("transformed-value");
      expect(mockTransformerService.applyTransformers).toHaveBeenCalled();
    });

    it("should use default value in non-interactive mode", async () => {
      const nonInteractiveContext: PromptContext = {
        existingValues: new Map(),
        skipExisting: false,
        interactive: false,
      };

      const result = await promptService.promptForField(
        sampleField,
        nonInteractiveContext
      );

      expect(result.value).toBe("postgresql://localhost:5432/mydb");
      expect(result.skipped).toBe(false);
      expect(result.derived).toBe(false);
    });

    it("should prompt user in interactive mode", async () => {
      mockPrompts.mockResolvedValue({ value: "user-input" });

      const result = await promptService.promptForField(sampleField, context);

      expect(result.value).toBe("user-input");
      expect(mockPrompts).toHaveBeenCalled();
      expect(mockValidationService.validateField).toHaveBeenCalledWith(
        "user-input",
        sampleField
      );
    });

    it("should handle validation failure and retry", async () => {
      mockPrompts
        .mockResolvedValueOnce({ value: "invalid-input" })
        .mockResolvedValueOnce({ value: "valid-input" });

      vi.mocked(mockValidationService.validateField)
        .mockResolvedValueOnce({
          valid: false,
          errors: ["Invalid format"],
          warnings: [],
        })
        .mockResolvedValueOnce({ valid: true, errors: [], warnings: [] });

      const result = await promptService.promptForField(sampleField, context);

      expect(result.value).toBe("valid-input");
      expect(mockPrompts).toHaveBeenCalledTimes(2);
    });
  });

  describe("promptForGroup", () => {
    const groupFields: TemplateField[] = [
      sampleField,
      {
        key: "DATABASE_PORT",
        type: "port",
        lineNumber: 2,
        rawLine: "DATABASE_PORT=5432",
        options: { value: "5432" },
      },
    ];

    const context: PromptContext = {
      existingValues: new Map(),
      skipExisting: false,
      interactive: true,
    };

    it("should prompt for all fields in group", async () => {
      mockPrompts.mockResolvedValue({ value: "test-value" });

      const result = await promptService.promptForGroup(
        "DATABASE",
        groupFields,
        context
      );

      expect(result.size).toBe(2);
      expect(result.has("DATABASE_URL")).toBe(true);
      expect(result.has("DATABASE_PORT")).toBe(true);
    });

    it("should update context with each field value", async () => {
      mockPrompts.mockResolvedValue({ value: "test-value" });

      await promptService.promptForGroup("DATABASE", groupFields, context);

      expect(context.existingValues.get("DATABASE_URL")).toBe("test-value");
      expect(context.existingValues.get("DATABASE_PORT")).toBe("test-value");
    });

    it("should handle prompt errors gracefully", async () => {
      mockPrompts.mockRejectedValue(new Error("Prompt failed"));

      const result = await promptService.promptForGroup(
        "DATABASE",
        groupFields,
        context
      );

      expect(result.get("DATABASE_URL")?.error).toBeDefined();
    });
  });

  describe("shouldSkipField", () => {
    it("should return true when skipExisting is true and field has existing value", () => {
      const context: PromptContext = {
        existingValues: new Map([["DATABASE_URL", "existing-value"]]),
        skipExisting: true,
        interactive: true,
      };

      const result = promptService.shouldSkipField(sampleField, context);

      expect(result).toBe(true);
    });

    it("should return false when skipExisting is false", () => {
      const context: PromptContext = {
        existingValues: new Map([["DATABASE_URL", "existing-value"]]),
        skipExisting: false,
        interactive: true,
      };

      const result = promptService.shouldSkipField(sampleField, context);

      expect(result).toBe(false);
    });

    it("should return false when no existing value", () => {
      const context: PromptContext = {
        existingValues: new Map(),
        skipExisting: true,
        interactive: true,
      };

      const result = promptService.shouldSkipField(sampleField, context);

      expect(result).toBe(false);
    });
  });

  describe("shouldAutoDerive", () => {
    it("should return true when auto_derive is explicitly enabled", async () => {
      const autoField: TemplateField = {
        ...sampleField,
        options: { auto_derive: true },
      };

      const context: PromptContext = {
        existingValues: new Map(),
        skipExisting: false,
        interactive: true,
      };

      const result = await promptService.shouldAutoDerive(autoField, context);

      expect(result).toBe(true);
    });

    it("should return true when field has transformer with available source", async () => {
      const transformerField: TemplateField = {
        ...sampleField,
        options: {
          transformer: "test-transformer",
          source: "@{SOURCE_VAR}",
        },
      };

      const context: PromptContext = {
        existingValues: new Map([["SOURCE_VAR", "source-value"]]),
        skipExisting: false,
        interactive: true,
      };

      const result = await promptService.shouldAutoDerive(
        transformerField,
        context
      );

      expect(result).toBe(true);
    });

    it("should return false when transformer source is not available", async () => {
      const transformerField: TemplateField = {
        ...sampleField,
        options: {
          transformer: "test-transformer",
          source: "@{MISSING_SOURCE}",
        },
      };

      const context: PromptContext = {
        existingValues: new Map(),
        skipExisting: false,
        interactive: true,
      };

      const result = await promptService.shouldAutoDerive(
        transformerField,
        context
      );

      expect(result).toBe(false);
    });

    it("should return false for regular fields", async () => {
      const context: PromptContext = {
        existingValues: new Map(),
        skipExisting: false,
        interactive: true,
      };

      const result = await promptService.shouldAutoDerive(sampleField, context);

      expect(result).toBe(false);
    });
  });

  describe("generatePromptMessage", () => {
    it("should use custom message when provided", () => {
      const customField: TemplateField = {
        ...sampleField,
        options: { message: "Custom prompt message" },
      };

      const result = promptService.generatePromptMessage(customField);

      expect(result).toBe("Custom prompt message");
    });

    it("should generate message for URL type", () => {
      const urlField: TemplateField = {
        ...sampleField,
        type: "url",
        options: {},
      };

      const result = promptService.generatePromptMessage(urlField);

      expect(result).toContain("database url");
      expect(result).toContain("(URL format)");
    });

    it("should generate message for email type", () => {
      const emailField: TemplateField = {
        key: "USER_EMAIL",
        type: "email",
        lineNumber: 1,
        rawLine: "USER_EMAIL=user@example.com",
        options: {},
      };

      const result = promptService.generatePromptMessage(emailField);

      expect(result).toContain("user email");
      expect(result).toContain("(email address)");
    });

    it("should generate message for number type with constraints", () => {
      const numberField: TemplateField = {
        key: "MAX_CONNECTIONS",
        type: "number",
        lineNumber: 1,
        rawLine: "MAX_CONNECTIONS=10",
        options: { min: 1, max: 100 },
      };

      const result = promptService.generatePromptMessage(numberField);

      expect(result).toContain("max connections");
      expect(result).toContain("between 1 and 100");
    });

    it("should generate message for boolean type", () => {
      const booleanField: TemplateField = {
        key: "ENABLE_LOGGING",
        type: "boolean",
        lineNumber: 1,
        rawLine: "ENABLE_LOGGING=true",
        options: {},
      };

      const result = promptService.generatePromptMessage(booleanField);

      expect(result).toContain("enable logging");
      expect(result).toContain("(true/false)");
    });

    it("should include allowed values when specified", () => {
      const constrainedField: TemplateField = {
        key: "LOG_LEVEL",
        type: "string",
        lineNumber: 1,
        rawLine: "LOG_LEVEL=info",
        options: { allow: "debug,info,warn,error" },
      };

      const result = promptService.generatePromptMessage(constrainedField);

      expect(result).toContain("(allowed: debug,info,warn,error)");
    });
  });

  describe("collectUserInput", () => {
    it("should collect text input for string fields", async () => {
      mockPrompts.mockResolvedValue({ value: "user-input" });

      const result = await promptService.collectUserInput(
        sampleField,
        "Enter value:"
      );

      expect(result).toBe("user-input");
      expect(mockPrompts).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "text",
          name: "value",
        })
      );
    });

    it("should collect number input for number fields", async () => {
      const numberField: TemplateField = {
        key: "PORT",
        type: "number",
        lineNumber: 1,
        rawLine: "PORT=3000",
        options: { value: "3000" },
      };

      mockPrompts.mockResolvedValue({ value: 3000 });

      const result = await promptService.collectUserInput(
        numberField,
        "Enter port:"
      );

      expect(result).toBe("3000");
      expect(mockPrompts).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "number",
          initial: 3000,
        })
      );
    });

    it("should provide choices for boolean fields", async () => {
      const booleanField: TemplateField = {
        key: "ENABLE_SSL",
        type: "boolean",
        lineNumber: 1,
        rawLine: "ENABLE_SSL=true",
        options: {},
      };

      mockPrompts.mockResolvedValue({ value: "true" });

      const result = await promptService.collectUserInput(
        booleanField,
        "Enable SSL:"
      );

      expect(result).toBe("true");
      expect(mockPrompts).toHaveBeenCalledWith(
        expect.objectContaining({
          initial: undefined,
          message: "Enable SSL:",
          name: "value",
          type: "confirm",
        })
      );
    });
  });

  describe("processNonInteractive", () => {
    const fields: TemplateField[] = [
      sampleField,
      {
        key: "API_KEY",
        type: "string",
        lineNumber: 2,
        rawLine: "API_KEY=secret-key",
        options: { value: "default-key" },
      },
    ];

    it("should process all fields with default values", async () => {
      const defaultValues = new Map([["DATABASE_URL", "existing-db-url"]]);

      // Create a context that should use the existing value
      const mockProcessNonInteractive = vi
        .spyOn(promptService, "promptForField")
        .mockResolvedValueOnce({
          value: "existing-db-url",
          skipped: false,
          derived: false,
        })
        .mockResolvedValueOnce({
          value: "default-key",
          skipped: false,
          derived: false,
        });

      const result = await promptService.processNonInteractive(
        fields,
        defaultValues
      );

      expect(result.size).toBe(2);
      expect(result.get("DATABASE_URL")?.value).toBe("existing-db-url");
      expect(result.get("API_KEY")?.value).toBe("default-key");

      mockProcessNonInteractive.mockRestore();
    });

    it("should handle auto-derived fields", async () => {
      const autoField: TemplateField = {
        key: "DERIVED_VAR",
        type: "string",
        lineNumber: 3,
        rawLine: "DERIVED_VAR=",
        options: {
          auto_derive: true,
          transformer: "test-transformer",
        },
      };

      const fieldsWithAuto = [...fields, autoField];

      const result = await promptService.processNonInteractive(
        fieldsWithAuto,
        new Map()
      );

      expect(result.get("DERIVED_VAR")?.derived).toBe(true);
      expect(result.get("DERIVED_VAR")?.value).toBe("transformed-value");
    });
  });

  describe("displaySummary", () => {
    it("should display summary of results", () => {
      const results = new Map([
        ["FIELD1", { value: "value1", skipped: false, derived: false }],
        ["FIELD2", { value: "value2", skipped: true, derived: false }],
        ["FIELD3", { value: "value3", skipped: false, derived: true }],
        [
          "FIELD4",
          { value: "", skipped: false, derived: false, error: "Failed" },
        ],
      ]);

      promptService.displaySummary(results);

      expect(console.log).toHaveBeenCalled();
      // The method should log summary information (actual text is wrapped with picocolors)
      expect(vi.mocked(console.log).mock.calls.length).toBeGreaterThan(0);
    });

    it("should not display in non-interactive mode", () => {
      vi.mocked(mockConfigService.getConfig).mockReturnValue({
        debugMode: false,
        interactive: false,
        templatePath: "",
        outputPath: "",
        skipExisting: false,
      });

      const results = new Map([
        ["FIELD1", { value: "value1", skipped: false, derived: false }],
      ]);

      promptService.displaySummary(results);

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe("serviceName", () => {
    it("should have correct service name", () => {
      expect(promptService.serviceName).toBe("PromptService");
    });
  });
});
