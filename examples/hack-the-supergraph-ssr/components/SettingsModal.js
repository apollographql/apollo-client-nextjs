import DelaySlider from './DelaySlider';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay
} from '@chakra-ui/react';
import {useState} from 'react';

export default function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Demo Settings</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Demo Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <DelaySlider />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
