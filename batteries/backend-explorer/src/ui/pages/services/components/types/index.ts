import type { ObjectState } from "@blazytsts/utils_react-utils";

export type MethodDescriptor = {
  invokable: boolean;
  schema?: unknown;
  runs: RunEntry[];
};

export type RunEntry = {
  args?: unknown;
  result?: unknown;
  response?: unknown;
  error?: unknown;
  createdAt?: string | number | Date;
  timestamp?: string | number | Date;
};

export type ServiceViewState = {
  argsByMethod: ObjectState<Record<string, string>>;
  localRunsByMethod: ObjectState<Record<string, RunEntry[]>>;
  responseByMethod: ObjectState<Record<string, string>>;
  statusByMethod: ObjectState<Record<string, string>>;
};
