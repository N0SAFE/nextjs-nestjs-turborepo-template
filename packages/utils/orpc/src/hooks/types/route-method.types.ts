import type { ExtractRouteMethod, HasRouteMethodMeta } from '../../shared/route-method-meta';

export type _ProcedureRouteMethod<T> = ExtractRouteMethod<T>;

export type IsGetMethod<T> = HasRouteMethodMeta<T> extends true
  ? ExtractRouteMethod<T> extends string
    ? Uppercase<ExtractRouteMethod<T>> extends 'GET'
      ? true
      : false
    : false
  : false;

export type IsNonGetMethod<T> = HasRouteMethodMeta<T> extends true
  ? ExtractRouteMethod<T> extends string
    ? Uppercase<ExtractRouteMethod<T>> extends 'GET'
      ? false
      : true
    : false
  : false;

export type QueryProcedureNames<TContract extends object, TRouter extends object = TContract> = keyof {
  [K in keyof TContract as K extends string
    ? K extends keyof TRouter
      ? IsGetMethod<TContract[K]> extends true
        ? K
        : never
      : never
    : never
  ]: unknown;
} & string;

export type MutationProcedureNames<TContract extends object, TRouter extends object = TContract> = keyof {
  [K in keyof TContract as K extends string
    ? K extends keyof TRouter
      ? IsNonGetMethod<TContract[K]> extends true
        ? K
        : never
      : never
    : never
  ]: unknown;
} & string;