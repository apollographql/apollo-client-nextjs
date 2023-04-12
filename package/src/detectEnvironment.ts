import React, { cache } from "react";

import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage";

export type SpecificEnv =
  | "staticRSC"
  | "dynamicRSC"
  | "staticSSR"
  | "dynamicSSR"
  | "Browser";

export function isServer() {
  return typeof window === "undefined";
}

export function cacheAvailable() {
  try {
    cache(() => void 0)();
  } catch {
    return false;
  }
  return true;
}

export function hasCreateContext() {
  return "createContext" in React;
}

export function isStaticGeneration() {
  const staticGenerationStore = staticGenerationAsyncStorage.getStore();
  return staticGenerationStore?.isStaticGeneration;
}

export function detectEnvironment(logWhere?: string): SpecificEnv {
  const detectedEnviroment =
    cacheAvailable() && !hasCreateContext()
      ? isStaticGeneration()
        ? "staticRSC"
        : "dynamicRSC"
      : isServer()
      ? isStaticGeneration()
        ? "staticSSR"
        : "dynamicSSR"
      : "Browser";
  if (logWhere)
    console.log({
      cacheAvailable: cacheAvailable(),
      hasCreateContext: hasCreateContext(),
      isServer: isServer(),
      isstaticGeneration: isStaticGeneration(),
      detectedEnviroment,
      where: logWhere,
    });
  return detectedEnviroment;
}
