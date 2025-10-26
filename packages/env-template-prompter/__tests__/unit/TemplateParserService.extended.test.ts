import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateParserService } from '../../src/services/TemplateParserService.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import { ValidationService } from '../../src/services/ValidationService.js';
import type { TemplateField } from '../../src/types/index.js';

describe('TemplateParserService - Extended Tests', () => {
  let templateParserService: TemplateParserService;
  let configService: ConfigService;
  let validationService: ValidationService;

  beforeEach(() => {
    configService = new ConfigService({ debugMode: false });
    validationService = new ValidationService(configService);
    templateParserService = new TemplateParserService(configService, validationService);
  });

  describe('Template Parsing', () => {
    it('should parse complex template with all field types', () => {
      const template = `
# Database Configuration
DATABASE_URL={{string|value=postgres://localhost:5432/app|description=Database connection URL}}
DATABASE_PORT={{number|min=1000|max=65535|allow=5432|description=Database port}}
DATABASE_SSL={{boolean|value=true|description=Enable SSL for database}}

# API Configuration  
API_KEY={{string|min_length=32|max_length=64|description=API secret key}}
API_RATE_LIMIT={{number|value=100|description=Requests per minute}}

# Feature Flags
ENABLE_LOGGING={{boolean|value=false|description=Enable debug logging}}
CORS_ORIGINS={{string|transformer=cors_origins|auto_generate=true|description=CORS allowed origins}}
      `.trim();

      const fields = templateParserService.parseTemplate(template);

      expect(fields).toHaveLength(7);
      
      // Check DATABASE_URL field
      const dbUrl = fields.find(f => f.key === 'DATABASE_URL');
      expect(dbUrl).toBeDefined();
      expect(dbUrl!.type).toBe('string');
      expect(dbUrl!.options.value).toBe('postgres://localhost:5432/app');
      expect(dbUrl!.options.description).toBe('Database connection URL');

      // Check DATABASE_PORT field with constraints
      const dbPort = fields.find(f => f.key === 'DATABASE_PORT');
      expect(dbPort).toBeDefined();
      expect(dbPort!.type).toBe('number');
      expect(dbPort!.options.min).toBe(1000);
      expect(dbPort!.options.max).toBe(65535);
      expect(dbPort!.options.allow).toBe(5432);

      // Check transformer field
      const corsOrigins = fields.find(f => f.key === 'CORS_ORIGINS');
      expect(corsOrigins).toBeDefined();
      expect(corsOrigins!.options.transformer).toBe('cors_origins');
      expect(corsOrigins!.options.auto_generate).toBe(true);
    });

    it('should handle template with variable references', () => {
      const template = `
API_URL={{string|value=http://localhost:3001|description=API base URL}}
API_PORT={{number|transformer=extract_port|source=@{API_URL}|auto_derive=true}}
API_HOST={{string|transformer=extract_hostname|source=@{API_URL}|auto_derive=true}}
DATABASE_URL={{string|value=postgres://\${API_HOST}:5432/app}}
      `.trim();

      const fields = templateParserService.parseTemplate(template);
      
      console.log(fields);

      expect(fields).toHaveLength(4);

      const apiPort = fields.find(f => f.key === 'API_PORT');
      expect(apiPort!.options.source).toBe('@{API_URL}');
      expect(apiPort!.options.auto_derive).toBe(true);

      const dbUrl = fields.find(f => f.key === 'DATABASE_URL');
      expect(dbUrl!.options.value).toBe('postgres://${API_HOST}:5432/app');
    });

    it('should parse explicit group configuration', () => {
      const template = `
SYSTEM_ENV_TEMPLATE_CONFIG={{string|value={"groups":{"DATABASE":"Database Settings","API":"API Configuration","FEATURES":"Feature Flags"}}}}

DATABASE_URL={{string|group=DATABASE|description=Database URL}}
DATABASE_PORT={{number|group=DATABASE|description=Database port}}

API_KEY={{string|group=API|description=API key}}
API_URL={{string|group=API|description=API URL}}

ENABLE_FEATURE_X={{boolean|group=FEATURES|description=Enable feature X}}
      `.trim();

      const fields = templateParserService.parseTemplate(template);

      expect(fields).toHaveLength(6);

      // Check group assignments
      const dbUrl = fields.find(f => f.key === 'DATABASE_URL');
      expect(dbUrl!.options.group).toBe('DATABASE');

      const apiKey = fields.find(f => f.key === 'API_KEY');
      expect(apiKey!.options.group).toBe('API');

      const featureFlag = fields.find(f => f.key === 'ENABLE_FEATURE_X');
      expect(featureFlag!.options.group).toBe('FEATURES');
    });

    it('should handle malformed field definitions gracefully', () => {
      const template = `
VALID_FIELD={{string|value=test}}
MALFORMED_FIELD={{invalid_syntax
ANOTHER_VALID={{number|value=123}}
MISSING_BRACES=string|value=test
EMPTY_DEFINITION={{}}
      `.trim();

      const fields = templateParserService.parseTemplate(template);

      // Should only parse valid fields
      expect(fields).toHaveLength(3); // VALID_FIELD, ANOTHER_VALID, EMPTY_DEFINITION
      
      const validField = fields.find(f => f.key === 'VALID_FIELD');
      expect(validField).toBeDefined();
      expect(validField!.options.value).toBe('test');

      const anotherValid = fields.find(f => f.key === 'ANOTHER_VALID');
      expect(anotherValid).toBeDefined();
      expect(anotherValid!.options.value).toBe(123);
    });

    it('should preserve line numbers for error reporting', () => {
      const template = `# Header comment
DATABASE_URL={{string|value=test}}

# Another comment
API_KEY={{string|value=secret}}

FINAL_FIELD={{number|value=123}}`;

      const fields = templateParserService.parseTemplate(template);

      expect(fields).toHaveLength(3);
      expect(fields[0]!.lineNumber).toBe(2); // DATABASE_URL
      expect(fields[1]!.lineNumber).toBe(5); // API_KEY  
      expect(fields[2]!.lineNumber).toBe(7); // FINAL_FIELD
    });

    it('should handle templates with only comments', () => {
      const template = `
# This is a comment
# Another comment
## Header comment
      `.trim();

      const fields = templateParserService.parseTemplate(template);
      expect(fields).toHaveLength(0);
    });

    it('should handle empty templates', () => {
      const fields = templateParserService.parseTemplate('');
      expect(fields).toHaveLength(0);
    });

    it('should handle templates with whitespace variations', () => {
      const template = `
        DATABASE_URL={{string|value=test}}
API_KEY=    {{string|value=secret}}    
  FINAL_FIELD  ={{number|value=123}}
      `.trim();

      const fields = templateParserService.parseTemplate(template);

      expect(fields).toHaveLength(3);
      expect(fields[0]!.key).toBe('DATABASE_URL');
      expect(fields[1]!.key).toBe('API_KEY');
      expect(fields[2]!.key).toBe('FINAL_FIELD');
    });
  });

  describe('Field Definition Extraction', () => {
    it('should extract field with all option types', () => {
      const line = 'COMPLEX_FIELD={{string|value=default|min_length=5|max_length=50|pattern=^[A-Za-z]+$|description=A complex field|required=true|transformer=uppercase|source=@{OTHER_FIELD}|auto_derive=false|group=ADVANCED}}';

      const field = templateParserService.extractFieldDefinition(line);

      expect(field).toBeDefined();
      expect(field!.key).toBe('COMPLEX_FIELD');
      expect(field!.type).toBe('string');
      expect(field!.options.value).toBe('default');
      expect(field!.options.min_length).toBe(5);
      expect(field!.options.max_length).toBe(50);
      expect(field!.options.pattern).toBe('^[A-Za-z]+$');
      expect(field!.options.description).toBe('A complex field');
      expect(field!.options.required).toBe(true);
      expect(field!.options.transformer).toBe('uppercase');
      expect(field!.options.source).toBe('@{OTHER_FIELD}');
      expect(field!.options.auto_derive).toBe(false);
      expect(field!.options.group).toBe('ADVANCED');
    });

    it('should handle numeric option values', () => {
      const line = 'PORT={{number|value=3000|min=1000|max=65535|allow=80,443}}';

      const field = templateParserService.extractFieldDefinition(line);

      expect(field).toBeDefined();
      expect(field!.options.value).toBe(3000);
      expect(field!.options.min).toBe(1000);
      expect(field!.options.max).toBe(65535);
      expect(field!.options.allow).toBe('80,443'); // String for allow list
    });

    it('should handle boolean option values', () => {
      const line = 'FLAG={{boolean|value=true|required=false|auto_derive=true}}';

      const field = templateParserService.extractFieldDefinition(line);

      expect(field).toBeDefined();
      expect(field!.options.value).toBe(true);
      expect(field!.options.required).toBe(false);
      expect(field!.options.auto_derive).toBe(true);
    });

    it('should handle quoted string values', () => {
      const line = 'MESSAGE={{string|value="Hello, World!"|description="A greeting message"}}';

      const field = templateParserService.extractFieldDefinition(line);

      expect(field).toBeDefined();
      expect(field!.options.value).toBe('Hello, World!');
      expect(field!.options.description).toBe('A greeting message');
    });

    it('should handle URL values with special characters', () => {
      const line = 'DATABASE_URL={{string|value=postgres://user:pass@localhost:5432/db?ssl=true&timeout=30}}';

      const field = templateParserService.extractFieldDefinition(line);

      expect(field).toBeDefined();
      expect(field!.options.value).toBe('postgres://user:pass@localhost:5432/db?ssl=true&timeout=30');
    });

    it('should return null for invalid field definitions', () => {
      const invalidLines = [
        'INVALID', // No definition
        'INVALID=', // No value
        'INVALID={{', // Incomplete
        'INVALID=}}', // Wrong format
        '{{string}}', // No key
        ''  // Empty line
      ];

      for (const line of invalidLines) {
        const field = templateParserService.extractFieldDefinition(line);
        expect(field).toBeNull();
      }
    });
  });

  describe('Field Options Parsing', () => {
    it('should parse simple options', () => {
      const options = templateParserService.parseFieldOptions('string|value=test|description=A test field');

      expect(options.value).toBe('test');
      expect(options.description).toBe('A test field');
    });

    it('should handle options with special characters', () => {
      const options = templateParserService.parseFieldOptions('string|value=http://localhost:3000/api?key=test&id=123|description=API endpoint with query params');

      expect(options.value).toBe('http://localhost:3000/api?key=test&id=123');
      expect(options.description).toBe('API endpoint with query params');
    });

    it('should handle options with equals signs in values', () => {
      const options = templateParserService.parseFieldOptions('string|value=SELECT * FROM users WHERE id = 1|description=SQL query');

      expect(options.value).toBe('SELECT * FROM users WHERE id = 1');
      expect(options.description).toBe('SQL query');
    });

    it('should handle empty options string', () => {
      const options = templateParserService.parseFieldOptions('');
      expect(Object.keys(options)).toHaveLength(0);
    });

    it('should handle options with no values', () => {
      const options = templateParserService.parseFieldOptions('string|required|auto_derive');

      expect(options.required).toBe(true);
      expect(options.auto_derive).toBe(true);
    });
  });

  describe('Field Type Parsing', () => {
    it('should parse all supported field types', () => {
      const types = ['string', 'number', 'boolean'];

      for (const type of types) {
        const fieldType = templateParserService.parseFieldType(type);
        expect(fieldType).toBe(type);
      }
    });

    it('should default to string for unknown types', () => {
      const unknownTypes = ['unknown', 'invalid', ''];

      for (const type of unknownTypes) {
        const fieldType = templateParserService.parseFieldType(type);
        expect(fieldType).toBe('string');
      }
    });
  });

  describe('Template Structure Validation', () => {
    it('should validate well-formed template structure', () => {
      const fields: TemplateField[] = [
        {
          key: 'DATABASE_URL',
          type: 'string',
          options: { value: 'postgres://localhost:5432/app' },
          rawLine: 'DATABASE_URL={{string|value=postgres://localhost:5432/app}}',
          lineNumber: 1
        },
        {
          key: 'API_PORT',
          type: 'number',
          options: { value: '3000' },
          rawLine: 'API_PORT={{number|value=3000}}',
          lineNumber: 2
        }
      ];

      const result = templateParserService.validateTemplateStructure(fields);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate field keys', () => {
      const fields: TemplateField[] = [
        {
          key: 'DATABASE_URL',
          type: 'string',
          options: { value: 'test1' },
          rawLine: 'DATABASE_URL={{string|value=test1}}',
          lineNumber: 1
        },
        {
          key: 'DATABASE_URL',
          type: 'string',
          options: { value: 'test2' },
          rawLine: 'DATABASE_URL={{string|value=test2}}',
          lineNumber: 3
        }
      ];

      const result = templateParserService.validateTemplateStructure(fields);

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('DATABASE_URL')]));
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Duplicate')]));
    });

    it('should detect invalid field references', () => {
      const fields: TemplateField[] = [
        {
          key: 'API_PORT',
          type: 'number',
          options: { transformer: 'extract_port', source: '@{API_URL}' },
          rawLine: 'API_PORT={{number|transformer=extract_port|source=@{API_URL}}}',
          lineNumber: 1
        }
        // API_URL is referenced but not defined
      ];

      const result = templateParserService.validateTemplateStructure(fields);

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('API_URL')]));
      expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Transformer source')]));
    });
  });

  describe('Include Resolution', () => {
    it('should identify include statements', () => {
      const template = `
DATABASE_URL={{string|value=test}}
# @include database.template
API_KEY={{string|value=secret}}
      `.trim();

      const resolved = templateParserService.resolveIncludes(template);

      expect(resolved).toContain('# Include: database.template (not implemented)');
      expect(resolved).toContain('DATABASE_URL={{string|value=test}}');
      expect(resolved).toContain('API_KEY={{string|value=secret}}');
    });

    it('should handle multiple includes', () => {
      const template = `
# @include auth.template
# @include database.template
# @include api.template
      `.trim();

      const resolved = templateParserService.resolveIncludes(template);

      expect(resolved).toContain('# Include: auth.template (not implemented)');
      expect(resolved).toContain('# Include: database.template (not implemented)');
      expect(resolved).toContain('# Include: api.template (not implemented)');
    });

    it('should handle templates without includes', () => {
      const template = `
DATABASE_URL={{string|value=test}}
API_KEY={{string|value=secret}}
      `.trim();

      const resolved = templateParserService.resolveIncludes(template);

      expect(resolved).toBe(template); // Should be unchanged
    });
  });

  describe('Comment Extraction', () => {
    it('should extract comments and associate them with fields', () => {
      const template = `
# Database Configuration Section
# This configures the database connection
DATABASE_URL={{string|value=test}}

# API Configuration
API_KEY={{string|value=secret}}
      `.trim();

      const comments = templateParserService.extractComments(template);

      expect(comments.size).toBeGreaterThan(0);
    });

    it('should handle templates with no comments', () => {
      const template = `
DATABASE_URL={{string|value=test}}
API_KEY={{string|value=secret}}
      `.trim();

      const comments = templateParserService.extractComments(template);

      // Should handle gracefully even with no comments
      expect(comments).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large templates efficiently', () => {
      // Generate a large template
      const lines = [];
      for (let i = 0; i < 1000; i++) {
        lines.push(`FIELD_${i}={{string|value=value_${i}|description=Field number ${i}}}`);
      }
      const largeTemplate = lines.join('\n');

      const start = performance.now();
      const fields = templateParserService.parseTemplate(largeTemplate);
      const end = performance.now();

      expect(fields).toHaveLength(1000);
      expect(end - start).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle complex field definitions efficiently', () => {
      const complexTemplate = Array.from({ length: 100 }, (_, i) => 
        `COMPLEX_FIELD_${i}={{string|value=very_long_default_value_${i}_with_lots_of_text|min_length=10|max_length=100|pattern=^[A-Za-z0-9_-]+$|description=A very complex field with many options and constraints|required=true|transformer=complex_transformer|source=@{OTHER_FIELD_${i}}|auto_derive=false|group=COMPLEX_GROUP_${i % 5}}}`
      ).join('\n');

      const start = performance.now();
      const fields = templateParserService.parseTemplate(complexTemplate);
      const end = performance.now();

      expect(fields).toHaveLength(100);
      expect(end - start).toBeLessThan(2000); // Should complete efficiently
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in options gracefully', () => {
      const line = 'BAD_JSON={{string|value={malformed json}|description=test}}';

      const field = templateParserService.extractFieldDefinition(line);

      expect(field).toBeDefined();
      expect(field!.options.value).toBe('{malformed json}'); // Should treat as string
    });

    it('should handle extremely long field definitions', () => {
      const longValue = 'x'.repeat(10000);
      const line = `LONG_FIELD={{string|value=${longValue}|description=A very long field}}`;

      const field = templateParserService.extractFieldDefinition(line);

      expect(field).toBeDefined();
      expect(field!.options.value).toBe(longValue);
    });

    it('should handle unicode characters in field definitions', () => {
      const line = 'UNICODE_FIELD={{string|value=café_🚀_中文|description=Field with unicode chars}}';

      const field = templateParserService.extractFieldDefinition(line);

      expect(field).toBeDefined();
      expect(field!.options.value).toBe('café_🚀_中文');
    });
  });
});
