import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateParserService } from '../../src/services/TemplateParserService.js';
import { ConfigService } from '../../src/services/ConfigService.js';
import { ValidationService, type IValidationService } from '../../src/index.js';

describe('TemplateParserService', () => {
  let templateParserService: TemplateParserService;
  let validationService: IValidationService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    validationService = new ValidationService(configService);
    templateParserService = new TemplateParserService(configService, validationService);
  });

  it('should parse simple field', () => {
    const content = 'TEST_VAR={{string|value=template_value}}';
    const result = templateParserService.parseTemplate(content);
    
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('TEST_VAR');
    expect(result[0]!.type).toBe('string');
    expect(result[0]!.options.value).toBe('template_value');
  });

  it('should parse field with options', () => {
    const content = 'DATABASE_URL={{string|value=postgres://user:pass@localhost:5432/db|description=Database connection string|required=true}}';
    const result = templateParserService.parseTemplate(content);
    
    expect(result).toHaveLength(1);
    
    const field = result[0]!;
    expect(field.key).toBe('DATABASE_URL');
    expect(field.type).toBe('string');
    expect(field.options.value).toBe('postgres://user:pass@localhost:5432/db');
    expect(field.options.description).toBe('Database connection string');
    expect(field.options.required).toBe(true);
  });

  it('should parse field with transformer', () => {
    const content = 'NEXT_PUBLIC_API_URL={{string|value=http://localhost:3001|transformer=extract_hostname}}';
    const result = templateParserService.parseTemplate(content);
    
    expect(result).toHaveLength(1);
    
    const field = result[0]!;
    expect(field.options.transformer).toBe('extract_hostname');
  });

  it('should skip empty lines and comments', () => {
    const content = `# This is a comment
    
TEST_VAR={{string|value=test}}

# Another comment`;
    
    const result = templateParserService.parseTemplate(content);
    
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('TEST_VAR');
  });

  it('should set correct line numbers', () => {
    const content = `# Comment on line 1
TEST_VAR1={{string|value=test1}}
# Comment on line 3
TEST_VAR2={{string|value=test2}}`;
    
    const result = templateParserService.parseTemplate(content);
    
    expect(result).toHaveLength(2);
    expect(result[0]!.lineNumber).toBe(2);
    expect(result[1]!.lineNumber).toBe(4);
  });

  it('should handle fields with groups', () => {
    const content = `TEST_VAR={{string|value=test|group=database}}`;
    
    const result = templateParserService.parseTemplate(content);
    
    expect(result).toHaveLength(1);
    expect(result[0]!.group).toBe('database');
  });
});
