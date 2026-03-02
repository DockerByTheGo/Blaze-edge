import { RouteBuilder } from "./variations";

type RemoveStringFromStringUnion<Union extends string, StringToREmove extends Union> = Union extends StringToREmove ? never : Union;

type IsDynamic<T extends string> = T extends `:${string}` ? true : false;

type ExtractParamName<T extends string>
  = T extends `:${infer Name}` ? Name : never;

export type ExtractParams<
  Path extends string,
  Acc extends Record<string, any> = {},
> = Path extends `/${infer Segment}/${infer Rest}`
  ? ExtractParams<
      `/${Rest}`,
      Acc & (IsDynamic<Segment> extends true
        ? { [K in ExtractParamName<Segment>]: string }
        : {})
  >
  : Path extends `/${infer Last}`
  ? Acc & (IsDynamic<Last> extends true
      ? { [K in ExtractParamName<Last>]: string }
      : {})
    : Acc;

type k = ExtractParams<"/users/:userId/posts/:postId/">;

// const g = RouteBuilder
//   .new({ type: "number", name: "userId" })
//   .addDynamicParam("postId", "number");
