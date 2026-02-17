export abstract class ProxyBuilderBase<TSchema> {
    abstract get schema(): TSchema;
    abstract _build(): unknown;
}
