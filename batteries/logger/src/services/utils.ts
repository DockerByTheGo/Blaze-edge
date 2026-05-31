import type { LoggerInput, LoggerStoredLog, LoggerStorage, LoggerStorageTarget } from "../types";

export function normalizeLogInput<TPayload>(
  input: LoggerInput<TPayload>,
  createId: (input: LoggerInput<TPayload>) => string = defaultCreateId,
): LoggerStoredLog<TPayload> {
  return {
    id: input.id ?? createId(input),
    level: input.level,
    message: input.message,
    payload: input.payload,
    source: input.source,
    createdAt: normalizeDate(input.createdAt),
  };
}

export function normalizeStorageTarget(target: LoggerStorageTarget): LoggerStorage[] {
  if (Array.isArray(target)) {
    return uniqueTargets(target);
  }

  if (target === "both") {
    return ["mysql", "redis"];
  }

  if (target === "db") {
    return ["mysql"];
  }

  return [target];
}

function normalizeDate(value: Date | number | undefined): Date {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value ?? Date.now());
}

function defaultCreateId(): string {
  return crypto.randomUUID();
}

function uniqueTargets(targets: LoggerStorage[]): LoggerStorage[] {
  return [...new Set(targets)];
}
