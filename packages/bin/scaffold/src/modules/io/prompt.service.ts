/**
 * Prompt Service
 *
 * Provides interactive user prompts for CLI input.
 */
import { Injectable } from "@nestjs/common";
import prompts, { type PromptObject, type Answers } from "prompts";
import kleur from "kleur";
import { UserCancelledError } from "../../types/errors.types";

export interface ConfirmOptions {
  /** Default value */
  initial?: boolean;
  /** Active text (for yes) */
  active?: string;
  /** Inactive text (for no) */
  inactive?: string;
}

export interface SelectOption<T = string> {
  /** Display title */
  title: string;
  /** Option value */
  value: T;
  /** Option description */
  description?: string;
  /** Whether option is disabled */
  disabled?: boolean;
}

export interface TextOptions {
  /** Placeholder text */
  placeholder?: string;
  /** Initial value */
  initial?: string;
  /** Validation function */
  validate?: (value: string) => boolean | string;
  /** Format function */
  format?: (value: string) => string;
}

export interface NumberOptions {
  /** Initial value */
  initial?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Increment step */
  step?: number;
  /** Float allowed */
  float?: boolean;
}

@Injectable()
export class PromptService {
  private cancelled = false;

  /**
   * Show a text input prompt
   */
  async text(message: string, options?: TextOptions): Promise<string> {
    const response = await this.prompt<{ value: string }>({
      type: "text",
      name: "value",
      message,
      initial: options?.initial,
      validate: options?.validate,
      format: options?.format,
    });

    return response.value;
  }

  /**
   * Show a password input prompt
   */
  async password(message: string): Promise<string> {
    const response = await this.prompt<{ value: string }>({
      type: "password",
      name: "value",
      message,
    });

    return response.value;
  }

  /**
   * Show a number input prompt
   */
  async number(message: string, options?: NumberOptions): Promise<number> {
    const response = await this.prompt<{ value: number }>({
      type: "number",
      name: "value",
      message,
      initial: options?.initial,
      min: options?.min,
      max: options?.max,
      increment: options?.step,
      float: options?.float,
    });

    return response.value;
  }

  /**
   * Show a confirmation prompt
   */
  async confirm(message: string, options?: ConfirmOptions): Promise<boolean> {
    const response = await this.prompt<{ value: boolean }>({
      type: "confirm",
      name: "value",
      message,
      initial: options?.initial ?? false,
    });

    return response.value;
  }

  /**
   * Show a single-select prompt
   */
  async select<T = string>(
    message: string,
    choices: SelectOption<T>[],
    options?: { initial?: number },
  ): Promise<T> {
    const response = await this.prompt<{ value: T }>({
      type: "select",
      name: "value",
      message,
      choices: choices.map((c) => ({
        title: c.title,
        value: c.value,
        description: c.description,
        disabled: c.disabled,
      })),
      initial: options?.initial ?? 0,
    });

    return response.value;
  }

  /**
   * Show a multi-select prompt
   */
  async multiselect<T = string>(
    message: string,
    choices: SelectOption<T>[],
    options?: { min?: number; max?: number; hint?: string },
  ): Promise<T[]> {
    const response = await this.prompt<{ value: T[] }>({
      type: "multiselect",
      name: "value",
      message,
      choices: choices.map((c) => ({
        title: c.title,
        value: c.value,
        description: c.description,
        disabled: c.disabled,
      })),
      min: options?.min,
      max: options?.max,
      hint: options?.hint ?? "Space to select, Enter to confirm",
    });

    return response.value;
  }

  /**
   * Show an autocomplete prompt
   */
  async autocomplete<T = string>(
    message: string,
    choices: SelectOption<T>[],
    options?: { limit?: number; suggest?: (input: string, choices: SelectOption<T>[]) => Promise<SelectOption<T>[]> },
  ): Promise<T> {
    const response = await this.prompt<{ value: T }>({
      type: "autocomplete",
      name: "value",
      message,
      choices: choices.map((c) => ({
        title: c.title,
        value: c.value,
        description: c.description,
      })),
      limit: options?.limit ?? 10,
      suggest: options?.suggest
        ? async (input, allChoices) => {
            const filtered = await options.suggest!(input, choices);
            return filtered.map((c) => ({
              title: c.title,
              value: c.value,
              description: c.description,
            }));
          }
        : undefined,
    });

    return response.value;
  }

  /**
   * Show a toggle prompt
   */
  async toggle(
    message: string,
    options?: { active?: string; inactive?: string; initial?: boolean },
  ): Promise<boolean> {
    const response = await this.prompt<{ value: boolean }>({
      type: "toggle",
      name: "value",
      message,
      active: options?.active ?? "yes",
      inactive: options?.inactive ?? "no",
      initial: options?.initial ?? false,
    });

    return response.value;
  }

  /**
   * Run a series of prompts
   */
  async form<T extends Record<string, unknown>>(
    questions: PromptObject[],
  ): Promise<T> {
    return this.prompt<T>(questions);
  }

  /**
   * Show a message and wait for any key
   */
  async pressAnyKey(message = "Press any key to continue..."): Promise<void> {
    console.log(kleur.dim(message));
    await this.prompt({
      type: "invisible",
      name: "key",
      message: "",
    });
  }

  /**
   * Internal prompt wrapper with cancellation handling
   */
  private async prompt<T extends Answers<string>>(
    questions: PromptObject | PromptObject[],
  ): Promise<T> {
    const questionsArray = Array.isArray(questions) ? questions : [questions];

    const response = await prompts(questionsArray, {
      onCancel: () => {
        this.cancelled = true;
        return false;
      },
    });

    if (this.cancelled) {
      this.cancelled = false;
      throw new UserCancelledError();
    }

    return response as T;
  }

  /**
   * Display a styled message (not a prompt)
   */
  message(text: string, type: "info" | "success" | "warn" | "error" = "info"): void {
    const colors = {
      info: kleur.blue,
      success: kleur.green,
      warn: kleur.yellow,
      error: kleur.red,
    };
    const icons = {
      info: "ℹ",
      success: "✔",
      warn: "⚠",
      error: "✖",
    };

    console.log(colors[type](`${icons[type]} ${text}`));
  }
}
