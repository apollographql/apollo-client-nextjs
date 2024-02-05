/**
 * Creates a callback with backpressure support.
 *
 * New calls can be made with `callback.push(value)`.
 * If a callback is already registered, it will be called directly.
 * Otherwise, the calls will be queued until a callback is registered,
 * at which point all queued calls will be executed.
 *
 * The callback can be registered with `callback.register(callback)`.
 *
 * Registering `null` as a callback will clear the current callback -
 * future calls after that will be queued again.
 */
export function createBackpressuredCallback<T>() {
  const queue: T[] = [];
  let push: (value: T) => void = queue.push.bind(queue);
  return {
    push: (value: T) => push(value),
    register: (callback: null | ((value: T) => void)) => {
      if (callback) {
        push = callback;
        while (queue.length) {
          callback(queue.shift()!);
        }
      } else {
        push = queue.push.bind(queue);
      }
    },
  };
}
