import type { Hook, HooksDefault } from "@blazyts/backend-lib";
import type { Service } from "../main";
import { createPiper } from "../piper";
import type { Piper } from "../piper";

export class ServiceManager<Services extends Record<string, Service> = Record<string, Service>> {
  public services: Services;
  public readonly hooks: HooksDefault[];

  constructor(services?: Services) {
    this.services = services ?? ({} as Services);
    this.hooks = [];
  }

  addService<T extends Service>(name: string, service: T): ServiceManager<Services & Record<string, T>> {
    this.services[name] = service;
    this.hooks.forEach(h => h(name, service));
    return this as unknown as ServiceManager<Services & Record<string, T>>;
  }

  getService<T extends Service>(name: string): T | undefined {
    return this.services[name] as T | undefined;
  }

  hasService(name: string): boolean {
    return name in this.services;
  }
}
