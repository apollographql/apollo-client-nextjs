type ValidQueueKeys = {
  [K in keyof Window]-?: NonNullable<Window[K]> extends {
    push(...args: any[]): any;
  }
    ? K
    : never;
}[keyof Window];

/**
 * Registers a queue that can be filled with data before it has actually been initialized with this function.
 * Before calling this function, `window[key]` can just be handled as an array of data.
 * When calling this funcation, all accumulated data will be passed to the callback.
 * After calling this function, `window[key]` will be an object with a `push` method that will call the callback with the data.
 */
export function registerLateInitializingQueue<K extends ValidQueueKeys>(
  key: K,
  callback: (data: Parameters<NonNullable<Window[K]>["push"]>[0]) => void
) {
  const previousData = window[key] || [];
  if (Array.isArray(previousData)) {
    window[key] = {
      push: (...data: any[]) => {
        for (const value of data) {
          callback(value);
        }
      },
    };
    window[key].push(...previousData);
  }
}
