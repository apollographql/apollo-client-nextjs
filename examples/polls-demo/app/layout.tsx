import "./globals.css";
import { Space_Grotesk } from "next/font/google";
import clsx from "clsx";
import { ApolloWrapper } from "./ApolloWrapper";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata = {
  title: "Apollo Next.js 13 Poll Demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={clsx("bg-blue-600 text-white", spaceGrotesk.className)}>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
