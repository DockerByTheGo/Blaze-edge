import { ContextSafeType } from "./baseContextSafeTypet";

export class ApiPath<T extends string> extends ContextSafeType<T> {
  customValidator(v: T): boolean {
    for (let i = 0; i < v.length; i++) {
      if ((v[i] >= "0" && v[i] <= "9") || (v[i] >= "a" && v[i] <= "z") || (v[i] >= "A" && v[i] <= "Z") || v[i] === "/" || v[i] == ":") {
        continue;
      }
      return false;
    }
    return true;
  }
}
