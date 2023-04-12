import React, { cache } from "react";

import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage";

enum Env {
  RSC_static = "rscStatic",
  RSC_dynamic = "rscDynamic",
  SSR = "SSR",
  Browser = "Browser",
}

function isServer() {
  return typeof window === "undefined";
}

function cacheAvailable() {
  try {
    cache(() => void 0)();
  } catch {
    return false;
  }
  return true;
}

function hasCreateContext() {
  return "createContext" in React;
}

function isStaticGeneration() {
  const staticGenerationStore = staticGenerationAsyncStorage.getStore();
  return staticGenerationStore?.isStaticGeneration;
}

export function detectEnvironment(where?: string) {
  const detectedEnviroment =
    cacheAvailable() && !hasCreateContext()
      ? isStaticGeneration()
        ? Env.RSC_static
        : Env.RSC_dynamic
      : isServer()
      ? Env.SSR
      : Env.Browser;
  console.log({
    cacheAvailable: cacheAvailable(),
    hasCreateContext: hasCreateContext(),
    isServer: isServer(),
    staticGenerationStore: isStaticGeneration(),
    detectedEnviroment,
    where,
  });
  return detectedEnviroment;
}
