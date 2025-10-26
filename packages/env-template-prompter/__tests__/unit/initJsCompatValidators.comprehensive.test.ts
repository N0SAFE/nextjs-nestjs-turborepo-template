import { describe, it, expect, beforeEach } from "vitest";
import {
  initJsUrlValidator,
  initJsNumberValidator,
  initJsStringValidator,
  initJsDateValidator,
  getInitJsCompatValidatorPlugins,
} from "../../src/plugins/validators/initJsCompatValidators.js";
import type {
  ServiceContainer,
  TemplateField,
  ValidatorPlugin,
} from "../../src/types/index.js";
import { ConfigService } from "../../src/services/ConfigService.js";
import { ValidationService } from "../../src/services/ValidationService.js";
import { TransformerService } from "../../src/services/TransformerService.js";
import { TemplateParserService } from "../../src/services/TemplateParserService.js";
import { GroupingService } from "../../src/services/GroupingService.js";
import { PromptService } from "../../src/services/PromptService.js";
import { OutputService } from "../../src/services/OutputService.js";

// Helper function to create validator function from new plugin interface
function createValidatorFunction(
  plugin: ValidatorPlugin,
  fieldType: string = "string"
) {
  const mockConfigService = new ConfigService({ debugMode: false });
  const mockValidationService = new ValidationService(mockConfigService);
  const mockTransformerService = new TransformerService(mockConfigService);
  const mockTemplateParserService = new TemplateParserService(
    mockConfigService,
    mockValidationService
  );
  const mockGroupingService = new GroupingService(mockConfigService);
  const mockPromptService = new PromptService(
    mockValidationService,
    mockTransformerService,
    mockConfigService
  );
  const mockOutputService = new OutputService(mockConfigService);

  const mockServices: ServiceContainer = {
    configService: mockConfigService,
    validationService: mockValidationService,
    transformerService: mockTransformerService,
    templateParserService: mockTemplateParserService,
    groupingService: mockGroupingService,
    promptService: mockPromptService,
    outputService: mockOutputService,
  };

  const mockField: TemplateField = {
    key: "TEST_FIELD",
    type: fieldType,
    options: {},
    rawLine: "TEST_FIELD={{type}}",
    lineNumber: 1,
  };

  const handlers = plugin.handle(mockServices, mockField);
  return handlers.validate;
}

