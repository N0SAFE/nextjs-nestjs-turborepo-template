# Feature Specification: Environment Configuration Management System

**Feature Branch**: `002-env-config-system`  
**Created**: 2025-11-02  
**Status**: Draft  
**Input**: User description: "Create a new package that handles creating .env file from example .env file with plugin-based validation and transformation system using YAML format with pipe-based semantic syntax"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate Environment File from Template (Priority: P1)

A developer clones a new project and needs to set up their local environment. They run a configuration command that reads a YAML template file and generates a `.env` file with all required environment variables.

**Why this priority**: This is the core functionality - without it, developers cannot initialize their environment. This provides immediate value by automating environment setup.

**Independent Test**: Can be fully tested by providing a simple YAML template with basic variable definitions (e.g., `API_KEY`, `PORT`) and verifying that a correctly formatted `.env` file is generated.

**Acceptance Scenarios**:

1. **Given** a YAML template file with basic environment variable definitions, **When** the generation command is executed in interactive mode, **Then** the user is prompted for each variable value and a `.env` file is created
2. **Given** a YAML template with default values specified, **When** the generation command is executed, **Then** the `.env` file contains variables with their default values
3. **Given** an existing `.env` file, **When** the generation command is executed, **Then** the user is prompted to confirm overwrite or the operation is cancelled
4. **Given** a generation command with CLI arguments, **When** arguments are provided for specific variables, **Then** those variables use the argument values without prompting
5. **Given** a generation command in CI mode (with --ci flag), **When** a required variable or variable without default is missing from arguments, **Then** the command fails with a clear error message

---

### User Story 2 - Validate Environment Variables with Type Checking (Priority: P1)

A developer needs to ensure their environment configuration meets project requirements. The system validates each variable according to validators defined in the YAML template (e.g., URL format, number ranges, required fields).

**Why this priority**: Validation prevents configuration errors that could cause runtime failures. This is critical for reliability and catches issues before deployment.

**Independent Test**: Can be tested by creating a YAML template with various validators (required, number, URL) and verifying that invalid values are rejected while valid ones are accepted.

**Acceptance Scenarios**:

1. **Given** a YAML template with a required validator, **When** a variable is missing from the `.env` file, **Then** validation fails with a clear error message
2. **Given** a YAML template with a number validator specifying min/max, **When** a value outside the range is provided, **Then** validation fails with the constraint violation
3. **Given** a YAML template with a URL validator, **When** an invalid URL format is provided, **Then** validation fails with a format error
4. **Given** all environment variables pass their validators, **When** validation runs, **Then** the system confirms successful validation

---

### User Story 3 - Define Variables Using Pipe-Based Syntax (Priority: P1)

A developer creates or updates the YAML template to define how environment variables should be structured. They use a pipe-based syntax like `string|required:true,default:"localhost"` to specify validators and modifiers.

**Why this priority**: The syntax is the foundation for expressing all configuration rules. Without it, the template cannot describe variable requirements.

**Independent Test**: Can be tested by parsing various pipe-based expressions and verifying they are correctly interpreted into validator and modifier configurations.

**Acceptance Scenarios**:

1. **Given** a variable defined as `string|required:true`, **When** the template is parsed, **Then** a required string validator is configured for that variable
2. **Given** a variable defined as `number|min:0,max:100,default:50`, **When** the template is parsed, **Then** a number validator with range constraints and a default value is configured
3. **Given** a variable with multiple validators `url|protocol:https,required:true`, **When** the template is parsed, **Then** all validators and their arguments are correctly extracted
4. **Given** a variable with duplicate parameters like `string|default:"value1",default:"value2"`, **When** the template is parsed, **Then** a clear error is reported about the duplicate parameter
5. **Given** invalid pipe syntax, **When** the template is parsed, **Then** a clear syntax error is reported with the line number and issue

---

### User Story 4 - Reference Other Variables (Priority: P2)

