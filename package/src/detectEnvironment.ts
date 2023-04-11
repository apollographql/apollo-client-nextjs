import React, { cache } from "react";

enum Env {
  RSC = "RSC",
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

export function detectEnvironment(where?: string) {
  const detectedEnviroment =
    cacheAvailable() && !hasCreateContext()
      ? Env.RSC
      : isServer()
      ? Env.SSR
      : Env.Browser;
  console.log({
    cacheAvailable: cacheAvailable(),
    hasCreateContext: hasCreateContext(),
    isServer: isServer(),
    detectedEnviroment,
    where,
  });
  return detectedEnviroment;
}
