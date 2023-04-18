import { SpecificEnv, detectEnvironment } from "./detectEnvironment";

export type Env = SpecificEnv | "SSR" | "RSC";

type CompleteEnvCombo<T> = (
  | {
      staticRSC: T;
      dynamicRSC: T;
    }
  | {
      staticRSC?: T;
      dynamicRSC?: T;
      RSC: T;
    }
) &
  (
    | {
        staticSSR: T;
        dynamicSSR: T;
      }
    | {
        staticSSR?: T;
        dynamicSSR?: T;
        SSR: T;
      }
  ) & {
    Browser: T;
  };
type PartialEnvCombo<T> = { [K in Env]?: T };

export function byEnv<T>(options: CompleteEnvCombo<() => T>): T;
export function byEnv<T>(
  options: PartialEnvCombo<() => T> & { default: () => T }
): T;
export function byEnv<T>(options: PartialEnvCombo<() => T>): T | undefined;
export function byEnv<T>(
  options: PartialEnvCombo<() => T> & { default?: () => T }
): T | undefined {
  const env = detectEnvironment();
  const value = options[env];
  return (
    value === undefined
      ? env == "dynamicRSC" || env == "staticRSC"
        ? options["RSC"]
        : env == "dynamicSSR" || env == "staticSSR"
        ? options["SSR"]
        : "default" in options
        ? options["default"]
        : value
      : value
  )?.();
}
