import { cookies } from "next/headers";
import { registerApolloClient } from "@apollo/client-react-streaming";
import {
  gql,
  ApolloClient,
  InMemoryCache,
  HttpLink,
  TypedDocumentNode,
} from "@apollo/client";

import { ClientLayout } from "./ClientLayout";
import { ApolloWrapper } from "./ApolloWrapper";

const { PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      // this needs to be an absolute url, as relative urls cannot be used in SSR
      uri: "https://main--hack-the-e-commerce.apollographos.net/graphql",
      // you can disable result caching here if you want to
      // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
      fetchOptions: { cache: "no-store" },
      // fetchOptions: { headers: { "x-custom-delay": "5000" } },
    }),
  });
});

const ProductCardProductFragment: TypedDocumentNode<{
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
}> = gql`
  fragment ProductCardProductFragment on Product {
    id
    title
    description
    mediaUrl
  }
`;

const ReviewsFragment: TypedDocumentNode<{
  id: string;
  reviews: {
    rating: number;
  };
}> = gql`
  fragment ReviewsFragment on Product {
    description
    reviews {
      rating
    }
  }
`;

const GET_LATEST_PRODUCTS: TypedDocumentNode<{
  products: { id: string }[];
}> = gql`
  query HomepageProducts {
    products {
      id
      ...ProductCardProductFragment
      ...ReviewsFragment @defer
    }
  }
  ${ProductCardProductFragment}
  ${ReviewsFragment}
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const delay = Number(cookieStore.get("apollo-x-custom-delay")?.value ?? 5000);

  return (
    <html lang="en">
      <body>
        <ApolloWrapper delay={delay}>
          <PreloadQuery query={GET_LATEST_PRODUCTS}>
            <ClientLayout>{children}</ClientLayout>
          </PreloadQuery>
        </ApolloWrapper>
      </body>
    </html>
  );
}
