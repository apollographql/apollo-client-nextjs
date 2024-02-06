import { useContext } from "react";
import { DataTransportContext } from "./DataTransportAbstraction";

export function useStaticValueRef<T>(value: T): { current: T } {
  const dataTransport = useContext(DataTransportContext);
  if (!dataTransport)
    throw new Error(
      "useStaticValue must be used within a DataTransportProvider"
    );
  return dataTransport.useStaticValueRef(value);
}
