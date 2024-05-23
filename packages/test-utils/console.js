export function silenceConsoleErrors() {
  const { error } = console;
  console.error = () => {};
  return {
    [Symbol.dispose]() {
      console.error = error;
    },
  };
}
