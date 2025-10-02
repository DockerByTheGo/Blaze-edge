export type Service = unknown



export class Hooks {
    public readonly onAddedService: Piper
}

export class ServiceManager<Services extends Record<string, Service> & {cache: Service, managerPanel: Service}> {
    public services: Services;

    constructor(services: Services) {
        this.services = services;
    }

    hooks: Hooks 

    addService<T extends Service>(name: string, service: T): ServiceManager<Services & Record<string, T>> {
        this.services[name] = service;
        this.hooks.onAddedService()
        this.hooks.onAddedService.pipe(name, service);
        return this as unknown as ServiceManager<Services & Record<string, T>>;
    }
}
