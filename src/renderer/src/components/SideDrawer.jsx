import { useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
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
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { RepeatClockIcon, HamburgerIcon } from '@chakra-ui/icons';
import { variants } from '@catppuccin/palette';
import { useNavigate } from 'react-router-dom';
import { IoMdHome } from "react-icons/io";
import { SiAnilist } from "react-icons/si";

const client_id = 18725;

function SideDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const navigate = useNavigate();
  const toast = useToast();

  // useEffect(() => {
  //   window.electron.ipcRenderer.on('oauth-token-received', (event, token) => {
  //     console.log('Access token received:', token);
  //     toast({
  //       title: 'OAuth Successful',
  //       description: 'Access token acquired!',
  //       status: 'success',
  //       duration: 3000,
  //       isClosable: true,
  //     });

  //     // Optionally send the token to your backend for secure storage
  //     axios.post('http://127.0.0.1:8000/auth-anilist', { token })
  //       .then(() => {
  //         toast({
  //           title: 'Token saved successfully!',
  //           status: 'success',
  //           duration: 3000,
  //           isClosable: true,
  //         });
  //       })
  //       .catch((error) => {
  //         console.error('Error saving token:', error);
  //         toast({
  //           title: 'Error saving token',
  //           description: error.message,
  //           status: 'error',
  //           duration: 3000,
  //           isClosable: true,
  //         });
  //       });
  //   });

  //   return () => {
  //     window.electron.ipcRenderer.removeAllListeners('oauth-token-received');
  //   };
  // }, []);

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
            {/* <Box */}
            {/*   width='100%' */}
            {/*   _hover={{ */}
            {/*     cursor: 'pointer', */}
            {/*     backgroundColor: 'rgba(169, 169, 169, 0.2)', */}
            {/*   }} */}
            {/*   onClick={() => { */}
            {/*     window.open(`https://anilist.co/api/v2/oauth/authorize?client_id=${client_id}&response_type=token`, '_blank'); */}
            {/*     onClose(); */}
            {/*   }} */}
            {/*   display='flex' */}
            {/*   columnGap='20px' */}
            {/*   paddingX='20px' */}
            {/*   paddingY='8px' */}
            {/* > */}
            {/*   <SiAnilist color={variants.mocha.text.hex} boxSize='20px' /> */}
            {/*   <Text fontSize='16px' color={variants.mocha.subtext0.hex}>Anilist Integration</Text> */}
            {/* </Box> */}
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
