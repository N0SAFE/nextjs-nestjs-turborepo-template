declare global {
  interface Function {
    call<R>(
      this: (this: any, ...args: any[]) => R,
      thisArg: any,
      ...args: any[]
    ): R;
  }
}

export {};