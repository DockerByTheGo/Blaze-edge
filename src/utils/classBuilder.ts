import type { ZodRawObject } from "@blazyts/better-standard-library/src/data_structures/overload/types";
import type { URecord } from "@blazyts/better-standard-library/src/type-level-functions";


interface Validator<TValidatorReturn> {
    validate: (v: any) => TValidatorReturn
}

type Executor<V,ExistingCtx, R> = (validated: V, ctx: ExistingCtx) => R;

interface MethodDef<TValidatorReturn, ExistingCtx,TExecutorReturn> {
  validator: Validator<TValidatorReturn>;
  execute: Executor<TValidatorReturn, ExistingCtx, TExecutorReturn>;
}

interface BuilderCtx {
  log: (...args: any[]) => void;
  meta: URecord;
}

export type Member = {type: "property", data: unknown} | {type: "method", data: MethodDef<unknown, unknown, unknown>}

type OBject<T extends Record<string, Member>> = {
    meta: T;
} & {
    [K in keyof T]: 
        T[K] extends { type: "property"; data: infer D } ? D :
        T[K] extends { type: "method"; data: MethodDef<infer V, any, infer R> } ? (v: V) => R :
        never;
};


class ClassBuilder<TProps extends Record<string, Member> = {}> {
  private props: TProps = {} as TProps;
  private ctx: BuilderCtx;

  constructor(ctx?: Partial<BuilderCtx>) {
    this.ctx = { log: console.log, meta: {}, ...ctx };
  }

  addProperty<K extends string, V>(
    key: K,
    value: V
  ): ClassBuilder<TProps & { [PKey in K]: {type: "property", data: V} }> {
    (this.props as any)[key] = {
        type: "property",
        data: value
    };
    this.ctx.log(`Added property "${key}"`);
    return this as any;
  }

  addMethod<K extends string, V, R>(
    key: K,
    def: MethodDef<V, TProps, R>
  ): ClassBuilder<TProps & { [PKey in K]: {type: "method", data: MethodDef<V, TProps, R>} }> {
    (this.props as any)[key] = {
        type: "method",
        data: def
    };
    this.ctx.log(`Added method "${key}"`);
    return this as any;
  }

  build(): OBject<TProps> {
    const obj ={} as OBject<TProps>;
    obj.meta = this.props;
    Object.entries(this.props).forEach(([key, value]) => {
      if (value.type === "property") {
        obj[key] = value.data;
      } else if (value.type === "method") {
        obj[key] = (v: any) => value.data.execute(value.data.validator(v), obj);
      }
    });
    return obj;
  }

  getCtx() {
    return this.ctx;
  }
}


// class ZodValidator<TSchema extends ZodRawObject, TExistingContext, TExecuteReturnType> implements MethodDef<TSchema, TExistingContext, TExecuteReturnType> {
//     validator: Validator<TSchema>;
//     execute: Executor<TSchema, TExistingContext, TExecuteReturnType>;
//     constructor(schema: TSchema) {
//         this.validator
//     }

// }


const builder = new ClassBuilder()
  .addProperty("name", "ChatGPT")
  .addMethod("id", {
    validator: (v) => Math.random() * 1000,
    execute: (v, ctx) => Math.floor(v),
  })
  .addMethod("description", {
    validator: () => "hello",
    execute: (s, ctx) => s.toUpperCase(),
  });

const built = builder.build();
built.description("hello")

console.log(built);


builder.getCtx().log("Meta", builder.getCtx().meta);
