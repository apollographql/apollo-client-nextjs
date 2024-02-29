export default function Html({ isProduction, assets, children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite + React</title>
        {assets.map((asset) => (
          <link rel="stylesheet" crossorigin href={asset}></link>
        ))}
      </head>
      <body>
        <div id="root">{children}</div>
        {isProduction ? (
          <></>
        ) : (
          <>
            <script type="module" src="/@vite/client"></script>
            <script
              type="module"
              async
              dangerouslySetInnerHTML={{
                __html: `
                  import RefreshRuntime from '/@react-refresh';
                  RefreshRuntime.injectIntoGlobalHook(window);
                  window.$RefreshReg$ = () => {};
                  window.$RefreshSig$ = () => (type) => type;
                  window.__vite_plugin_react_preamble_installed__ = true;
                  `
                  .split("\n")
                  .map((s) => s.trim())
                  .join(""),
              }}
            />
            <script type="module" src="/src/entry-client.jsx"></script>
          </>
        )}

        <script
          dangerouslySetInnerHTML={{
            __html: `__hydrationProps = ${JSON.stringify({ assets, isProduction })};`,
          }}
        />
      </body>
    </html>
  );
}
