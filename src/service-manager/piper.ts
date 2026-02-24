type PiperListener<Args extends unknown[]> = (...args: Args) => void;

export type Piper<Args extends unknown[] = []> = {
  (...args: Args): void;
  pipe: (...args: Args) => void;
  subscribe: (listener: PiperListener<Args>) => () => void;
  clear: () => void;
};

export function createPiper<Args extends unknown[] = []>(): Piper<Args> {
  const listeners = new Set<PiperListener<Args>>();

  const emitter = ((...args: Args) => emitter.pipe(...args)) as Piper<Args>;

  emitter.pipe = (...args: Args) => {
    for (const listener of Array.from(listeners)) {
      listener(...args);
    }
  };

  emitter.subscribe = (listener: PiperListener<Args>) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  emitter.clear = () => {
    listeners.clear();
  };

  return emitter;
}
