/**
 * sets up a jsdom environment and returns a render function that can be used to render react components
 */
export async function browserEnv() {
  const { createRoot } = await import("react-dom/client");
  const { act } = await import("react");
  const jsdom = await import("global-jsdom");
  const cleanupJSDOM = jsdom.default();
  const origActEnv = globalThis.IS_REACT_ACT_ENVIRONMENT;

  let lastRoot;

  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  return {
    /**
     *
     * @param {import('react-dom/client').Container} container
     * @param {import('react').ReactNode} reactNode
     * @param {import('react-dom/client').RootOptions} [rootOptions]
     * @returns
     */
    async render(container, reactNode, rootOptions) {
      if (lastRoot) lastRoot.unmount();
      lastRoot = createRoot(container, rootOptions);
      await act(async () => lastRoot.render(reactNode));
      return lastRoot;
    },
    [Symbol.dispose]: () => {
      if (lastRoot) lastRoot.unmount();
      globalThis.IS_REACT_ACT_ENVIRONMENT = origActEnv;
      cleanupJSDOM();
    },
  };
}

export async function renderStreamEnv() {
  const jsdom = await import("global-jsdom");
  const cleanupJSDOM = jsdom.default();
  const { createRenderStream } = await import(
    "@testing-library/react-render-stream"
  );

  return {
    createRenderStream,
    [Symbol.dispose]: () => {
      cleanupJSDOM();
    },
  };
}
