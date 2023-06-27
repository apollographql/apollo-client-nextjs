import { headers } from "next/headers";

export default function Layout({ children }: React.PropsWithChildren) {
  // force this into definitely rendering on the server, and dynamically
  console.log(headers().toString().substring(0, 0));
  return children;
}
