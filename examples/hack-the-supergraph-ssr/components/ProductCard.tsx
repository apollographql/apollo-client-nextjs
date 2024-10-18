import { Suspense } from "react";
import Button from "./Button";
import ReviewRating from "./ReviewRating";
import {
  Box,
  Flex,
  Heading,
  Image,
  Text,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import Link from "next/link";
import { useSuspenseFragment, TypedDocumentNode, gql } from "@apollo/client";

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
  description: string;
  reviews: Array<{
    rating: number;
  }>;
}> = gql`
  fragment ReviewsFragment on Product {
    description
    reviews {
      rating
    }
  }
`;

function ProductCard({ id }: { id: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const { data } = useSuspenseFragment({
    fragment: ProductCardProductFragment,
    from: `Product:${id}`,
  });

  const zoomAnimation = prefersReducedMotion
    ? {}
    : {
        transform: "scale(1.1)",
        opacity: "100%",
      };

  return (
    <Box role="group" as={Link} href={`/product/${id}`} prefetch={false}>
      <Image
        transition="0.3s all ease-in-out"
        opacity={"95%"}
        _groupHover={zoomAnimation}
        _groupFocus={zoomAnimation}
        src={data?.mediaUrl}
        alt={data?.title}
        objectFit="contain"
        maxHeight="250px"
      />
      <Flex direction="column" p="3" justify="space-between" minH="120px">
        <Heading as="h2" size="md" my="4">
          {data?.title}
        </Heading>
        <Suspense fallback="Loading">
          <Reviews id={data?.id} />
        </Suspense>
      </Flex>
    </Box>
  );
}

export function Reviews({ id }: { id: string }) {
  const { data } = useSuspenseFragment({
    fragment: ReviewsFragment,
    from: `Product:${id}`,
  });

  // console.log({ data });

  const average = (array: Array<number>) =>
    array.reduce((a, b) => a + b) / array.length;

  const averageRating = data.reviews.length
    ? average(data.reviews.map((review) => review.rating))
    : 0;

  // console.log({ averageRating });

  return (
    <>
      {averageRating ? (
        <Flex direction="column" minH="100px" justify="space-between">
          <Text as="i" noOfLines={2}>{`"${data?.description}"`}</Text>
          <Flex direction="row" py="4" justify="space-between">
            <ReviewRating isHalf rating={averageRating} size={20} />
            <Button>Read More</Button>
          </Flex>
        </Flex>
      ) : (
        <Flex direction="row" justify="right">
          <Button>Leave a Review</Button>
        </Flex>
      )}
    </>
  );
}

Reviews.fragments = { ReviewsFragment };

ProductCard.fragments = {
  ProductCardProductFragment,
};
export default ProductCard;
