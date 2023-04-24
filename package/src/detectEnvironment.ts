import React, { cache } from "react";

import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage";
import invariant from "ts-invariant";

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

export function logEnvironmentInfo(logWhere?: string) {
  invariant.log({
    cacheAvailable: cacheAvailable(),
    hasCreateContext: hasCreateContext(),
    isServer: isServer(),
    isStaticGeneration: isStaticGeneration(),
    detectedEnviroment: detectEnvironment(),
    where: logWhere,
  });
}

export function detectEnvironment(): SpecificEnv {
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
  return detectedEnviroment;
}
