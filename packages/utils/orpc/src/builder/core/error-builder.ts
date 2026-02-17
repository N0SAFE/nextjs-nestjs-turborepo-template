/**
 * Error definition builders for route-builder-v2
 * Handles custom error definitions for ORPC contracts
 * Uses Standard Schema instead of Zod
 */

import type { AnySchema } from "../../shared/types";

/**
 * Error definition builder for creating custom error definitions
 * 
 * @example
 * ```typescript
 * const notFoundError = error('NOT_FOUND')
 *   .message('Resource not found')
 *   .data(z.object({ resourceId: z.string() }))
 *   .status(404);
 * ```
 */
export class ErrorDefinitionBuilder<
    TCode extends string = string,
    TMessage extends string | undefined = undefined,
    TData extends AnySchema | undefined = undefined,
    TStatus extends number | undefined = undefined,
> {
    private _code?: TCode;
    private _message?: TMessage;
    private _data?: TData;
    private _status?: TStatus;

    constructor(code?: TCode) {
        this._code = code;
    }

    /**
     * Set the error code
     */
    code<TNewCode extends string>(code: TNewCode): ErrorDefinitionBuilder<TNewCode, TMessage, TData, TStatus> {
        const builder = new ErrorDefinitionBuilder<TNewCode, TMessage, TData, TStatus>(code);
        builder._message = this._message;
        builder._data = this._data;
        builder._status = this._status;
        return builder;
    }

    /**
     * Set the error message
     */
    message<TNewMessage extends string>(message: TNewMessage): ErrorDefinitionBuilder<TCode, TNewMessage, TData, TStatus> {
        const builder = new ErrorDefinitionBuilder<TCode, TNewMessage, TData, TStatus>(this._code);
        builder._message = message;
        builder._data = this._data;
        builder._status = this._status;
        return builder;
    }

    /**
     * Set the error data schema
     */
    data<TNewData extends AnySchema>(data: TNewData): ErrorDefinitionBuilder<TCode, TMessage, TNewData, TStatus> {
        const builder = new ErrorDefinitionBuilder<TCode, TMessage, TNewData, TStatus>(this._code);
        builder._message = this._message;
        builder._data = data;
        builder._status = this._status;
        return builder;
    }

    /**
     * Set the HTTP status code for this error
     */
    status<TNewStatus extends number>(status: TNewStatus): ErrorDefinitionBuilder<TCode, TMessage, TData, TNewStatus> {
        const builder = new ErrorDefinitionBuilder<TCode, TMessage, TData, TNewStatus>(this._code);
        builder._message = this._message;
        builder._data = this._data;
        builder._status = status;
        return builder;
    }

    /**
     * Get the error definition
     * @internal
     */
    _getDefinition(): {
        code: TCode;
        message?: TMessage;
        data?: TData;
        status?: TStatus;
    } {
        if (!this._code) {
            throw new Error("Error code is required. Call .code() before building.");
        }
        return {
            code: this._code,
            message: this._message,
            data: this._data,
            status: this._status,
        };
    }
}

/**
 * Create an error definition builder
 * 
 * @example
 * ```typescript
 * // With code in factory
 * const errors = [
 *   error('NOT_FOUND').message('Resource not found').status(404),
 *   error('VALIDATION_ERROR').message('Invalid input').status(400),
 * ];
 * 
 * // With code via method chain
 * const errors = [
 *   error().code('NOT_FOUND').message('Resource not found').status(404),
 * ];
 * ```
 */
export function error(): ErrorDefinitionBuilder;
export function error<TCode extends string>(code: TCode): ErrorDefinitionBuilder<TCode>;
export function error<TCode extends string>(code?: TCode): ErrorDefinitionBuilder<TCode> {
    return new ErrorDefinitionBuilder(code);
}

/**
 * Helper type to extract error definition from ErrorDefinitionBuilder
 */
export type ExtractErrorFromBuilder<TBuilder> =
    TBuilder extends ErrorDefinitionBuilder<
        infer TCode extends string,
        infer TMessage extends string | undefined,
        infer TData extends AnySchema | undefined,
        infer TStatus extends number | undefined
    >
        ? Record<
              TCode,
              {
                  message?: TMessage;
                  data?: TData;
                  status?: TStatus;
              }
          >
        : never;

/**
 * Helper type to merge error definitions from an array of ErrorDefinitionBuilders
 */
export type ExtractErrorsFromBuilders<
    TBuilders extends readonly ErrorDefinitionBuilder<string, string | undefined, AnySchema | undefined, number | undefined>[]
> = TBuilders extends readonly [
    infer TFirst extends ErrorDefinitionBuilder<string, string | undefined, AnySchema | undefined, number | undefined>,
    ...infer TRest extends ErrorDefinitionBuilder<string, string | undefined, AnySchema | undefined, number | undefined>[],
]
    ? TRest extends readonly []
        ? ExtractErrorFromBuilder<TFirst>
        : ExtractErrorFromBuilder<TFirst> & ExtractErrorsFromBuilders<TRest>
    : unknown;
