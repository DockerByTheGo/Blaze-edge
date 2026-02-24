import type { ServiceManager } from "../../../src/service-manager";

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
  ? true
  : false;
type Assert<T extends true> = T;

type AddServiceReturn<Manager extends ServiceManager, Name extends string, Service> =
  Manager extends { addService(name: Name, service: Service): infer Result }
    ? Result
    : never;

interface ExampleService {
  readonly payload: string;
}

type BaseManager = ServiceManager<{}>;
type ManagerWithService = AddServiceReturn<BaseManager, "example", ExampleService>;

type _addService_hook_type_test = Assert<Equals<ManagerWithService["services"]["example"], ExampleService>>;
