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

  if (mediaId == null) {
    return <p>Loading...</p>
  }

  const toast = useToast();
  toast.closeAll();
  const navigate = useNavigate();
  const [mediaData, setMediaData] = useState(null);
  const [episodesData, setEpisodesData] = useState(null);
  const hasFetchedMediaDataRef = useRef(false);
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
              }
            }
          `
        });

        const response = await axios.request({
          method: 'post',
          url: 'https://graphql.anilist.co',
          headers: {
            'Content-Type': 'application/json'
          },
          data: data
        });

        setMediaData(response.data.data.Media);
        try {
          const response1 = await axios.request({
            method: 'get',
            url: 'http://localhost:3001/episode',
            params: {
              id: mediaId
            }
          });
          setEpisodesData(response1.data[0].episodes)

          const cachedMediaObject = localStorage.getItem('media');
          const newMediaObject = cachedMediaObject
            ? {
                ...JSON.parse(cachedMediaObject),
                [response.data.data.Media.id]: {
                  mediaData: response.data.data.Media,
                  episodesData: response1.data[0].episodes
                }
              }
            : {
                [response.data.data.Media.id]: {
                  mediaData: response.data.data.Media,
                  episodesData: response1.data[0].episodes
                }
              };

          localStorage.setItem('media', JSON.stringify(newMediaObject));
          toast.close('loading-episodes');
        } catch (error) {
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
          description: "Please check your network connectivity",
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        toast.close('loading-episodes');
      }
    };

    // TODO: keep track of release schedule and update episode cache accordingly
    // TODO: display 'No Videos Found' for media with no sources
    // TODO: if no thumbnail for the episode is found, use the cover image as thumbnail instead
    // TODO: add progress bar at the bottom of each thumbnail
    // TODO: switch to kitsu and gogo api for thumbnail and streaming sources
    // TODO: show tags/genres
    if (!hasFetchedMediaDataRef.current) {
      const cachedMedia = localStorage.getItem('media');
      const mediaObject = cachedMedia ? JSON.parse(cachedMedia) : {};

      if (mediaObject[mediaId]) {
        console.log(`Using cached data for media ${mediaId}`);
        setMediaData(mediaObject[mediaId].mediaData);
        setEpisodesData(mediaObject[mediaId].episodesData);
      } else {
        console.log(`Requesting data for media`);
        fetchMediaData();
      }
      hasFetchedMediaDataRef.current = true;
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <Box>
      <Bar />
      {
        mediaData != null &&
          <Box paddingY='60px' display='flex' flexDir='column' bgColor={variants.mocha.base.hex}>
            <Image src={mediaData.bannerImage} height='320px' objectFit='cover' />
            <Box width={boxWidth} alignSelf='center'>
              <Box display='flex' flexDirection='row' width='100%' height='193px' alignSelf='center'>
                <Image src={mediaData.coverImage.large} width='230px' height='323px' marginTop='-130px' />
                <Box display='flex' flexDirection='column' margin='15px'>
                  <Heading color={variants.mocha.text.hex}>{mediaData.title.english ? mediaData.title.english : mediaData.title.romaji}</Heading>
                  <Text
                    color={variants.mocha.subtext0.hex}
                    dangerouslySetInnerHTML={{ __html: mediaData.description }}
                    overflow='auto'
                    maxHeight='130px'
                  />
                </Box>
              </Box>
              {
                episodesData &&
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
                    {episodesData.map((episode, index) => (
                      <Box
                        key={index}
                        textAlign="left"
                        onClick={() => navigate('/video-page', { state: { episodeData: { episodeIndex: index, mediaId: mediaData.id } } })}
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
                        <Text margin='5px' color={variants.mocha.subtext1.hex}>E{index + 1} - {episode.title}</Text>
                      </Box>
                    ))}
                  </Box>
              }
            </Box>
          </Box>
      }
    </Box>
  )
}

export default MediaPage;

