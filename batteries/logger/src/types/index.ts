export type LogLevel = "debug" | "info" | "warn" | "error";

export type LoggerStorage = "mysql" | "redis";

export type LoggerStorageTarget = LoggerStorage | "db" | "both" | LoggerStorage[];

export type LoggerInput<TPayload = unknown> = {
  id?: string;
  level: LogLevel;
  message: string;
  payload?: TPayload;
  source?: string;
  createdAt?: Date | number;
};

export type LoggerStoredLog<TPayload = unknown> = {
  id: string;
  level: LogLevel;
  message: string;
  payload?: TPayload;
  source?: string;
  createdAt: Date;
};

export type LoggerQuery = {
  id?: string;
  level?: LogLevel;
  source?: string;
  limit?: number;
};

export type LoggerRouteHandler<TPayload = unknown> = (
  input: LoggerInput<TPayload>,
) => LoggerStorageTarget | Promise<LoggerStorageTarget>;

export type LogStore<TPayload = unknown> = {
  save: (input: LoggerStoredLog<TPayload>) => Promise<LoggerStoredLog<TPayload>>;
  get: (id: string) => Promise<LoggerStoredLog<TPayload> | null>;
  getAll: (query?: LoggerQuery) => Promise<LoggerStoredLog<TPayload>[]>;
};

export type LoggerConfig<TPayload = unknown> = {
  defaultLevel?: LogLevel;
  createId?: (input: LoggerInput<TPayload>) => string;
};
