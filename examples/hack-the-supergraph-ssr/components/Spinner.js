import React from 'react';
import {Center, Spinner} from '@chakra-ui/react';

export default function LoadingSpinner() {
  return (
    <Center css={{height: 200}} fontSize="md" rounded="md">
      <Spinner mr="2" size="xl" />
    </Center>
  );
}
