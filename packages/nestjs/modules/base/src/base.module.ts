import { DynamicModule, Module, type Provider, type Type } from '@nestjs/common';

@Module({})
export class BaseModule {
  readonly __baseModuleBrand = true;

  static forRoot(options?: {
    global?: boolean;
    imports?: DynamicModule['imports'];
    providers?: Provider[];
    exports?: (Provider | string | symbol | Type<unknown>)[];
  }): DynamicModule {
    return {
      module: BaseModule,
      global: options?.global ?? false,
      imports: options?.imports ?? [],
      providers: options?.providers ?? [],
      exports: options?.exports ?? [],
    };
  }
}