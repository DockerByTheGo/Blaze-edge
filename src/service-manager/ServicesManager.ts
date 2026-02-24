import { createPiper } from "./piper";
import type { Piper } from "./piper";

export type Service = unknown;

export class Hooks {
  public readonly onAddedService: Piper<[string, Service]>;

  constructor() {
    this.onAddedService = createPiper<[string, Service]>();
  }
}

export class ServiceManager<Services extends Record<string, Service> = Record<string, Service>> {
  public services: Services;
  public readonly hooks: Hooks;

  constructor(services?: Services) {
    this.services = services ?? ({} as Services);
    this.hooks = new Hooks();
  }

  addService<T extends Service>(name: string, service: T): ServiceManager<Services & Record<string, T>> {
    this.services[name] = service;
    this.hooks.onAddedService(name, service);
    return this as unknown as ServiceManager<Services & Record<string, T>>;
  }

  getService<T extends Service>(name: string): T | undefined {
    return this.services[name] as T | undefined;
  }

  hasService(name: string): boolean {
    return name in this.services;
  }
}
