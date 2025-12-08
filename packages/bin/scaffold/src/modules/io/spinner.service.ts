/**
 * Spinner Service
 *
 * Provides terminal spinners for long-running operations.
 */
import { Injectable } from "@nestjs/common";
import ora, { type Ora, type Color } from "ora";

export interface SpinnerOptions {
  /** Spinner text */
  text?: string;
  /** Spinner color */
  color?: Color;
  /** Whether to show spinner (false for CI environments) */
  enabled?: boolean;
}

@Injectable()
export class SpinnerService {
  private currentSpinner: Ora | null = null;
  private enabled: boolean = true;

  /**
   * Set whether spinners are enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Start a new spinner
   */
  start(textOrOptions?: string | SpinnerOptions): Ora {
    // Stop any existing spinner
    this.stop();

    const options: SpinnerOptions =
      typeof textOrOptions === "string"
        ? { text: textOrOptions }
        : textOrOptions ?? {};

    const isEnabled = options.enabled ?? this.enabled;

    this.currentSpinner = ora({
      text: options.text,
      color: options.color ?? "cyan",
      isEnabled,
    }).start();

    return this.currentSpinner;
  }

  /**
   * Update spinner text
   */
  update(text: string): void {
    if (this.currentSpinner) {
      this.currentSpinner.text = text;
    }
  }

  /**
   * Stop spinner with success
   */
  succeed(text?: string): void {
    if (this.currentSpinner) {
      this.currentSpinner.succeed(text);
      this.currentSpinner = null;
    }
  }

  /**
   * Stop spinner with failure
   */
  fail(text?: string): void {
    if (this.currentSpinner) {
      this.currentSpinner.fail(text);
      this.currentSpinner = null;
    }
  }

  /**
   * Stop spinner with warning
   */
  warn(text?: string): void {
    if (this.currentSpinner) {
      this.currentSpinner.warn(text);
      this.currentSpinner = null;
    }
  }

  /**
   * Stop spinner with info
   */
  info(text?: string): void {
    if (this.currentSpinner) {
      this.currentSpinner.info(text);
      this.currentSpinner = null;
    }
  }

  /**
   * Stop spinner without status
   */
  stop(): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
  }

  /**
   * Stop and clear spinner
   */
  clear(): void {
    if (this.currentSpinner) {
      this.currentSpinner.clear();
      this.currentSpinner = null;
    }
  }

  /**
   * Check if spinner is currently running
   */
  isSpinning(): boolean {
    return this.currentSpinner?.isSpinning ?? false;
  }

  /**
   * Run an async function with a spinner
   */
  async wrap<T>(
    text: string,
    fn: () => Promise<T>,
    options?: { successText?: string; failText?: string },
  ): Promise<T> {
    this.start(text);

    try {
      const result = await fn();
      this.succeed(options?.successText ?? text);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.fail(options?.failText ?? `${text} - ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Run multiple steps with spinner updates
   */
  async steps<T>(
    steps: Array<{
      text: string;
      fn: () => Promise<unknown>;
    }>,
    options?: { startText?: string; successText?: string },
  ): Promise<void> {
    this.start(options?.startText ?? steps[0]?.text ?? "Processing...");

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step) continue;

      this.update(`[${i + 1}/${steps.length}] ${step.text}`);

      try {
        await step.fn();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.fail(`Step ${i + 1} failed: ${errorMessage}`);
        throw error;
      }
    }

    this.succeed(options?.successText ?? "All steps completed");
  }
}
