import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Html from "./Html";

ReactDOM.hydrateRoot(
  document,
  <Html {...window.__hydrationProps}>
    <Suspense>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Suspense>
  </Html>
);
