import { useState, useEffect } from 'react';
import {
  Box,
  useToast,
  IconButton,
  Text,
  Heading,
  Image
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import Bar from './components/Bar';
import { useNavigate } from 'react-router-dom';
import { variants } from '@catppuccin/palette';
import { IoMdPlay } from "react-icons/io";

function HistoryPage() {
  const toast = useToast();
  toast.closeAll();
  const cachedHistory = localStorage.getItem('history');
  const [historyObject, setHistoryObject] = useState(cachedHistory ? JSON.parse(cachedHistory) : {});
  const cachedMedia = localStorage.getItem('media');
  const mediaObject = cachedMedia ? JSON.parse(cachedMedia) : {}
  const navigate = useNavigate();
  const [historyDisplay, setHistoryDisplay] = useState(null);
  const [boxWidth, setBoxWidth] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1450) {
        setBoxWidth('1350px');
      } else if (window.innerWidth >= 1100) {
        setBoxWidth('1000px');
      } else if (window.innerWidth >= 750) {
        setBoxWidth('650px');
      } else {
        setBoxWidth('300px');
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    setHistoryDisplay(
      Object.entries(historyObject)
        .sort(([a, ], [b, ]) => new Date(b) - new Date(a))
        .map((element, index) => {
          const date = element[0];
          const episodeData = JSON.parse(element[1]);
          const media = mediaObject[episodeData.mediaId];
          const episode = media.episodesData[episodeData.episodeIndex];
          const formattedDate = new Date(date);
          let month = formattedDate.getMonth() + 1;
          let day = formattedDate.getDate();
          let year = formattedDate.getFullYear();
          let hours = formattedDate.getHours();
          let minutes = formattedDate.getMinutes();
          month = month < 10 ? `0${month}` : month;
          day = day < 10 ? `0${day}` : day;
          hours = hours < 10 ? `0${hours}` : hours;
          minutes = minutes < 10 ? `0${minutes}` : minutes;
          const formattedDateStr = `${month}/${day}/${year}`;

          return (
            <Box
              key={index}
              textAlign="left"
              onClick={() => navigate('/video-page', { state: { episodeData: episodeData }})}
              width='300px'
              position='relative'
              _before={{
                content: '""',
                display: 'block',
                position: 'absolute',
                borderRadius: '10px',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                height: 169,
                backgroundColor: 'black',
                opacity: 0.5,
                zIndex: 1,
                transition: 'opacity 0.3s ease',
              }}
              _hover={{
                cursor: 'pointer',
                '&::before': {
                 opacity: 0,
                },
              }}
            >
              <Box borderRadius='10px' position='relative'>
                <Image src={episode.img} width='100%' height='169px' objectFit='cover' borderRadius='10px' />
                <IconButton
                  icon={<IoMdPlay />}
                  isRound='true'
                  bgColor='rgba(0, 0, 0, 0.8)'
                  fontSize='40px'
                  textColor='white'
                  boxSize='75px'
                  position='absolute'
                  top='50%'
                  left='50%'
                  transform='translate(-50%, -50%)'
                  _hover={{ bgColor: 'rgba(0, 0, 0, 0.8)' }}
                />
              </Box>
              <Text
                marginX='5px'
                marginTop='8px'
                fontSize='13px'
                color={variants.mocha.mauve.hex}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/media-page', { state: { mediaId: episodeData.mediaId } });
                }}
                _hover={{ cursor: 'pointer', color: variants.mocha.text.hex, transition: 'color 0.4s ease', textDecoration: 'underline' }}
                zIndex='2'
              >
                {media.mediaData.title.english ? media.mediaData.title.english : media.mediaData.title.romaji}
              </Text>
              <Heading
                marginX='5px'
                marginTop='3px'
                fontSize='16px'
                color={variants.mocha.subtext1.hex}
              >
                E{episodeData.episodeIndex + 1} - {episode.title}
              </Heading>
              <Box display='flex' flexDir='row' justifyContent='space-between'>
                <Text
                  marginX='5px'
                  marginTop='9px'
                  fontSize='14px'
                  color={variants.mocha.subtext0.hex}
                >
                  {formattedDateStr}
                </Text>
                <DeleteIcon
                  margin='5px'
                  boxSize='18px'
                  color={variants.mocha.subtext0.hex}
                  _hover={{ color: variants.mocha.text.hex }}
                  onClick={(e) => {
                    e.stopPropagation();
                    delete historyObject[date];
                    localStorage.setItem('history', JSON.stringify(historyObject));
                    setHistoryObject(prevHistory => {
                      return {...prevHistory};
                    });
                  }}
                />
              </Box>
            </Box>
          )
        })
    );
  }, [historyObject]);

  return (
    <Box>
      <Bar />
      <Box paddingY='60px' display='flex' flexDir='column' bgColor={variants.mocha.base.hex}>
        <Box
          display='flex'
          flexDir='column'
          justifySelf='center'
          marginX='12%'
          width={boxWidth}
          alignSelf='center'
        >
          <Box display='flex' flexDir='row' justifyContent='space-between' marginTop='40px'>
            <Heading color={variants.mocha.text.hex}>History</Heading>
            <Text
              color={variants.mocha.subtext0.hex}
              _hover={{ cursor: 'pointer' }}
              onClick={() => {
                setHistoryObject({});
                localStorage.removeItem('history');
              }}
            >
              Clear History
            </Text>
          </Box>
          <Box display='flex' rowGap='35px' columnGap='50px' flexWrap='wrap' marginTop='40px' width='100%'>
            {historyDisplay}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default HistoryPage;

