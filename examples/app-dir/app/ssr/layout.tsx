import { Suspense } from "react";
import { Providers } from "./Providers";
export default function Layout({ children }: React.PropsWithChildren) {
  return <Providers>{children}</Providers>;
}
