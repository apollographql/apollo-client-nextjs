import type { ServerResponse } from "node:http";
/**
 /**
 * > This export is only available in streaming SSR Server environments
 *
 * Used to pipe a `ReadableStreamDefaultReader` to a `ServerResponse`.
 * 
 * @example
 * ```js
 * const { injectIntoStream, transformStream } = createInjectionTransformStream();
 * const App = render({ assets, injectIntoStream });
 * const reactStream = await renderToReadableStream(App, { bootstrapModules }));
 * await pipeReaderToResponse(
 *   reactStream.pipeThrough(transformStream).getReader(),
 *   response
 * );
 *  ```
 */
export async function pipeReaderToResponse(
  reader: ReadableStreamDefaultReader<any>,
  res: ServerResponse
) {
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      } else {
        res.write(value);
      }
    }
  } catch (e: any) {
    res.destroy(e);
  }
}