A developer wants certain variables to derive their values from other variables by default. Using a reference plugin, they can specify that `DATABASE_URL` should use the same value as `PRIMARY_DB_URL` unless explicitly overridden.

**Why this priority**: This reduces duplication and makes configuration more maintainable. It's a common pattern in complex projects but not essential for basic functionality.

**Independent Test**: Can be tested by creating a template where one variable references another, generating the `.env` file, and verifying the referenced value is copied correctly.

**Acceptance Scenarios**:

1. **Given** a variable defined with `reference|source:OTHER_VAR`, **When** the `.env` file is generated and `OTHER_VAR` has a value, **Then** the referencing variable receives the same value
2. **Given** a variable with both reference and default modifiers, **When** the source variable is empty, **Then** the default value is used instead
3. **Given** a variable references a non-existent variable, **When** validation runs, **Then** an error is reported about the missing reference

---

### User Story 5 - Transform Variables with Plugins (Priority: P2)

A developer needs to apply transformations to environment variable values. Using transformation plugins, they can truncate long values, combine multiple variables, or format values in specific ways.

**Why this priority**: Transformations enable advanced configuration scenarios like building connection strings from components or sanitizing values. Useful but not required for basic setup.

**Independent Test**: Can be tested by applying a truncate transformation to a long string value and a concatenation transformation to multiple values, verifying the outputs are correct.

**Acceptance Scenarios**:

1. **Given** a variable with `truncate|length:10`, **When** a value longer than 10 characters is provided, **Then** the value is truncated to 10 characters in the `.env` file
2. **Given** a variable with `concat|sources:VAR1,VAR2,separator:":"`, **When** both source variables exist, **Then** the value is the concatenation of both with the separator
3. **Given** multiple transformation plugins chained together, **When** the transformations are applied, **Then** they execute in the defined order

---

### User Story 7 - Interactive Prompts with Custom Input Types (Priority: P1)

A developer runs the generation command without arguments and is presented with interactive prompts for each environment variable. The prompts use appropriate input types based on the variable definition: select for enumerated options, toggle for booleans, number for numeric values, string for text, multiselect for multiple choices, and autocomplete for predefined suggestions.

**Why this priority**: Interactive mode provides the best developer experience for initial setup and ensures all variables are properly configured with user-friendly interfaces.

**Independent Test**: Can be tested by creating a template with various prompt types and verifying each presents the correct interactive interface and validates input appropriately.

**Acceptance Scenarios**:

1. **Given** a variable defined with `select|options:dev,staging,prod`, **When** the interactive prompt is shown, **Then** the user can choose from the three options using arrow keys
2. **Given** a variable defined with `boolean|default:true`, **When** the interactive prompt is shown, **Then** a toggle interface is presented with the default pre-selected
3. **Given** a variable defined with `number|min:0,max:100`, **When** the user enters a value, **Then** the input is validated against the range constraints in real-time
4. **Given** a variable defined with `multiselect|options:auth,cache,logging`, **When** the interactive prompt is shown, **Then** the user can select multiple options using space bar
5. **Given** a variable defined with `autocomplete|suggestions:localhost,127.0.0.1,0.0.0.0`, **When** the user starts typing, **Then** matching suggestions are displayed
6. **Given** the user is in interactive mode with prompts active, **When** the user presses Ctrl+C to cancel, **Then** the system exits gracefully with exit code 130 (SIGINT) without creating a partial .env file

---

### User Story 8 - CI/CD Integration with Strict Mode (Priority: P2)

A CI/CD pipeline needs to generate environment files programmatically without user interaction. The system runs in CI mode with all variables provided as arguments, failing fast if any required variables or variables without defaults are missing, ensuring the build fails visibly.

**Why this priority**: CI/CD integration is critical for automated deployments but not needed for local development workflows.

**Independent Test**: Can be tested by running the command with --ci flag, providing partial arguments, and verifying it fails appropriately for missing variables.

**Acceptance Scenarios**:

