import express from "express";
import { renderToPipeableStream } from "react-dom/server";

// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || "/";
const ABORT_DELAY = 10000;

// Create http server
const app = express();

// Add Vite or respective production middlewares
let vite;
console.log({ isProduction });
if (!isProduction) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true, hmr: true },
    appType: "custom",
    base,
  });
  // disabled for now out of risk of delaying the stream in any way
  // app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

// based on https://github.com/facebook/react/blob/9cdf8a99edcfd94d7420835ea663edca04237527/fixtures/fizz/server/render-to-stream.js
app.use("*", async (req, res) => {
  // The new wiring is a bit more involved.
  res.socket.on("error", (error) => {
    console.error("Fatal", error);
  });
  let didError = false;
  let didFinish = false;
  const App = (await vite.ssrLoadModule("/src/entry-server.jsx")).render({
    isProduction,
  });
  const { pipe, abort } = renderToPipeableStream(App, {
    bootstrapScripts: [],
    onAllReady() {
      console.log("All ready");
      // Full completion.
      // You can use this for SSG or crawlers.
      didFinish = true;
    },
    onShellReady() {
      console.log("Shell ready", { didError });
      // If something errored before we started streaming, we set the error code appropriately.
      res.statusCode = didError ? 500 : 200;
      res.setHeader("Content-type", "text/html");
      setImmediate(() => pipe(res));
    },
    onShellError(x) {
      console.log("Shell error", x);
      // Something errored before we could complete the shell so we emit an alternative shell.
      res.statusCode = 500;
      res.send("<!doctype><p>Error</p>");
    },
    onError(x) {
      console.log("Error", x);
      didError = true;
      console.error(x);
    },
  });
  // Abandon and switch to client rendering if enough time passes.
  // Try lowering this to see the client recover.
  setTimeout(() => {
    if (!didFinish) {
      abort();
    }
  }, ABORT_DELAY);

  // try {
  //   const url = req.originalUrl.replace(base, '')

  //   let template
  //   let render
  //   if (!isProduction) {
  //     // Always read fresh template in development
  //     template = await fs.readFile('./index.html', 'utf-8')
  //     template = await vite.transformIndexHtml(url, template)
  //     render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
  //   } else {
  //     template = templateHtml
  //     render = (await import('./dist/server/entry-server.js')).render
  //   }

  //   const rendered = await render(url, ssrManifest)

  //   const html = template
  //     .replace(`<!--app-head-->`, rendered.head ?? '')
  //     .replace(`<!--app-html-->`, rendered.html ?? '')

  //   res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  // } catch (e) {
  //   vite?.ssrFixStacktrace(e)
  //   console.log(e.stack)
  //   res.status(500).end(e.stack)
  // }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
