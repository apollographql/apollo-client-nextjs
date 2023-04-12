import React, { cache } from "react";

import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage";

enum Env {
  static_RSC = "staticRSC",
  dynamic_RSC = "dynamicRSC",
  static_SSR = "staticSSR",
  dynamic_SSR = "dynamicSSR",
  Browser = "Browser",
}

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

export function detectEnvironment(logWhere?: string) {
  const detectedEnviroment =
    cacheAvailable() && !hasCreateContext()
      ? isStaticGeneration()
        ? Env.static_RSC
        : Env.dynamic_RSC
      : isServer()
      ? isStaticGeneration()
        ? Env.static_SSR
        : Env.dynamic_SSR
      : Env.Browser;
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
