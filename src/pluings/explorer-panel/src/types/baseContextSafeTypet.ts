export abstract class ContextSafeType<V> {
    private v: V;
    constructor(v: V) {
        if (this.customValidator(v)) {
            this.v = v;
        }
        else {
            throw new Error(`Invalid value for ${JSON.stringify(this.constructor.name)}: ${JSON.stringify(v)}`);
        }
    }

    public get value(): V { return this.v; }
    valueOf() {
        return this.v;
    }
    abstract customValidator(v: V): boolean;
}
