import { describe, it, expect, beforeEach, vi } from "vitest";
import { GroupingService } from "../../src/services/GroupingService.js";
import type {
  TemplateField,
  GroupConfiguration,
  IConfigService,
} from "../../src/types/index.js";

describe("GroupingService", () => {
  let groupingService: GroupingService;
  let mockConfigService: IConfigService;

  const sampleFields: TemplateField[] = [
    {
      key: "DATABASE_URL",
      type: "url",
      lineNumber: 1,
      rawLine: "DATABASE_URL=postgresql://localhost:5432/mydb",
      options: {},
    },
    {
      key: "DATABASE_HOST",
      type: "string",
      lineNumber: 2,
      rawLine: "DATABASE_HOST=localhost",
      options: {},
    },
    {
      key: "API_KEY",
      type: "string",
      lineNumber: 3,
      rawLine: "API_KEY=secret-key-123",
      options: {},
    },
    {
      key: "API_URL",
      type: "url",
      lineNumber: 4,
      rawLine: "API_URL=https://api.example.com",
      options: {},
    },
    {
      key: "REDIS_URL",
      type: "url",
      lineNumber: 5,
      rawLine: "REDIS_URL=redis://localhost:6379",
      options: {},
    },
    {
      key: "REDIS_PORT",
      type: "port",
      lineNumber: 6,
      rawLine: "REDIS_PORT=6379",
      options: {},
    },
    {
      key: "STANDALONE_VAR",
      type: "string",
      lineNumber: 7,
      rawLine: "STANDALONE_VAR=value",
      options: {},
    },
  ];

  beforeEach(() => {
    mockConfigService = {
      serviceName: "ConfigService",
      setDebugMode: vi.fn(),
      getConfig: vi.fn().mockReturnValue({ debug: false, interactive: true }),
      updateConfig: vi.fn(),
      debug: vi.fn(),
      addDebugHandler: vi.fn(),
      removeDebugHandler: vi.fn(),
      validateConfig: vi
        .fn()
        .mockReturnValue({ valid: true, errors: [], warnings: [] }),
    };

    groupingService = new GroupingService(mockConfigService);
  });

  describe("groupFields", () => {
    it("should auto-detect groups when no configuration provided", () => {
      const result = groupingService.groupFields(sampleFields);

      expect(result.groups.has("DATABASE")).toBe(true);
      expect(result.groups.has("API")).toBe(true);
      expect(result.groups.has("REDIS")).toBe(true);

      expect(result.groups.get("DATABASE")).toHaveLength(2);
      expect(result.groups.get("API")).toHaveLength(2);
      expect(result.groups.get("REDIS")).toHaveLength(2);
      expect(result.ungrouped).toHaveLength(1);
    });

    it("should use explicit group configuration when provided", () => {
      const config: GroupConfiguration = {
        groups: {
          DATABASE: "Database Configuration",
          EXTERNAL: "External Services",
        },
        autoDetect: false,
        ungroupedTitle: "Other Settings",
      };

      const fieldsWithGroups: TemplateField[] = [
        { ...sampleFields[0]!, group: "DATABASE" },
        { ...sampleFields[1]!, group: "DATABASE" },
        { ...sampleFields[2]!, group: "EXTERNAL" },
        { ...sampleFields[3]!, group: "EXTERNAL" },
      ];

      const result = groupingService.groupFields(fieldsWithGroups, config);

      expect(result.groups.get("DATABASE")).toHaveLength(2);
      expect(result.groups.get("EXTERNAL")).toHaveLength(2);
      expect(result.groupTitles.get("DATABASE")).toBe("Database Configuration");
      expect(result.groupTitles.get("EXTERNAL")).toBe("External Services");
    });

    it("should handle mixed explicit and auto-detected groups", () => {
      const config: GroupConfiguration = {
        groups: {
          CUSTOM: "Custom Group",
        },
        autoDetect: true,
        ungroupedTitle: "General",
      };

      const fieldsWithCustomGroup = [
        { ...sampleFields[0]!, group: "CUSTOM" },
        ...sampleFields.slice(1),
      ];

      const result = groupingService.groupFields(fieldsWithCustomGroup, config);

      expect(result.groups.has("CUSTOM")).toBe(true);
      expect(result.groups.has("DATABASE")).toBe(true);
      expect(result.groups.get("CUSTOM")).toHaveLength(1);
    });

    it("should order groups logically", () => {
      const result = groupingService.groupFields(sampleFields);

      expect(result.groupOrder).toContain("DATABASE");
      expect(result.groupOrder).toContain("API");
      expect(result.groupOrder).toContain("REDIS");

      // DATABASE should come before other groups (priority order)
      const databaseIndex = result.groupOrder.indexOf("DATABASE");
      const apiIndex = result.groupOrder.indexOf("API");
      expect(databaseIndex).toBeLessThan(apiIndex);
    });
  });

  describe("parseExplicitGroups", () => {
    it("should parse valid JSON group configuration", () => {
      const configString = JSON.stringify({
        groups: {
          DATABASE: "Database Settings",
          API: "API Configuration",
        },
      });

      const result = groupingService.parseExplicitGroups(configString);

      expect(result).toEqual({
        DATABASE: "Database Settings",
        API: "API Configuration",
      });
    });

    it("should return empty object for invalid JSON", () => {
      const invalidJson = "{ invalid json }";

      const result = groupingService.parseExplicitGroups(invalidJson);

      expect(result).toEqual({});
    });

    it("should return empty object when groups property is missing", () => {
      const configString = JSON.stringify({
        someOtherProperty: "value",
      });

      const result = groupingService.parseExplicitGroups(configString);

      expect(result).toEqual({});
    });
  });

  describe("extractGroupConfiguration", () => {
    it("should extract configuration from SYSTEM_ENV_TEMPLATE_CONFIG field", () => {
      const configField: TemplateField = {
        key: "SYSTEM_ENV_TEMPLATE_CONFIG",
        type: "string",
        lineNumber: 1,
        rawLine: "SYSTEM_ENV_TEMPLATE_CONFIG={}",
        options: {
          value: JSON.stringify({
            groups: {
              DATABASE: "Database Configuration",
              API: "API Settings",
            },
          }),
        },
      };

      const fieldsWithConfig = [configField, ...sampleFields];

      const result =
        groupingService.extractGroupConfiguration(fieldsWithConfig);

      expect(result).not.toBeNull();
      expect(result?.groups).toEqual({
        DATABASE: "Database Configuration",
        API: "API Settings",
      });
      expect(result?.autoDetect).toBe(false);
    });

    it("should return null when no config field exists", () => {
      const result = groupingService.extractGroupConfiguration(sampleFields);

      expect(result).toBeNull();
    });

    it("should enable auto-detect when no explicit groups provided", () => {
      const configField: TemplateField = {
        key: "SYSTEM_ENV_TEMPLATE_CONFIG",
        type: "string",
        lineNumber: 1,
        rawLine: "SYSTEM_ENV_TEMPLATE_CONFIG={}",
        options: {
          value: JSON.stringify({}),
        },
      };

      const fieldsWithConfig = [configField, ...sampleFields];

      const result =
        groupingService.extractGroupConfiguration(fieldsWithConfig);

      expect(result?.autoDetect).toBe(true);
    });
  });

  describe("autoDetectGroups", () => {
    it("should detect groups from field prefixes", () => {
      const result = groupingService.autoDetectGroups(sampleFields);

      expect(result).toHaveProperty("DATABASE");
      expect(result).toHaveProperty("API");
      expect(result).toHaveProperty("REDIS");
      expect(result).not.toHaveProperty("STANDALONE"); // Only one field
    });

    it("should require at least 2 fields for group creation", () => {
      const singleFields: TemplateField[] = [
        {
          key: "SINGLE_VAR",
          type: "string",
          lineNumber: 1,
          rawLine: "SINGLE_VAR=value",
          options: {},
        },
        {
          key: "ANOTHER_SINGLE",
          type: "string",
          lineNumber: 2,
          rawLine: "ANOTHER_SINGLE=value",
          options: {},
        },
      ];

      const result = groupingService.autoDetectGroups(singleFields);

      expect(Object.keys(result)).toHaveLength(0);
    });

    it("should ignore SYSTEM_ENV_TEMPLATE_CONFIG field", () => {
      const fieldsWithSystemConfig = [
        {
          key: "SYSTEM_ENV_TEMPLATE_CONFIG",
          type: "string",
          lineNumber: 1,
          rawLine: "SYSTEM_ENV_TEMPLATE_CONFIG={}",
          options: {},
        },
        ...sampleFields,
      ];

      const result = groupingService.autoDetectGroups(fieldsWithSystemConfig);

      expect(result).not.toHaveProperty("SYSTEM");
    });
  });

  describe("generateGroupTitle", () => {
    it("should handle special cases", () => {
      expect(groupingService.generateGroupTitle("NEXT_PUBLIC")).toBe(
        "Next.js Public Configuration"
      );
      expect(groupingService.generateGroupTitle("DATABASE")).toBe(
        "Database Configuration"
      );
      expect(groupingService.generateGroupTitle("API")).toBe(
        "API Configuration"
      );
      expect(groupingService.generateGroupTitle("AUTH")).toBe(
        "Authentication Configuration"
      );
    });

    it("should generate title from key for custom groups", () => {
      expect(groupingService.generateGroupTitle("CUSTOM_SERVICE")).toBe(
        "Custom Service Configuration"
      );
      expect(groupingService.generateGroupTitle("PAYMENT")).toBe(
        "Payment Configuration"
      );
    });

    it("should handle single word keys", () => {
      expect(groupingService.generateGroupTitle("REDIS")).toBe(
        "Redis Configuration"
      );
    });
  });

  describe("assignFieldToGroup", () => {
    const groups = {
      DATABASE: "Database Configuration",
      API: "API Configuration",
    };

    it("should assign field by explicit group property", () => {
      const field: TemplateField = {
        key: "TEST_VAR",
        type: "string",
        lineNumber: 1,
        rawLine: "TEST_VAR=value",
        group: "DATABASE",
        options: {},
      };

      const result = groupingService.assignFieldToGroup(field, groups);

      expect(result).toBe("DATABASE");
    });

    it("should assign field by options.group", () => {
      const field: TemplateField = {
        key: "TEST_VAR",
        type: "string",
        lineNumber: 1,
        rawLine: "TEST_VAR=value",
        options: { group: "API" },
      };

      const result = groupingService.assignFieldToGroup(field, groups);

      expect(result).toBe("API");
    });

    it("should assign field by prefix matching", () => {
      const field: TemplateField = {
        key: "DATABASE_URL",
        type: "url",
        lineNumber: 1,
        rawLine: "DATABASE_URL=value",
        options: {},
      };

      const result = groupingService.assignFieldToGroup(field, groups);

      expect(result).toBe("DATABASE");
    });

    it("should return null when no group matches", () => {
      const field: TemplateField = {
        key: "UNMATCHED_VAR",
        type: "string",
        lineNumber: 1,
        rawLine: "UNMATCHED_VAR=value",
        options: {},
      };

      const result = groupingService.assignFieldToGroup(field, groups);

      expect(result).toBeNull();
    });

    it("should prioritize explicit group over prefix", () => {
      const field: TemplateField = {
        key: "DATABASE_URL",
        type: "url",
        lineNumber: 1,
        rawLine: "DATABASE_URL=value",
        group: "API",
        options: {},
      };

      const result = groupingService.assignFieldToGroup(field, groups);

      expect(result).toBe("API");
    });
  });

  describe("prioritizeGroups", () => {
    it("should prioritize system groups first", () => {
      const groupNames = ["CUSTOM", "API", "DATABASE", "REDIS"];

      const result = groupingService.prioritizeGroups(groupNames);

      expect(result.indexOf("DATABASE")).toBeLessThan(result.indexOf("API"));
      expect(result.indexOf("API")).toBeLessThan(result.indexOf("REDIS"));
      expect(result.indexOf("REDIS")).toBeLessThan(result.indexOf("CUSTOM"));
    });

    it("should sort non-priority groups alphabetically", () => {
      const groupNames = ["ZEBRA", "ALPHA", "BETA"];

      const result = groupingService.prioritizeGroups(groupNames);

      expect(result).toEqual(["ALPHA", "BETA", "ZEBRA"]);
    });

    it("should handle mixed priority and non-priority groups", () => {
      const groupNames = ["ZEBRA", "DATABASE", "ALPHA", "API"];

      const result = groupingService.prioritizeGroups(groupNames);

      expect(result[0]).toBe("DATABASE");
      expect(result[1]).toBe("API");
      expect(result[2]).toBe("ALPHA");
      expect(result[3]).toBe("ZEBRA");
    });
  });

  describe("orderGroups", () => {
    it("should order groups using prioritization logic", () => {
      const groups = new Map([
        ["CUSTOM", sampleFields.slice(0, 1)],
        ["DATABASE", sampleFields.slice(1, 3)],
        ["API", sampleFields.slice(3, 5)],
      ]);

      const config: GroupConfiguration = {
        groups: {},
        autoDetect: true,
        ungroupedTitle: "General",
      };

      const result = groupingService.orderGroups(groups, config);

      expect(result[0]).toBe("DATABASE");
      expect(result[1]).toBe("API");
      expect(result[2]).toBe("CUSTOM");
    });

    it("should exclude empty groups", () => {
      const groups = new Map([
        ["DATABASE", sampleFields.slice(0, 2)],
        ["EMPTY", []],
        ["API", sampleFields.slice(2, 4)],
      ]);

      const config: GroupConfiguration = {
        groups: {},
        autoDetect: true,
        ungroupedTitle: "General",
      };

      const result = groupingService.orderGroups(groups, config);

      expect(result).not.toContain("EMPTY");
      expect(result).toContain("DATABASE");
      expect(result).toContain("API");
    });
  });

  describe("validateGroupConfiguration", () => {
    it("should validate correct configuration", () => {
      const config: GroupConfiguration = {
        groups: {
          DATABASE: "Database Configuration",
          API: "API Settings",
        },
        autoDetect: true,
        ungroupedTitle: "General Configuration",
      };

      const result = groupingService.validateGroupConfiguration(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing groups object", () => {
      const config = {
        autoDetect: true,
        ungroupedTitle: "General",
      } as GroupConfiguration;

      const result = groupingService.validateGroupConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Groups configuration must be an object");
    });

    it("should detect empty group keys", () => {
      const config: GroupConfiguration = {
        groups: {
          "": "Empty Key Group",
          VALID: "Valid Group",
        },
        autoDetect: true,
        ungroupedTitle: "General",
      };

      const result = groupingService.validateGroupConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Group keys cannot be empty");
    });

    it("should warn about empty group titles", () => {
      const config: GroupConfiguration = {
        groups: {
          DATABASE: "",
          API: "API Configuration",
        },
        autoDetect: true,
        ungroupedTitle: "General",
      };

      const result = groupingService.validateGroupConfiguration(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("Group 'DATABASE' has empty title");
    });

    it("should warn about empty ungrouped title", () => {
      const config: GroupConfiguration = {
        groups: {
          DATABASE: "Database Configuration",
        },
        autoDetect: true,
        ungroupedTitle: "",
      };

      const result = groupingService.validateGroupConfiguration(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "Ungrouped title is empty, using default"
      );
    });
  });

  describe("serviceName", () => {
    it("should have correct service name", () => {
      expect(groupingService.serviceName).toBe("GroupingService");
    });
  });
});
