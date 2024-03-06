import React, { Suspense } from "react";
import App from "./App";
import Html from "./Html";
import { InjectionContextProvider } from "./Transport";
export * from "./Transport";
export function render({ isProduction, assets, injectIntoStream }) {
  return (
    <InjectionContextProvider value={injectIntoStream}>
      <Html isProduction={isProduction} assets={assets}>
        <Suspense>
          <React.StrictMode>
            <App />
          </React.StrictMode>
        </Suspense>
      </Html>
    </InjectionContextProvider>
  );
}
