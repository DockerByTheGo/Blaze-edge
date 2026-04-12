
export function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(value, null, 2);
  }
  catch {
    return String(value);
  }
}
