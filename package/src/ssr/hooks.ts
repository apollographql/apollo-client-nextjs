"use client";
import {
  useFragment as orig_useFragment,
  useSuspenseQuery as orig_useSuspenseQuery,
  useQuery as orig_useQuery,
} from "@apollo/client";
import { useTransportValue } from "./useTransportValue";

export const useFragment = wrap(orig_useFragment, [
  "data",
  "complete",
  "missing",
]);
export const useQuery = wrap(orig_useQuery, [
  "data",
  "loading",
  "networkStatus",
  "called",
]);
export const useSuspenseQuery = wrap(orig_useSuspenseQuery, [
  "data",
  "networkStatus",
]);

function wrap<T extends (...args: any[]) => any>(
  useFn: T,
  transportKeys: (keyof ReturnType<T>)[]
): T {
  return ((...args: any[]) => {
    const result = useFn(...args);
    const transported: Partial<typeof result> = {};
    for (const key of transportKeys) {
      transported[key] = result[key];
    }
    return { ...result, ...useTransportValue(transported) };
  }) as T;
}
