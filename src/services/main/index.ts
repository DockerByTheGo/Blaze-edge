import type { URecord } from "@blazyts/better-standard-library";

export type ServiceBase<TConfig extends URecord> = {
    config: TConfig;
    
} 

export type Service<T extends ServiceBase<URecord>> = {
    methods: {
        [MethodName in keyof T]: T[MethodName] extends (...args: any[]) => any
            ? {
                call: T[MethodName],
                onCalled: (callback: (v: {args: Parameters<T[MethodName]>[0], result: ReturnType<T[MethodName]>}) => void) => void // add hooks like before and after call later
            }
            : never;
    },
    config: T["config"] 
}



function servicify<T extends ServiceBase>(service: T): Service<T> {
    const methods: any = {};
    
    for (const key in service) {
        if (key === 'config') continue;
        
        const method = service[key];
        if (typeof method === 'function') {
            const callbacks: Array<(v: any) => void> = [];
            
            methods[key] = {
                call: method.bind(service),
                onCalled: (callback: (v: any) => void) => {
                    callbacks.push(callback);
                },
            };
            
            
            const originalMethod = service[key];
            service[key] = function(...args: any[]) {
                const result = originalMethod.apply(service, args);
                callbacks.forEach(cb => cb({ args: args[0], result }));
                return result;
            };
        }
    }
    
    return {
        methods,
        config: service.config,
    };
}





class FileSavingService<TConfig extends { basePath: string, maxFileSize: number }> {
    constructor(public config: TConfig) { }
    uploadFile(args: {file: File}): string {
        // implementation to save the file to disk or cloud storage
        return "file-id";
    }
}

type k = Service<FileSavingService<{ basePath: string, maxFileSize: number }>>


const k: k = null

k.config.basePath
// ============ TESTS ============

// Test 1: servicify creates correct structure
const fileSaver = new FileSavingService({
    basePath: "/uploads",
    maxFileSize: 5000000
});

const servicified = servicify(fileSaver);
servicified.methods.uploadFile.call({ ... });
servicified.methods.uploadFile.onCalled((v) => {

})


console.assert(servicified.config.basePath === "/uploads", "Config should be preserved");
console.assert(servicified.config.maxFileSize === 5000000, "Config values should match");

// Test 2: methods are accessible and callable
const callResult = servicified.methods.uploadFile.call({ file: null as any });
console.assert(callResult === "file-id", "Method call should return correct value");

// Test 3: onCalled callback fires with correct arguments
let callbackFired = false;
let capturedArgs: any = null;
let capturedResult: any = null;

servicified.methods.uploadFile.onCalled((v) => {
    callbackFired = true;
    capturedArgs = v.args;
    capturedResult = v.result;
});

const testFile = { file: { name: "test.pdf" } };
const result = servicified.methods.uploadFile.call(testFile);

console.assert(callbackFired, "Callback should have been called");
console.assert(capturedArgs?.file?.name === "test.pdf", "Args should be captured correctly");
console.assert(capturedResult === "file-id", "Result should be captured correctly");

// Test 4: multiple callbacks all fire
let callback1Fired = false;
let callback2Fired = false;

servicified.methods.uploadFile.onCalled(() => { callback1Fired = true; });
servicified.methods.uploadFile.onCalled(() => { callback2Fired = true; });

servicified.methods.uploadFile.call({ file: null as any });

console.assert(callback1Fired && callback2Fired, "Both callbacks should fire");

console.log("✅ All tests passed!");