1. **Given** the command runs with --ci flag and all required arguments, **When** executed, **Then** the `.env` file is generated without prompts
2. **Given** the command runs with --ci flag and a required variable is missing, **When** executed, **Then** the command exits with non-zero status and clear error message
3. **Given** the command runs with --ci flag and a variable without default is missing, **When** executed, **Then** the command fails with specific missing variable listed
4. **Given** the command runs with --ci flag and an argument fails validation, **When** executed, **Then** the command fails with validation error details

---

### User Story 6 - Extend System with Custom Plugins (Priority: P3)

A developer with specialized validation or transformation needs creates a custom plugin. The system auto-discovers plugins from a conventional directory (e.g., `plugins/` or `.env-plugins/`) or allows explicit registration via API. They implement the plugin interface, place it in the directory or register it programmatically, and use it in their YAML templates.

**Why this priority**: Extensibility makes the system adaptable to unique project needs, but core functionality works without custom plugins.

**Independent Test**: Can be tested by creating a simple custom validator plugin, either placing it in the conventional directory or registering it via API, using it in a template, and verifying it validates correctly.

**Acceptance Scenarios**:

1. **Given** a custom validator plugin is placed in the conventional plugins directory, **When** the system initializes, **Then** the plugin is auto-discovered and available for use
2. **Given** a custom validator plugin is registered via API, **When** it's used in a YAML template, **Then** the plugin's validation logic is executed
3. **Given** a custom transformer plugin, **When** it's applied to a variable, **Then** the transformation executes correctly
4. **Given** a plugin registration fails (duplicate name), **When** attempting to register, **Then** a clear error is reported

---

### Edge Cases

- What happens when circular references exist between variables (e.g., VAR_A references VAR_B which references VAR_B)?
- How does the system handle malformed YAML that can't be parsed?
- What happens when a plugin throws an unexpected error during execution?
- How are special characters in environment variable values escaped in the `.env` file?
- What happens when the YAML template file is missing or unreadable?
- How does the system handle very large YAML templates (thousands of variables)?
- What happens when multiple plugins conflict (e.g., different default values specified)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse YAML template files that define environment variable configurations with support for nested properties via dot notation (e.g., `prompt.type:select`) and JSON-like syntax for complex values (e.g., `prompt.options:["dev","staging","prod"]`)
- **FR-002**: System MUST support pipe-based syntax for defining validators and modifiers (e.g., `type|arg:value,nested.property:value`) and MUST reject templates with duplicate parameters for the same modifier, reporting a clear error
- **FR-003**: System MUST generate `.env` files from parsed YAML templates in three modes: interactive (with prompts), argument-based (CLI args only), and CI mode (strict validation)
- **FR-003a**: System MUST support interactive mode with custom prompt types: select, multiselect, toggle, number, string, autocomplete, and default input
- **FR-003b**: System MUST accept CLI arguments that override prompts and validate that arguments match the variable's schema
- **FR-003c**: System MUST support a CI mode flag (e.g., --ci) that fails fast when required variables or variables without defaults are missing from arguments
- **FR-004**: System MUST validate environment variable values against configured validators, collecting all validation errors before reporting them together to enable fixing multiple issues in one iteration
- **FR-005**: System MUST support a plugin-based architecture for validators and transformers
- **FR-006**: System MUST include core plugins that are always loaded (string, number, boolean, URL validators)
- **FR-007**: System MUST support a reference plugin that allows variables to use values from other variables
- **FR-008**: System MUST support transformation plugins including truncate and concatenate operations
- **FR-009**: System MUST allow custom plugins to be registered and used in templates via hybrid approach: auto-discover from conventional directory (e.g., `plugins/` or `.env-plugins/`) AND explicit registration via API
- **FR-010**: System MUST provide clear error messages when validation fails, including variable name and constraint violated. All validation errors MUST be collected and reported together. Validator parameters support nested properties (e.g., `prompt.type:select`, `prompt.options:["val1","val2"]`) and JSON-like syntax for complex values
- **FR-011**: System MUST support default values for variables when not provided
- **FR-012**: System MUST prevent overwriting existing `.env` files without user confirmation
- **FR-013**: System MUST detect and report circular references between variables
- **FR-014**: System MUST execute transformation plugins in a defined order when multiple are chained
- **FR-015**: System MUST properly escape special characters in generated `.env` files
- **FR-016**: System MUST validate YAML template syntax and report errors with line numbers
- **FR-017**: System MUST allow conditional variable inclusion based on other variable values or environment
- **FR-018**: System MUST support commenting and documentation within YAML templates
- **FR-019**: System MUST validate input file paths to prevent path traversal attacks (e.g., reject paths containing `../`, absolute paths outside project directory, or symbolic links to sensitive system locations)