describe("Init.js Validator Plugins - 100% Coverage", () => {
  describe("getInitJsCompatValidatorPlugins", () => {
    it("should return all init.js compatible validators", () => {
      const plugins = getInitJsCompatValidatorPlugins();
      expect(plugins).toHaveLength(4);
      expect(plugins.map((p) => p.name)).toEqual([
        "init_js_url",
        "init_js_number",
        "init_js_string",
        "init_js_date",
      ]);
    });
  });

  describe("initJsUrlValidator - Complete Coverage", () => {
    const validate = createValidatorFunction(initJsUrlValidator, "url");

    it("should have correct plugin metadata", () => {
      expect(initJsUrlValidator.name).toBe("init_js_url");
      expect(initJsUrlValidator.description).toBeDefined();
    });

    it("should validate basic URLs", async () => {
      expect(await validate("https://example.com", {})).toBe(true);
      expect(await validate("http://localhost", {})).toBe(true);
      expect(await validate("ftp://ftp.example.com", {})).toBe(true);
      expect(await validate("postgres://db.example.com", {})).toBe(true);
    });

    it("should reject empty and invalid URLs", async () => {
      expect(await validate("", {})).toBe("URL is required");
      expect(await validate("not-a-url", {})).toBe("Invalid URL format");
      expect(await validate("http://", {})).toBe("Invalid URL format");
      expect(await validate("://example.com", {})).toBe("Invalid URL format");
    });

    it("should validate protocol constraints", async () => {
      expect(await validate("https://example.com", { protocol: "https" })).toBe(
        true
      );
      expect(
        await validate("https://example.com", { protocol: "https,http" })
      ).toBe(true);
      expect(await validate("http://example.com", { protocol: "https" })).toBe(
        "Protocol must be one of: https"
      );
      expect(
        await validate("ftp://example.com", { protocol: "https,http" })
      ).toBe("Protocol must be one of: https,http");
    });

    it("should validate hostname constraints", async () => {
      expect(
        await validate("https://example.com", { hostname: "example.com" })
      ).toBe(true);
      expect(
        await validate("https://localhost", {
          hostname: "localhost,example.com",
        })
      ).toBe(true);
      expect(
        await validate("https://other.com", { hostname: "example.com" })
      ).toBe("Hostname must be one of: example.com");
      expect(
        await validate("https://sub.example.com", { hostname: "example.com" })
      ).toBe("Hostname must be one of: example.com");
    });

    it("should validate port constraints", async () => {
      expect(await validate("https://example.com:3000", { port: "3000" })).toBe(
        true
      );
      expect(await validate("https://example.com:8080", { port: "3000" })).toBe(
        "Port must be one of: 3000"
      );
      expect(await validate("https://example.com", { port: "3000" })).toBe(
        true
      ); // No port specified, passes
    });

    it("should handle complex URLs with multiple constraints", async () => {
      const params = {
        protocol: "https",
        hostname: "api.example.com",
        port: "8080",
      };
      expect(await validate("https://api.example.com:8080", params)).toBe(true);
      expect(await validate("http://api.example.com:8080", params)).toBe(
        "Protocol must be one of: https"
      );
      expect(await validate("https://other.example.com:8080", params)).toBe(
        "Hostname must be one of: api.example.com"
      );
      expect(await validate("https://api.example.com:3000", params)).toBe(
        "Port must be one of: 8080"
      );
    });
  });

  describe("initJsNumberValidator - Complete Coverage", () => {
    const validate = createValidatorFunction(initJsNumberValidator, "number");

    it("should have correct plugin metadata", () => {
      expect(initJsNumberValidator.name).toBe("init_js_number");
      expect(initJsNumberValidator.description).toBeDefined();
    });

    it("should validate various number formats", async () => {
      expect(await validate("42", {})).toBe(true);
      expect(await validate("0", {})).toBe(true);
      expect(await validate("-123", {})).toBe(true);
      expect(await validate("3.14159", {})).toBe(true);
      expect(await validate("-2.718", {})).toBe(true);
      expect(await validate("1e10", {})).toBe(true);
      expect(await validate("1.5e-10", {})).toBe(true);
    });

    it("should reject invalid numbers", async () => {
      expect(await validate("not-a-number", {})).toBe("Must be a valid number");
      expect(await validate("", {})).toBe("Must be a valid number");
      expect(await validate("12abc", {})).toBe("Must be a valid number");
      expect(await validate("12.34.56", {})).toBe("Must be a valid number");
      expect(await validate("Infinity", {})).toBe("Must be a valid number");
      expect(await validate("NaN", {})).toBe("Must be a valid number");
    });

    it("should validate allow list with precedence over min/max", async () => {
      const params = { allow: "80,443,8080", min: "1000", max: "9000" };
      expect(await validate("80", params)).toBe(true); // In allow list
      expect(await validate("443", params)).toBe(true); // In allow list
      expect(await validate("8080", params)).toBe(true); // In allow list
      expect(await validate("1500", params)).toBe(true); // In range
      expect(await validate("500", params)).toBe(
        "Must be at least 1000 or one of: 80,443,8080"
      ); // Not in allow list and below min
      expect(await validate("9500", params)).toBe(
        "Must be at most 9000 or one of: 80,443,8080"
      ); // Not in allow list and above max
    });

    it("should validate min constraints", async () => {
      expect(await validate("15", { min: "10" })).toBe(true);
      expect(await validate("10", { min: "10" })).toBe(true);
      expect(await validate("5", { min: "10" })).toBe("Must be at least 10");
      expect(await validate("-5", { min: "0" })).toBe("Must be at least 0");
    });

    it("should validate max constraints", async () => {
      expect(await validate("50", { max: "100" })).toBe(true);
      expect(await validate("100", { max: "100" })).toBe(true);
      expect(await validate("150", { max: "100" })).toBe("Must be at most 100");
    });

    it("should validate both min and max constraints", async () => {
      const params = { min: "10", max: "100" };
      expect(await validate("50", params)).toBe(true);
      expect(await validate("10", params)).toBe(true);
      expect(await validate("100", params)).toBe(true);
      expect(await validate("5", params)).toBe("Must be at least 10");
      expect(await validate("150", params)).toBe("Must be at most 100");
    });

    it("should handle decimal values in allow list", async () => {
      const params = { allow: "3.14,2.718,1.414" };
      expect(await validate("3.14", params)).toBe(true);
      expect(await validate("2.718", params)).toBe(true);
    });
  });

  describe("initJsStringValidator - Complete Coverage", () => {
    const validate = createValidatorFunction(initJsStringValidator, "string");

    it("should have correct plugin metadata", () => {
      expect(initJsStringValidator.name).toBe("init_js_string");
      expect(initJsStringValidator.description).toBeDefined();
    });

    it("should validate minLength constraints", async () => {
      expect(await validate("hello", { minLength: "3" })).toBe(true);
      expect(await validate("hello", { minLength: "5" })).toBe(true);
      expect(await validate("hi", { minLength: "3" })).toBe(
        "Must be at least 3 characters"
      );
      expect(await validate("", { minLength: "1", optional: "false" })).toBe(
        "This field is required"
      );
      expect(await validate("a", { minLength: "1" })).toBe(true);
    });

    it("should validate maxLength constraints", async () => {
      expect(await validate("hello", { maxLength: "10" })).toBe(true);
      expect(await validate("hello", { maxLength: "5" })).toBe(true);
      expect(await validate("hello world", { maxLength: "5" })).toBe(
        "Must be at most 5 characters"
      );
    });

    it("should validate both min and max length", async () => {
      const params = { minLength: "3", maxLength: "10" };
      expect(await validate("hello", params)).toBe(true);
      expect(await validate("hi", params)).toBe(
        "Must be at least 3 characters"
      );
      expect(await validate("this is too long", params)).toBe(
        "Must be at most 10 characters"
      );
    });

    it("should validate pattern constraints", async () => {
      expect(await validate("hello", { pattern: "^[a-z]+$" })).toBe(true);
      expect(await validate("Hello", { pattern: "^[a-z]+$" })).toBe(
        "Must match pattern: ^[a-z]+$"
      );
      expect(await validate("hello123", { pattern: "^[a-z]+$" })).toBe(
        "Must match pattern: ^[a-z]+$"
      );
      expect(await validate("123", { pattern: "\\d+" })).toBe(true);
      expect(await validate("abc", { pattern: "\\d+" })).toBe(
        "Must match pattern: \\d+"
      );
    });

    it("should validate complex combinations", async () => {
      const params = {
        minLength: "3",
        maxLength: "10",
        pattern: "^[a-z]+$",
        optional: "false",
      };
      expect(await validate("hello", params)).toBe(true);
      expect(await validate("hi", params)).toBe(
        "Must be at least 3 characters"
      ); // Too short
      expect(await validate("Hello", params)).toBe(
        "Must match pattern: ^[a-z]+$"
      ); // Pattern fail
      expect(await validate("verylongstring", params)).toBe(
        "Must be at most 10 characters"
      ); // Too long
      expect(await validate("", params)).toBe("This field is required"); // Required
    });

    it("should handle edge cases", async () => {
      expect(await validate(" ", { minLength: "1" })).toBe(true); // Space counts
      expect(await validate("  ", { minLength: "2" })).toBe(true); // Multiple spaces
      expect(await validate("hello", { minLength: "0" })).toBe(true); // Zero minLength
    });

    describe("initJsDateValidator - Complete Coverage", () => {
      const validate = createValidatorFunction(initJsDateValidator, "date");

      it("should have correct plugin metadata", () => {
        expect(initJsDateValidator.name).toBe("init_js_date");
        expect(initJsDateValidator.description).toBeDefined();
      });

      it("should validate various date formats", async () => {
        expect(await validate("2023-01-01", {})).toBe(true);
        expect(await validate("2023-12-31", {})).toBe(true);
        expect(await validate("2023-01-01T00:00:00Z", {})).toBe(true);
        expect(await validate("2023-01-01T12:30:45", {})).toBe(true);
        expect(await validate("Jan 1, 2023", {})).toBe(true);
        expect(await validate("1/1/2023", {})).toBe(true);
      });

      it("should reject invalid dates", async () => {
        expect(await validate("not-a-date", {})).toBe("Invalid date format");
        expect(await validate("2023-13-01", {})).toBe("Invalid date format"); // Invalid month
        expect(await validate("2023-01-32", {})).toBe("Invalid date format"); // Invalid day
        expect(await validate("", {})).toBe("Invalid date format"); // Empty (unless optional)
      });

      it("should handle optional dates", async () => {
        expect(await validate("", { optional: "true" })).toBe(true);
        expect(await validate("", { optional: "false" })).toBe(
          "Invalid date format"
        );
        expect(await validate("2023-01-01", { optional: "true" })).toBe(true);
      });

      it("should validate minDate constraints", async () => {
        expect(await validate("2023-06-15", { minDate: "2023-01-01" })).toBe(
          true
        );
        expect(await validate("2023-01-01", { minDate: "2023-01-01" })).toBe(
          true
        ); // Equal
        expect(await validate("2022-12-31", { minDate: "2023-01-01" })).toBe(
          "Date must be after 2023-01-01"
        );
      });

      it("should validate maxDate constraints", async () => {
        expect(await validate("2023-06-15", { maxDate: "2023-12-31" })).toBe(
          true
        );
        expect(await validate("2023-12-31", { maxDate: "2023-12-31" })).toBe(
          true
        ); // Equal
        expect(await validate("2024-01-01", { maxDate: "2023-12-31" })).toBe(
          "Date must be before 2023-12-31"
        );
      });

      it("should validate date range constraints", async () => {
        const params = { minDate: "2023-01-01", maxDate: "2023-12-31" };
        expect(await validate("2023-06-15", params)).toBe(true);
        expect(await validate("2023-01-01", params)).toBe(true);
        expect(await validate("2023-12-31", params)).toBe(true);
        expect(await validate("2022-12-31", params)).toBe(
          "Date must be after 2023-01-01"
        );
        expect(await validate("2024-01-01", params)).toBe(
          "Date must be before 2023-12-31"
        );
      });

      it("should handle various date string formats", async () => {
        const validDates = [
          "2023-01-01",
          "01/01/2023",
          "January 1, 2023",
          "Jan 1, 2023",
          "2023-01-01T12:00:00",
          "2023-01-01T12:00:00Z",
          "2023-01-01T12:00:00-05:00",
        ];

        for (const date of validDates) {
          expect(await validate(date, {})).toBe(true);
        }
      });
    });

    describe("Integration and Edge Cases", () => {
      it("should handle all validators with empty params", async () => {
        expect(
          await createValidatorFunction(initJsUrlValidator, "url")(
            "https://example.com",
            {}
          )
        ).toBe(true);
        expect(
          await createValidatorFunction(initJsNumberValidator, "number")(
            "42",
            {}
          )
        ).toBe(true);
        expect(
          await createValidatorFunction(initJsStringValidator, "string")(
            "hello",
            {}
          )
        ).toBe(true);
        expect(
          await createValidatorFunction(initJsDateValidator, "date")(
            "2023-01-01",
            {}
          )
        ).toBe(true);
      });

      it("should handle all validators with undefined params", async () => {
        expect(
          await createValidatorFunction(initJsUrlValidator, "url")(
            "https://example.com",
            {}
          )
        ).toBe(true);
        expect(
          await createValidatorFunction(initJsNumberValidator, "number")(
            "42",
            {}
          )
        ).toBe(true);
        expect(
          await createValidatorFunction(initJsStringValidator, "string")(
            "hello",
            {}
          )
        ).toBe(true);
        expect(
          await createValidatorFunction(initJsDateValidator, "date")(
            "2023-01-01",
            {}
          )
        ).toBe(true);
      });

      it("should provide proper error messages for all validators when validation fails", async () => {
        expect(
          await createValidatorFunction(initJsUrlValidator, "url")(
            "invalid-url",
            {}
          )
        ).toBe("Invalid URL format");
        expect(
          await createValidatorFunction(initJsNumberValidator, "number")(
            "not-a-number",
            {}
          )
        ).toBe("Must be a valid number");
        expect(
          await createValidatorFunction(initJsStringValidator, "string")("", {
            optional: "false",
          })
        ).toBe("This field is required");
        expect(
          await createValidatorFunction(initJsDateValidator, "date")(
            "invalid-date",
            {}
          )
        ).toBe("Invalid date format");
      });
    });
  });
});
