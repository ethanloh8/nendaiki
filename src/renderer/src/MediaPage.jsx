import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  useToast,
  Image,
  SimpleGrid,
  Text,
  Heading,
  IconButton
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import Bar from './components/Bar';
import { variants } from '@catppuccin/palette';
import axios from 'axios';
import { IoMdPlay } from "react-icons/io";

function MediaPage() {
  const location = useLocation();
  const mediaId = location.state?.mediaId;

  if (!mediaId) {
    return <p>Loading...</p>;
  }

  const toast = useToast();
  const navigate = useNavigate();
  const [mediaData, setMediaData] = useState(null);
  const [episodesData, setEpisodesData] = useState(null); // Changed to `null`
  const hasFetchedMediaDataRef = useRef(false);
  const [boxWidth, setBoxWidth] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [episodesDisplay, setEpisodesDisplay] = useState(null);
  const [episodeRanges, setEpisodeRanges] = useState(null);

  const getRanges = (n) => {
    const rangeSize = 50;
    const numRanges = Math.ceil(n / rangeSize);
    const ranges = [];

    for (let i = 0; i < numRanges; i++) {
      const start = i * rangeSize + 1;
      const end = Math.min((i + 1) * rangeSize, n);
      ranges.push(`${start}-${end}`);
    }

    return ranges;
  };

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

    const fetchMediaData = async () => {
      toast({
        id: 'loading-episodes',
        title: 'Loading episodes...',
        status: 'loading',
        duration: null,
        isClosable: false,
      });
      try {
        const data = JSON.stringify({
          query: `
            {
              Media (id: ${mediaId}) {
                id
                idMal
                title {
                  english
                  romaji
                }
                bannerImage
                coverImage {
                  large
                }
                trailer {
                  site
                  id
                  thumbnail
                }
                description
                format
                trending
                status
                meanScore
                popularity
                episodes
                nextAiringEpisode {
                  timeUntilAiring
                }
              }
            }
          `
        });

        const response = await axios.request({
          method: 'post',
          url: 'https://graphql.anilist.co',
          headers: {
            'Content-Type': 'application/json',
          },
          data: data,
        });

        const ranges = getRanges(response.data.data.Media.episodes);
        const newMediaData = { ...response.data.data.Media, ranges: JSON.stringify(ranges) };
        newMediaData.coverImage = newMediaData.coverImage.large;
        newMediaData.title = newMediaData.title.english || newMediaData.title.romaji;
        newMediaData.trailer = newMediaData.trailer ? newMediaData.trailer.id : null;
        newMediaData.nextAiringEpisode = new Date(Date.now() + (newMediaData.nextAiringEpisode?.timeUntilAiring * 1000));

        setMediaData(newMediaData);

        // Fetch episodesData
        try {
          const response1 = await axios.request({
            method: 'get',
            url: `http://localhost:3000/meta/anilist/episodes/${mediaId}`,
          });

          setEpisodesData(response1.data);

          // Update ranges and episode count if necessary
          if (!ranges[0]) {
            newMediaData.episodes = response1.data.length;
            newMediaData.ranges = JSON.stringify(getRanges(response1.data.length));
            setMediaData(newMediaData);
          }

          // Sync with backend
          await axios.post('http://localhost:3001/update-anime', { ...newMediaData, episodesData: response1.data });

          setSelectedRange(JSON.parse(newMediaData.ranges)[0]);
          toast.close('loading-episodes');
        } catch (error) {
          console.log(error);
          toast({
            title: 'No episodes found',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          toast.close('loading-episodes');
        }
      } catch (error) {
        toast({
          title: 'Error fetching anime',
          description: 'Please check your network connectivity',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        toast.close('loading-episodes');
      }
    };

    const fetchCache = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/get-anime/${mediaId}`);
        console.log(`Using cached data for media ${mediaId}`);
        const cachedMedia = response.data;

        if (cachedMedia.nextAiringEpisode && Date.now() < new Date(cachedMedia.nextAiringEpisode)) {
          setMediaData(cachedMedia);
          setEpisodesData(cachedMedia.episodesData);
          setSelectedRange(JSON.parse(cachedMedia.ranges)[0]);
        } else {
          const response1 = await axios.request({
            method: 'get',
            url: `http://localhost:3000/meta/anilist/episodes/${mediaId}`,
          });
          cachedMedia.episodesData[-1] = response1.data[-1];
          await axios.post('http://localhost:3001/update-anime', { id: mediaId, episodesData: cachedMedia.episodesData });
          setMediaData(cachedMedia);
          setEpisodesData(response1.data);
          setSelectedRange(JSON.parse(cachedMedia.range)[0]);
        }
      } catch (error) {
        console.log('Requesting data for media');
        fetchMediaData();
      }
    };

    if (!hasFetchedMediaDataRef.current) {
      fetchCache();
      hasFetchedMediaDataRef.current = true;
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Ensure that episodesData is fetched before rendering episodes
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (selectedRange && episodesData) {
        const rangeStart = parseInt(selectedRange.match(/\d+/)[0], 10) - 1;
        const rangeEnd = rangeStart + 50;

        setEpisodesDisplay(
          <Box
            display='flex'
            rowGap='35px'
            columnGap='50px'
            flexWrap='wrap'
            marginTop='40px'
            width='100%'
            justifyContent='left'
            alignSelf='center'
          >
            {Object.values(episodesData).slice(rangeStart, rangeEnd).map((episode, index) => {
              const episodeIndex = index + rangeStart;
              const progress = episode.duration > 0 ? (episode.time / episode.duration) * 100 : 0;

              return (
                <Box
                  key={index}
                  textAlign="left"
                  onClick={() => {
                    toast.closeAll();
                    navigate('/video-page', {
                      state: { mediaObject: { ...mediaData, episodesData }, episodeData: { episodeIndex, mediaId: mediaData.id } },
                    });
                  }}
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
                      src={episode.image}
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
                  <Text margin='5px' color={variants.mocha.subtext1.hex}>
                    E{index + rangeStart + 1} {episode.title && '-'} {episode.title}
                  </Text>
                </Box>
              );
            })}
          </Box>
        );
      }
    };

    fetchEpisodes();
  }, [selectedRange, mediaData, episodesData]);

  useEffect(() => {
    if (mediaData) {
      setEpisodeRanges(
        <Box display='flex' justifyContent='space-evenly' flexWrap='wrap' marginTop='12px'>
          {JSON.parse(mediaData.ranges).map((range, ep) => (
            <Box
              key={ep}
              padding='6px'
              borderRadius='5px'
              borderWidth='1px'
              display='inline-block'
              style={{ cursor: 'pointer' }}
              _hover={{ bgColor: range === selectedRange ? 'gray.500' : 'gray.100' }}
              bgColor={range === selectedRange ? 'gray.500' : 'white'}
              onClick={() => setSelectedRange(range)}
            >
              {range}
            </Box>
          ))}
        </Box>
      );
    }
  }, [mediaData, selectedRange]);

  return (
    <Box>
      <Bar />
      {mediaData != null && (
        <Box paddingY='60px' display='flex' flexDir='column' bgColor={variants.mocha.base.hex}>
          <Image src={mediaData.bannerImage} height='320px' objectFit='cover' />
          <Box width={boxWidth} alignSelf='center'>
            <Box display='flex' flexDirection='row' width='100%' height='193px' alignSelf='center'>
              <Image src={mediaData.coverImage} width='230px' height='323px' marginTop='-130px' />
              <Box display='flex' flexDirection='column' margin='15px'>
                <Heading color={variants.mocha.text.hex}>{mediaData.title}</Heading>
                <Text
                  color={variants.mocha.subtext0.hex}
                  dangerouslySetInnerHTML={{ __html: mediaData.description }}
                  overflow='auto'
                  maxHeight='130px'
                />
              </Box>
            </Box>
            {episodesData && (
              <Box>
                {episodeRanges}
                {episodesDisplay}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default MediaPage;
