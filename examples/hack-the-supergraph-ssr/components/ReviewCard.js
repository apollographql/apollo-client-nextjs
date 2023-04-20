import PropTypes from "prop-types";
import ReviewRating from "./ReviewRating";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";

export default function ReviewCard({ rating, comment, location }) {
  const highlightStyles = {
    opacity: "80%",
    cursor: "pointer",
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      color="brand.white"
      p="6"
      backgroundColor="brand.midnight"
      _hover={highlightStyles}
      _focus={highlightStyles}
      as={Link}
      href={`/location/${location.id}`}
    >
      <Stack spacing="32px" my="2" direction="column" justify="space-between">
        <ReviewRating isLight size={20} rating={rating} />
        <Heading as="h3" size="md">
          {location.name}
        </Heading>
      </Stack>
      <Text noOfLines={3}>{comment}</Text>
    </Box>
  );
}

ReviewCard.propTypes = {
  id: PropTypes.string,
  comment: PropTypes.string,
  rating: PropTypes.number,
  location: PropTypes.object,
};
