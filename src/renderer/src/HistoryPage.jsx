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
import axios from 'axios';

function HistoryPage() {
  const toast = useToast();
  const [historyData, setHistoryData] = useState([]); // History state from the backend
  const [mediaData, setMediaData] = useState({}); // Anime data fetched from backend using get-anime-batch
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
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:3001/get-history');
        const history = response.data;

        setHistoryData(history);

        // Extract media IDs from history
        const mediaIds = history.map(item => item.idAndEpisode.split('-')[0]);

        if (mediaIds.length > 0) {
          // Fetch anime data in a batch using the get-anime-batch endpoint
          const mediaResponse = await axios.post('http://localhost:3001/get-anime-batch', { ids: mediaIds });

          // Set the media data
          setMediaData(mediaResponse.data);
        }
      } catch (error) {
        toast({
          title: 'Error fetching history',
          description: "Please check your network connectivity",
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchHistory(); // Call the history fetch function
  }, [toast]);

  useEffect(() => {
    if (historyData.length === 0 || Object.keys(mediaData).length === 0) return;

    setHistoryDisplay(
      historyData
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date
        .map((element, index) => {
          const [mediaId, episodeIndexString] = element.idAndEpisode.split('-');
          const episodeIndex = parseInt(episodeIndexString);
          const media = mediaData[mediaId]; // Fetch media data using mediaId
          if (!media) return null;

          const episode = media.episodesData[episodeIndex]; // Fetch episode data
          const formattedDate = new Date(element.date); // Format the date
          let month = formattedDate.getMonth() + 1;
          let day = formattedDate.getDate();
          let year = formattedDate.getFullYear();
          month = month < 10 ? `0${month}` : month;
          day = day < 10 ? `0${day}` : day;
          const formattedDateStr = `${month}/${day}/${year}`;
          const progress = episode.duration > 0 ? (episode.time / episode.duration) * 100 : 0;

          return (
            <Box
              key={index}
              textAlign="left"
              onClick={() => navigate('/video-page', { state: { mediaObject: media, episodeData: { mediaId, episodeIndex } } })}
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
                <Image
                  src={episode.image} // Use the episode image
                  width='100%'
                  height='169px'
                  objectFit='cover'
                  borderRadius='10px'
                />
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
                {progress > 0 && (
                  <Box
                    position='absolute'
                    bottom='0'
                    left='0'
                    height='5px'
                    width='100%'
                    bg='gray.600'
                    borderRadius='0 0 10px 10px'
                    overflow='hidden'
                    zIndex='2'
                    opacity='0.8'
                  >
                    <Box
                      height='100%'
                      width={`${progress}%`}
                      bg='rgba(149,2,61,0.7)'
                      transition='width 0.3s ease'
                    />
                  </Box>
                )}
              </Box>
              <Text
                marginX='5px'
                marginTop='8px'
                fontSize='13px'
                color={variants.mocha.mauve.hex}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/media-page', { state: { mediaId } });
                }}
                _hover={{ cursor: 'pointer', color: variants.mocha.text.hex, transition: 'color 0.4s ease', textDecoration: 'underline' }}
                zIndex='2'
              >
                {media.title}
              </Text>
              <Heading
                marginX='5px'
                marginTop='3px'
                fontSize='16px'
                color={variants.mocha.subtext1.hex}
              >
                {episode.title ? `E${episodeIndex + 1} - ${episode.title}` : `Episode ${episodeIndex + 1}`}
              </Heading>
              <Box display='flex' flexDir='row' justifyContent='space-between'>
                <Text
                  marginX='5px'
                  marginTop='9px'
                  fontSize='14px'
                  color={variants.mocha.subtext0.hex}
                >
                  {formattedDateStr} {/* Display the formatted date */}
                </Text>
                <DeleteIcon
                  margin='5px'
                  boxSize='18px'
                  color={variants.mocha.subtext0.hex}
                  _hover={{ color: variants.mocha.text.hex }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await axios.delete(`http://localhost:3001/delete-history/${element.idAndEpisode}`);
                      setHistoryData(prevHistory => prevHistory.filter(h => h.idAndEpisode !== element.idAndEpisode));
                    } catch (error) {
                      toast({
                        title: 'Error deleting history entry',
                        description: "Please check your network connectivity",
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                      });
                    }
                  }}
                />
              </Box>
            </Box>
          );
        })
    );
  }, [historyData, mediaData, navigate, toast]);

  const handleClearAll = async () => {
    try {
      await axios.delete('http://localhost:3001/delete-history-all');
      setHistoryData([]); // Clear history state
      setHistoryDisplay(null);
      toast({
        title: 'History cleared',
        description: "All history entries have been cleared",
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error clearing history',
        description: "Please check your network connectivity",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // TODO: make confirmation dialog before clearing all
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
              onClick={handleClearAll}
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
  );
}

export default HistoryPage;
