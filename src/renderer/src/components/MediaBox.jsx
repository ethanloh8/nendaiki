import React from 'react';
import {
  Box,
  Image,
  Text,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { variants } from '@catppuccin/palette';
import { useNavigate } from 'react-router-dom';

function MediaBox({ media }) {
  if (media == null) {
    return <p>Loading...</p>;
  }

  const navigate = useNavigate();
  const toast = useToast();

  return (
    <Box
      position='relative'
      display='flex'
      flexDir='column'
      width='230px'
      flexShrink='0'
      _hover={{ cursor: 'pointer' }}
      onClick={() => {
        toast.closeAll();
        navigate('/media-page', { state: { mediaId: media.id } });
      }}
    >
      <Image src={media.coverImage} borderRadius='10px' objectFit='cover' height='320px' />
      <Box
        position='absolute'
        top='0'
        left='0'
        width='100%'
        height='320px'
        borderRadius='10px'
        bgColor='rgba(0, 0, 0, 0.85)'
        opacity='0'
        transition='opacity 0.2s ease'
        padding='15px'
        _hover={{ opacity: 1 }}
        display='flex'
        flexDir='column'
      >
        <Heading fontSize='13px' color={variants.mocha.mauve.hex}>{media.title}</Heading>
        <Text marginTop='8px' color={variants.mocha.text.hex} fontSize='13px'>
          <span style={{ color: variants.mocha.subtext0.hex }}>Score: </span>{media.meanScore == null ? 'N/A' : media.meanScore / 10} {media.meanScore == null ? '' : media.popularity < 1000 ? `(${media.popularity} ratings)` : `(${(media.popularity / 1000).toFixed(1)}k ratings)`}
        </Text>
        <Text color={variants.mocha.text.hex} fontSize='13px'>
          <span style={{ color: variants.mocha.subtext0.hex }}>Episodes: </span>{media.episodes}
        </Text>
        <Text color={variants.mocha.text.hex} fontSize='13px'>
          <span style={{ color: variants.mocha.subtext0.hex }}>Status: </span>{(media.status.charAt(0).toUpperCase() + media.status.slice(1).toLowerCase()).replace(/_/g, ' ')}
        </Text>
        <Text
          className='mediabox-desc'
          marginTop='8px'
          fontSize='13px'
          color={variants.mocha.text.hex}
          dangerouslySetInnerHTML={{ __html: media.description }}
        />
      </Box>
      <Heading
        position='relative'
        zIndex='1'
        margin='12px'
        color={variants.mocha.text.hex}
        fontSize='14px'
        overflow='auto'
        textAlign='center'
      >
        {media.title}
      </Heading>
    </Box>
  );
}

export default MediaBox;
