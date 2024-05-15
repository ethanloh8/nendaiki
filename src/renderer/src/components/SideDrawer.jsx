import { useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Icon,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  Input,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { RepeatClockIcon, HamburgerIcon } from '@chakra-ui/icons';
import { variants } from '@catppuccin/palette';
import { useNavigate } from 'react-router-dom';
import { IoMdHome } from "react-icons/io";

function SideDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = useRef();
  const navigate = useNavigate();
  const toast = useToast();

  return (
    <Box>
      <IconButton
        aria-label='Open Menu Options'
        icon={<HamburgerIcon />}
        fontSize='25px'
        ref={btnRef}
        onClick={onOpen}
        color={variants.mocha.text.hex}
        bgColor='transparent'
        isRound='true'
        _hover={{ cursor: 'pointer' }}
        _active={{ bgColor: 'gray' }}
        zIndex='1'
      />
      <Drawer
        isOpen={isOpen}
        placement='left'
        onClose={onClose}
        finalFocusRef={btnRef}
        size='xs'
      >
        <DrawerOverlay />
        <DrawerContent bgColor={variants.mocha.base.hex}>
          <DrawerCloseButton color={variants.mocha.text.hex} />
          <DrawerHeader color={variants.mocha.text.hex}>nendaiki menu</DrawerHeader>

          <DrawerBody padding='0'>
            <Box
              width='100%'
              _hover={{
                cursor: 'pointer',
                backgroundColor: 'rgba(169, 169, 169, 0.2)',
              }}
              onClick={() => {
                toast.closeAll();
                navigate('/');
                onClose();
              }}
              display='flex'
              columnGap='20px'
              paddingX='20px'
              paddingY='8px'
            >
              <Icon as={IoMdHome} color={variants.mocha.text.hex} boxSize='20px' />
              <Text fontSize='16px' color={variants.mocha.subtext0.hex}>Home</Text>
            </Box>
            <Box
              width='100%'
              _hover={{
                cursor: 'pointer',
                backgroundColor: 'rgba(169, 169, 169, 0.2)',
              }}
              onClick={() => {
                toast.closeAll();
                navigate('/history-page');
                onClose();
              }}
              display='flex'
              columnGap='20px'
              paddingX='20px'
              paddingY='8px'
            >
              <RepeatClockIcon color={variants.mocha.text.hex} boxSize='20px' />
              <Text fontSize='16px' color={variants.mocha.subtext0.hex}>History</Text>
            </Box>
          </DrawerBody>

          <DrawerFooter>
            <Button variant='outline' mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme='blue'>Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default SideDrawer;