### Key Entities *(include if feature involves data)*

- **Variable Definition**: Represents a single environment variable with its name, type, validators, modifiers, metadata, and prompt configuration. Parameters support nested structure via dot notation (e.g., `prompt.type`, `prompt.options`) with values in JSON-like syntax (e.g., `["option1","option2"]` or `{"key":"value"}`). Contains configuration for how the variable should be validated, transformed, and presented to users in interactive mode.

- **Validator**: Represents a validation rule that can be applied to a variable value. Has a type (string, number, URL, etc.) and configuration parameters supporting nested properties (min, max, pattern, prompt.type, prompt.options, etc.). Can be a core validator or custom plugin.

- **Transformer**: Represents a transformation operation that modifies a variable's value. Has a type (truncate, concat, etc.) and configuration parameters. Can be a core transformer or custom plugin.

- **Plugin**: Represents an extension to the system, either for validation or transformation. Has a unique name, configuration schema, and execution logic. Can be core (always loaded) or custom (user-registered).

- **YAML Template**: The source configuration file that defines all variable definitions, their validators, and transformers. Structured using pipe-based syntax.

- **Environment Configuration**: The runtime representation of parsed variable definitions, validators, and transformers ready for generation and validation.

- **Reference**: A relationship between variables where one variable's value derives from another. Has a source variable and optional fallback logic.

## Clarifications

### Session 2025-11-02

- Q: In the YAML template, when multiple validators or modifiers are specified with conflicting parameters (e.g., `string|default:"value1",default:"value2"`), how should the system handle this? → A: Reject the template with a clear error about duplicate parameters
- Q: When generating the `.env` file and a variable has NO default value specified and is NOT marked as required, should the system prompt the user for input or leave it empty? → A: System supports three modes: (1) Interactive mode with custom prompts (select, multiselect, toggle, number, string, autocomplete), (2) Argument mode where CLI args override prompts and fail if args don't match schema, (3) CI mode with strict validation that fails on missing non-default variables
- Q: How should the YAML template define prompt type for interactive mode? Should it be part of the pipe syntax or a separate YAML structure? → A: Embed in pipe syntax with nested property support using dot notation (e.g., `string|prompt.type:select,prompt.options:["dev","staging","prod"]`) and support JSON-like syntax for complex values (e.g., `string|prompt.options:{"key":"value"}`)
- Q: When the system encounters validation errors during `.env` generation (e.g., a URL fails protocol validation, a number is out of range), how should it handle the error? → A: Continue validation to find all errors, then report them together before failing
- Q: How should custom plugins be discovered and loaded when the system initializes? → A: Hybrid approach - auto-discover plugins from a conventional directory (e.g., `plugins/` or `.env-plugins/`) AND allow explicit registration via API for flexibility

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can set up a complete project environment in under 5 minutes by running a single command
- **SC-002**: 95% of configuration errors are caught during validation before runtime
- **SC-003**: The system successfully parses and processes YAML templates with up to 500 variable definitions without performance degradation
- **SC-004**: Documentation and examples enable developers to create custom plugins within 30 minutes
- **SC-005**: The pipe-based syntax reduces template verbosity by at least 40% compared to verbose YAML structures
- **SC-006**: Environment setup errors due to misconfiguration are reduced by 80% compared to manual `.env` file creation
- **SC-007**: All core validator and transformer plugins have comprehensive documentation with usage examples
- **SC-008**: The system provides actionable error messages that enable developers to fix issues within 2 minutes on average

