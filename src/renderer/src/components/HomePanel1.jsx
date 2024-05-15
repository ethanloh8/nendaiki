import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Image,
  Text,
  Heading,
  Button,
  Stack,
  useToast,
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from '@chakra-ui/icons';
import { FaPlay } from "react-icons/fa";
import { variants } from '@catppuccin/palette';
import { useNavigate } from 'react-router-dom';

function HomePanel1({ popularMedia }) {
  if (popularMedia == null) {
    return <p>Loading...</p>;
  }

  const navigate = useNavigate();
  const toast = useToast();
  const panelDescriptionRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevClick = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + popularMedia.length) % popularMedia.length);
  };

  const handleNextClick = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % popularMedia.length);
  };

  return (
    <Box width='100%' height='60vh' display='flex' position='relative'>
      <ChevronLeftIcon
        color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
        _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
        boxSize='50px'
        alignSelf='center'
        bgColor={variants.mocha.crust.hex}
        height='100%'
        onClick={handlePrevClick}
      />
      <Box display='flex' flexDir='column' flex='0 0 28%' bgColor={variants.mocha.crust.hex} paddingY='3%'>
        <Box
          ref={panelDescriptionRef}
          height='90%'
          overflow='auto'
          paddingRight='3%'
        >
          <Heading fontSize='48px' textAlign='center' color={variants.mocha.text.hex}>
            {popularMedia[currentIndex].title.english == null ? popularMedia[currentIndex].title.romaji : popularMedia[currentIndex].title.english}
          </Heading>
          <Text
            marginTop='5%'
            color={variants.mocha.subtext0.hex}
            dangerouslySetInnerHTML={{ __html: popularMedia[currentIndex].description }}
          />
        </Box>
        <Stack>
          <Button
            leftIcon={<FaPlay />}
            bgColor={variants.mocha.mauve.hex}
            _hover={{ bg: 'white' }}
            width='110px'
            alignSelf='center'
            marginTop='5%'
            onClick={() => {
              toast.closeAll();
              navigate('/media-page', { state: { mediaId: popularMedia[currentIndex].id } });
            }}
            display='flex'
            alignItems='center'
          >
            <Text>Watch</Text>
          </Button>
        </Stack>
      </Box>
      <Box flex='1' position='relative'>
        <Image
          width='100%'
          height='100%'
          src={popularMedia[currentIndex].trailer.thumbnail.replace('hqdefault', 'maxres2')}
          objectFit='cover'
          objectPosition='center top'
        />
        <Box
          position='absolute'
          top='0'
          left='0'
          width='100%'
          height='100%'
          bgGradient={`linear(to-l, rgba(0, 0, 0, 0), ${variants.mocha.crust.hex})`}
        />
      </Box>
      <ChevronRightIcon
        color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
        _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
        boxSize='50px'
        alignSelf='center'
        height='100%'
        marginLeft='-50px'
        zIndex='1'
        onClick={handleNextClick}
      />
    </Box>
  );
}

export default HomePanel1;

