"use client";
// chakra makes this a client component

import { ChakraProvider, Container } from "@chakra-ui/react";
import Spinner from "@/components/Spinner";
import { Suspense } from "react";
import theme from "@/theme";
import { CacheProvider } from "@chakra-ui/next-js";
import Nav from "@/components/Nav";
export function ClientLayout({ children }: React.PropsWithChildren) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <Nav />
        <Container py="4" maxW="container.xl">
          <Suspense fallback={<Spinner />}>{children}</Suspense>
        </Container>
      </ChakraProvider>
    </CacheProvider>
  );
}