## Architecture Requirements

This package must align with the following core architectural patterns:

- **NestJS Modular Architecture**: The system must be built using NestJS modules with dependency injection for testability and extensibility (follows `apps/api/cli` pattern)
- **Command Pattern with nest-commander**: CLI commands must be implemented as classes extending `CommandRunner`, decorated with `@Command()`, and registered as providers in the CLIModule
- **Service Layer**: Business logic must be encapsulated in injectable NestJS services (providers) with clear single responsibilities
- **Plugin-Based Architecture**: Validators and transformers must be implemented as NestJS providers implementing `IValidator` and `ITransformer` interfaces, registered in feature modules
- **Type Safety**: All plugin interfaces, validators, transformers, and services must be type-safe with TypeScript strict mode to ensure reliability and developer experience
- **Documentation Maintenance**: Package must include comprehensive README with examples, and updates to parent README if this represents a new shared package
- **Separation of Concerns**: Parser, validator, transformer, and generator logic must be clearly separated into distinct NestJS modules (ParserModule, ValidationModule, TransformationModule, GeneratorModule)
- **Testability**: All plugins, services, and commands must be independently testable with clear interfaces and dependency injection for easy mocking

## Assumptions

1. **YAML Format**: We assume YAML is preferred over JSON for template files due to better readability and support for comments
2. **File Location**: We assume the YAML template file will be named `.env.template.yml` or similar and located at the project root
3. **Generation Timing**: We assume environment generation happens during development setup, not at runtime
4. **Plugin Loading**: We assume core plugins are statically loaded, while custom plugins are dynamically registered
5. **Validation Timing**: We assume validation can occur both during generation and as a separate validation command
6. **Output Format**: We assume the output format follows standard `.env` conventions (KEY=value pairs)
7. **Error Handling**: We assume the system should fail fast and report all errors rather than partially generating files
8. **Interactive by Default**: We assume the default execution mode is interactive with prompts, unless CLI arguments or CI flag are provided
9. **Backward Compatibility**: We assume this is a new package and doesn't need to maintain compatibility with existing environment systems in the project
10. **Security**: We assume sensitive values should not be stored in the YAML template itself but prompted during generation or loaded from secure sources
10. **Operating System**: We assume the system should work cross-platform (Windows, macOS, Linux)

## Dependencies

- **NestJS Framework**: Requires `@nestjs/common`, `@nestjs/core`, `reflect-metadata` for dependency injection and modular architecture
- **CLI Integration**: Requires `nest-commander` to integrate Commander.js with NestJS via decorators and CommandRunner pattern
- **YAML Parser**: Requires a YAML parsing library to read template files (using `yaml` library)
- **File System Access**: Requires ability to read template files and write `.env` files
- **Command Line Interface**: Requires CLI framework for user interaction and prompts with support for multiple prompt types (select, multiselect, toggle, number, string, autocomplete) via `@inquirer/prompts`
- **Plugin System**: Requires NestJS dynamic modules and provider registration for custom plugins
- **Validation Library**: Zod for schema validation (aligns with existing monorepo patterns)

## Out of Scope

- **Secret Management**: This system does not handle secure storage or encryption of sensitive values
- **Remote Configuration**: This system does not fetch configuration from remote sources or APIs
- **Runtime Environment Loading**: This system generates static files, not runtime environment loaders
- **Multi-Environment Management**: This system does not manage different configurations for dev/staging/production (that would require multiple template files)
- **GUI Interface**: This system provides CLI only, no graphical interface
- **Version Control Integration**: This system does not automatically manage `.env` files in git or other VCS
- **Cloud Provider Integration**: This system does not integrate with cloud-specific secret managers (AWS Secrets Manager, Azure Key Vault, etc.)
- **Environment Variable Synchronization**: This system does not sync changes between `.env` files across team members

