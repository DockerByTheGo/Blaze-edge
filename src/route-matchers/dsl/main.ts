import { TypeMarker } from "@blazyts/better-standard-library";

import { panic, panicTypeOnlyVariable } from "@blazyts/better-standard-library";
import { Optionable } from "@blazyts/better-standard-library/src/data_structures/functional-patterns/option/main";

import { extractParams, type ExtractParams } from "./types/extractParams";

import { getParts, type RouteMAtcher } from "@blazyts/backend-lib";

const IsDynamic = (s: string) => s[0] === ":";

function match<T extends string>(schema: T, config: { [K in T]: (v: K) => void }) {
  return config[schema](schema);
}


const types = [{ date: "(" }, { number: "$" }];

function getParamType(s: ("(" | "$") & {}): Optionable<"date" | "number"> {
  s.length > 1 && panic("only one char accecpted");

  const symbols = [...types.map(v => v.date || v.number)];
  const names = [...types.map(v => v.date ? "date" : "number")];

  return symbols.includes(s)
    ? Optionable.new(names[symbols.indexOf(s)])
    : Optionable.none();
}

export class DSLRouting<TRoute extends string> implements RouteMAtcher<ExtractParams<TRoute>> {
  constructor(public readonly matcher: TRoute) {

  }

  get TGetRouteString() { panic("not implemented") as any }
  getRouteString() { return this.matcher; }
  get TGetContextType(): ExtractParams<TRoute> {  return panicTypeOnlyVariable() as any}

  typeInfo: TypeMarker<string> = new TypeMarker("");

  match(path: string): Optionable<ExtractParams<TRoute>> {
    const matcherParts = getParts(this.matcher);
    const pathParts = getParts(path);

    const g: typeof this.TGetContextType = {};
    for (let i = 0; i < matcherParts.length; i++) {
      const currentMatcherPart = matcherParts[i];
      const currentRoutePart = pathParts[i];

      if (IsDynamic(currentMatcherPart)) {
        const paramName = currentMatcherPart.slice(1, currentMatcherPart.length - 1);
        const ParamType = getParamType(currentMatcherPart[currentMatcherPart.length - 1]);
        ParamType.try({
          ifNone: () => g[paramName] = currentRoutePart as string,
          ifNotNone: (v) => {
            switch (v) {
              case "date":
                g[paramName] = new Date(currentRoutePart);
                break;
              case "number":
                g[paramName] = Number.parseInt(currentRoutePart);
                break;
            }
          },

        });
      }
      else {
        if (currentMatcherPart === currentRoutePart) {

        }
        else {
          return Optionable.none();
        }
      }
    }

    return new Optionable(g);
  }
}
