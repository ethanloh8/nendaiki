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

// TODO: make components adjust to window size
// TODO: improve anime description panel
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

  const updateSelectedRange = async (range) => {
    await axios.post('http://localhost:3001/update-anime', { id: mediaId, selectedRange: range });
  }

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
                genres
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
        const newMediaData = { ...response.data.data.Media, ranges: JSON.stringify(ranges), genres: JSON.stringify(response.data.data.Media.genres) };
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
          newMediaData.selectedRange = 0;

          // Sync with backend
          await axios.post('http://localhost:3001/update-anime', { ...newMediaData, episodesData: response1.data });

          setSelectedRange(JSON.parse(newMediaData.ranges)[newMediaData.selectedRange]);
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
        const cachedMedia = response.data;

        if (!cachedMedia.nextAiringEpisode || Date.now() < new Date(cachedMedia.nextAiringEpisode)) {
          console.log(`Using cached data for media ${mediaId}`);
          setMediaData(cachedMedia);
          setEpisodesData(cachedMedia.episodesData);
          setSelectedRange(JSON.parse(cachedMedia.ranges)[cachedMedia.selectedRange]);
        } else {
          console.log(`Updating cached data for media ${mediaId}`);
          const response1 = await axios.get(`http://localhost:3000/meta/anilist/episodes/${mediaId}`);

          // If new episodes are available, add them to the cached episodes
          const newEpisodes = response1.data.slice(cachedMedia.episodesData.length); // Get only new episodes
          cachedMedia.episodesData = [...cachedMedia.episodesData, ...newEpisodes]; // Append new episodes

          // Update the episode count and ranges based on the new data
          cachedMedia.episodes = cachedMedia.episodesData.length;
          cachedMedia.ranges = JSON.stringify(getRanges(cachedMedia.episodesData.length));

          // Fetch the nextAiringEpisode from AniList using axios.post
          const nextAiringEpisodeResponse = await axios.post('https://graphql.anilist.co', {
            query: `
              {
                Media(id: ${mediaId}) {
                  nextAiringEpisode {
                    timeUntilAiring
                  }
                }
              }
            `
          });

          const timeUntilAiring = nextAiringEpisodeResponse.data.data.Media.nextAiringEpisode?.timeUntilAiring;
          const newNextAiringEpisode = timeUntilAiring
            ? new Date(Date.now() + (timeUntilAiring * 1000))
            : null;

          cachedMedia.nextAiringEpisode = newNextAiringEpisode;

          // Sync the updated cached media with the backend, including nextAiringEpisode
          await axios.post('http://localhost:3001/update-anime', {
            id: mediaId,
            episodesData: cachedMedia.episodesData,
            nextAiringEpisode: cachedMedia.nextAiringEpisode, // Include nextAiringEpisode
          });

          setMediaData(cachedMedia);
          setEpisodesData(cachedMedia.episodesData);
          setSelectedRange(JSON.parse(cachedMedia.ranges)[cachedMedia.selectedRange]);
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
                    {episode.title ? `E${index + rangeStart + 1} - ${episode.title}` : `Episode ${index + rangeStart + 1}`}
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
        <Box display='flex' justifyContent='center' flexWrap='wrap' gap='12px' marginTop='12px'>
          {JSON.parse(mediaData.ranges).map((range, index) => (
            <Box
              key={index}
              padding='8px 16px'
              borderRadius='8px'
              borderWidth='1px'
              borderColor={range === selectedRange ? variants.mocha.pink.hex : variants.mocha.overlay0.hex}
              backgroundColor={range === selectedRange ? variants.mocha.surface0.hex : variants.mocha.base.hex}
              color={range === selectedRange ? variants.mocha.text.hex : variants.mocha.subtext1.hex}
              cursor='pointer'
              _hover={{
                bg: range === selectedRange ? variants.mocha.pink.hex : variants.mocha.overlay2.hex,
                color: range === selectedRange ? variants.mocha.base.hex : variants.mocha.text.hex,
              }}
              onClick={() => {
                setSelectedRange(range)
                updateSelectedRange(index)
              }}
              transition='all 0.2s ease-in-out'
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
            {/* anime description */}
            <Box display='flex' flexDirection='row' width='100%' height='200px' alignSelf='center'>
              <Image src={mediaData.coverImage} width='230px' height='323px' marginTop='-130px' border='2px' borderColor={variants.mocha.base.hex} />
              <Box display='flex' flexDirection='column' margin='15px'>
                <Heading color={variants.mocha.text.hex}>{mediaData.title}</Heading>
                <Box display='flex' flexWrap='wrap' gap='8px' marginTop='10px'>
                  {JSON.parse(mediaData.genres).map((genre, index) => (
                    <Text
                      key={index}
                      paddingX='8px'
                      paddingY='4px'
                      borderRadius='5px'
                      backgroundColor={variants.mocha.surface0.hex}  // Background color for tags
                      border={`1px solid ${variants.mocha.overlay0.hex}`}  // Border color
                      color={variants.mocha.pink.hex}  // Text color
                      fontWeight='bold'
                      fontSize='14px'
                    >
                      {genre}
                    </Text>
                  ))}
                </Box>
                <Text
                  color={variants.mocha.subtext0.hex}
                  dangerouslySetInnerHTML={{ __html: mediaData.description }}
                  overflow='auto'
                  maxHeight='130px'
                  marginTop='10px'
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
