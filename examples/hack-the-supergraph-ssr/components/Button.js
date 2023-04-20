import PropTypes from 'prop-types';
import {Button} from '@chakra-ui/react';

const ThemeButton = ({children, ...props}) => (
  <Button
    bg="brand.400"
    _hover={{bg: 'brand.300'}}
    _focus={{bg: 'brand.300'}}
    _disabled={{bg: 'brand.200', cursor: 'not-allowed'}}
    color="brand.white"
    {...props}
  >
    {children}
  </Button>
);

ThemeButton.propTypes = {
  children: PropTypes.node.isRequired
};

export default ThemeButton;
