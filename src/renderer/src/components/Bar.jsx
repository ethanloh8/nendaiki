import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Heading,
  Icon,
  Kbd,
  Fade,
  useDisclosure,
  Text,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { variants } from '@catppuccin/palette';
import { FaPlayCircle } from "react-icons/fa";
import { useNavigate, useLocation } from 'react-router-dom';
import Search from './Search';
import SideDrawer from './SideDrawer';

function Bar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onToggle } = useDisclosure();
  const [cursorStyle, setCursorStyle] = useState("");

  const handleSuggestionClick = (suggestion) => {
    const prevLocation = location.pathname;
    navigate('/media-page', { state: { mediaId: suggestion.id } });
    if (prevLocation == '/media-page') {
      window.location.reload();
    }
  }

  const handleViewMore = (value) => {
    const prevLocation = location.pathname;
    navigate('/search-page', { state: { query: value } })
    if (prevLocation == '/search-page') {
      window.location.reload();
    }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen && event.key === '/') {
        event.preventDefault();
        onToggle();
      } else if (isOpen && event.key === 'Escape') {
        onToggle();
      }
    };

    const handleMouseMove = () => {
      setCursorStyle("");
    };

    if (isOpen) {
      setCursorStyle("none");
    } else {
      setCursorStyle("");
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOpen, onToggle]);

  return (
    <Box
      style={{ cursor: cursorStyle }}
      position='fixed'
      zIndex='2'
      display='flex'
      width='100%'
      height='60px'
      bgColor={variants.macchiato.surface0.hex}
      borderBottomWidth='1px'
      borderColor='gray'
      alignItems='center'
    >
      <Box position='fixed' zIndex='3'>
        <Fade in={isOpen} unmountOnExit style={{ position: 'fixed' }}>
          <Box
            position='fixed'
            width='100%'
            height='100%'
            left='0'
            top='0'
            bgColor='rgba(0, 0, 0, 0.4)'
            backdropFilter='blur(5px)'
            justifyContent='center'
            alignItems='center'
          >
            <Box width='100%' height='100%' onClick={onToggle} />
            <Box position='absolute' top='24%' left='50%' transform='translate(-50%, -50%)' zIndex='1000'>
              <Search onChange={(value) => value} isOpen={isOpen} onSuggestionClick={handleSuggestionClick} onViewMore={handleViewMore} />
            </Box>
          </Box>
        </Fade>
      </Box>

      <Box display='flex' flexDir='row' columnGap='50px' marginLeft='50px'>
        <SideDrawer />
        <Box width='210px' _hover={{ cursor: 'pointer' }} display='flex' justifyContent='space-between' onClick={() => navigate('/')} alignItems='center'>
          <Icon as={FaPlayCircle} boxSize='35px' color={variants.mocha.red.hex} />
          <Heading
            fontSize='35px'
            fontFamily='monospace'
            color={variants.mocha.red.hex}
            height='100%'
            display='flex'
            flexDir='column'
            justifyContent='center'
          >
            nendaiki
          </Heading>
        </Box>
      </Box>
      <Box
        width='235px'
        height='35px'
        borderWidth='1px'
        borderRadius='10px'
        borderColor={variants.mocha.overlay0.hex}
        alignSelf='center'
        onClick={onToggle}
        _hover={{ cursor: 'pointer' }}
        bgColor={variants.mocha.base.hex}
        display='flex'
        justifyContent='space-between'
        paddingX='10px'
        position='absolute'
        left='80vh'
      >
        <Box display='flex' flexDir='row' alignItems='center'>
          <SearchIcon color={variants.mocha.overlay0.hex} />
          <Text color={variants.mocha.subtext0.hex} marginTop='3px' marginLeft='10px'>Search</Text>
        </Box>
        <Kbd
          borderColor={variants.mocha.overlay0.hex}
          bgColor={variants.mocha.mantle.hex}
          color={variants.mocha.overlay0.hex}
          alignSelf='center'
        >
          /
        </Kbd>
      </Box>
    </Box>
  )
}

export default Bar;

