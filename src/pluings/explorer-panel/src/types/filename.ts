import { ContextSafeType } from "./baseContextSafeTypet";

export class FileName extends ContextSafeType<string> {
  customValidator(v: string): boolean {
    for (let i = 0; i < v.length; i++) {
      if ((v[i] >= "a" && v[i] <= "z") || (v[i] >= "A" && v[i] <= "Z")) {
        continue;
      }
      return false;
    }

    return true;
  }
}
