import React, { Suspense } from "react";
import App from "./App";
import Html from "./Html";

export function render({ isProduction, assets }) {
  return (
    <Html isProduction={isProduction} assets={assets}>
      <Suspense>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </Suspense>
    </Html>
  );
}
