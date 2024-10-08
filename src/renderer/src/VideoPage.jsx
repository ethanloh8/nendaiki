import React, { useLayoutEffect, useEffect, useState, useRef } from 'react';
import {
  Box,
  useToast,
  Text,
  Heading,
  Image,
  IconButton
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import Bar from './components/Bar';
import { variants } from '@catppuccin/palette';
import axios from 'axios';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';
import { IoMdPlay } from "react-icons/io";
import _ from 'lodash';

function VideoPage() {
  const location = useLocation();
  const episodeData = location.state?.episodeData;
  const mediaData = location.state?.mediaObject;
  if (!episodeData || !mediaData) {
    return <p>Loading...</p>;
  }

  const navigate = useNavigate();
  const toast = useToast();
  const episodesData = mediaData.episodesData;
  const episodes = mediaData.episodesData;
  const hasFetchedSourceRef = useRef(false);
  const [source, setSource] = useState(null);
  const videoRef = useRef(null);
  const [player, setPlayer] = useState(null);

  // Function to update the anime (including episode time tracking)
  const updateAnime = async (updatedEpisodesData) => {
    try {
      await axios.post('http://localhost:3001/update-anime', {
        id: mediaData.id,
        idMal: mediaData.idMal,
        title: mediaData.title,
        episodes: mediaData.episodes,
        bannerImage: mediaData.bannerImage,
        coverImage: mediaData.coverImage,
        description: mediaData.description,
        format: mediaData.format,
        meanScore: mediaData.meanScore,
        nextAiringEpisode: mediaData.nextAiringEpisode,
        popularity: mediaData.popularity,
        ranges: mediaData.ranges,
        status: mediaData.status,
        trailer: mediaData.trailer,
        trending: mediaData.trending,
        episodesData: updatedEpisodesData,
      });
    } catch (error) {
      console.log('Error updating anime:', error);
    }
  };

  useEffect(() => {
    const fetchStreamLinks = async () => {
      toast({
        id: 'loading-video',
        title: 'Loading video...',
        status: 'loading',
        duration: null,
        isClosable: false,
      });
      try {
        const response = await axios.get(`http://localhost:3000/meta/anilist/watch/${episodesData[episodeData.episodeIndex].id}`);

        try {
          const skips = await axios.get(`https://api.aniskip.com/v2/skip-times/${mediaData.idMal}/${episodeData.episodeIndex + 1}?types=op&types=ed&episodeLength=0`);

          if (skips.data.found) {
            const opInterval = skips.data.results[0].interval;
            const edInterval = skips.data.results[1].interval;
            episodes[episodeData.episodeIndex].opInterval = opInterval;
            episodes[episodeData.episodeIndex].edInterval = edInterval;
          }
        } catch (error) {
          console.log("No skips found yet for this episode's OP and ED");
        }

        const defaultSource = response.data.sources.find(source => source.quality === 'default').url;
        episodes[episodeData.episodeIndex].source = defaultSource;
        console.log(episodes[episodeData.episodeIndex].source)


        // Update episodes with new source and sync with the backend
        await updateAnime(episodes);

        setSource(defaultSource);
        toast.close('loading-video');
      } catch (error) {
        console.log(error);
        toast({
          title: 'Error fetching stream links',
          description: "Please check your network connectivity",
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        toast.close('loading-video');
      }
    };

    if (!hasFetchedSourceRef.current) {
      const currentMediaSource = episodes[episodeData.episodeIndex].source;
      if (currentMediaSource) {
        console.log(`Using cached data for media ${episodeData.mediaId}`);
        setSource(currentMediaSource);
      } else {
        console.log(`Requesting data for media ${episodeData.mediaId}`);
        fetchStreamLinks();
      }
      axios.post('http://localhost:3001/update-history', { idAndEpisode: `${episodeData.mediaId}-${episodeData.episodeIndex}`, date: new Date() })

      hasFetchedSourceRef.current = true;
    }

    // Restore episode time when video loads
    if (player && player.playing !== true && episodesData[episodeData.episodeIndex].time) {
       player.once('canplay', event => {
         player.currentTime = episodesData[episodeData.episodeIndex].time;
       });
    }

    // Save episode time and duration before unloading or when navigating away
    const handleUnload = async () => {
      if (player) {
        const updatedEpisodes = [...episodesData];
        updatedEpisodes[episodeData.episodeIndex].time = player.currentTime;
        updatedEpisodes[episodeData.episodeIndex].duration = player.duration;
        await updateAnime(updatedEpisodes); // Sync with the backend
      }
    };

    window.addEventListener('unload', handleUnload);

    return () => {
      if (player) {
        handleUnload();
        player.destroy();
      }
    };
  }, [player]);

  useLayoutEffect(() => {
    if (source && videoRef.current) {
      const defaultOptions = {};

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(source);

        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          const availableQualities = hls.levels.map((l) => l.height);

          defaultOptions.quality = {
            default: availableQualities[0],
            options: availableQualities,
            forced: true,
            onChange: (e) => updateQuality(e),
          };
          defaultOptions.keyboard = {
            focused: true,
            global: true
          };
          defaultOptions.seekTime = 5;

          setPlayer(new Plyr(videoRef.current, defaultOptions));
        });
        hls.attachMedia(videoRef.current);
        window.hls = hls;
      } else {
        setPlayer(new Plyr(videoRef.current, defaultOptions));
      }
    }
  }, [source]);

  function updateQuality(newQuality) {
    window.hls.levels.forEach((level, levelIndex) => {
      if (level.height === newQuality) {
        window.hls.currentLevel = levelIndex;
      }
    });
  }

  return (
    <Box>
      <Bar />
      <Box paddingY='60px' width='100%' display='flex' flexDir='column' bgColor={variants.mocha.base.hex}>
        <Box width='100%' textAlign='center' bg='black' display='flex' justifyContent='center'>
          {
            source &&
              <Box width='75%' maxHeight='75%' objectFit='initial' position='relative'>
                <video ref={videoRef} controls poster={episodes[episodeData.episodeIndex].img}></video>
                <IconButton
                  icon={<IoMdPlay />}
                  isRound="true"
                  bgColor="rgba(0, 0, 0, 0.7)"
                  color="white"
                  size="lg"
                  position="absolute"
                  bottom="50px"
                  right="10px"
                  zIndex="10"
                  _hover={{ bgColor: "rgba(0, 0, 0, 0.9)" }}
                  onClick={() => {
                    if (player.currentTime < episodesData[episodeData.episodeIndex].opInterval.endTime) {
                      player.currentTime = episodesData[episodeData.episodeIndex].opInterval.endTime;
                    } else {
                      player.currentTime = episodesData[episodeData.episodeIndex].edInterval.endTime;
                    }
                  }}
                />
              </Box>
          }
        </Box>
        <Box
          display='flex'
          flexDir='row'
          justifyContent='space-between'
          marginTop='25px'
          width='73%'
          alignSelf='center'
          columnGap='69px'
        >
          <Box display='flex' flexDir='column' width='70%'>
            <Heading
              color={variants.mocha.mauve.hex}
              fontSize='18px'
              onClick={() => {
                toast.closeAll();
                navigate('/media-page', { state: { mediaId: mediaData.id } });
              }}
              _hover={{ cursor: 'pointer', color: variants.mocha.text.hex, transition: 'color 0.4s ease', textDecoration: 'underline' }}
            >
              {mediaData.title}
            </Heading>
            <Heading color={variants.mocha.text.hex} fontSize='30px' marginTop='8px'>
              E{episodeData.episodeIndex + 1} - {episodes[episodeData.episodeIndex].title}
            </Heading>
            {
              episodes[episodeData.episodeIndex].description &&
              <Text color={variants.mocha.text.hex} bgColor={variants.mocha.surface0.hex} padding='12px' borderRadius='10px' marginTop='15px'>
                {episodes[episodeData.episodeIndex].description}
              </Text>
            }
          </Box>
          <Box display='flex' flexDir='column'>
            {episodeData.episodeIndex < episodes.length - 1 &&
              <Box>
                <Heading color={variants.mocha.text.hex} fontSize='18px'>Up Next</Heading>
                <Box
                  borderRadius='10px'
                  position='relative'
                  display='flex'
                  flex='0'
                  width='480px'
                  height='135px'
                  marginTop='8px'
                  flexDir='row'
                  onClick={() => {
                    toast.closeAll();
                    navigate('/video-page', { state: { mediaObject: mediaData, episodeData: { episodeIndex: episodeData.episodeIndex + 1, mediaId: episodeData.mediaId } } });
                    window.location.reload();
                  }}
                  _before={{
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    borderRadius: '10px',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    width: 240,
                    height: 135,
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
                  <Box position='relative' borderRadius='10px'>
                    <Image src={episodes[episodeData.episodeIndex + 1].image} width='240px' height='135px' objectFit='cover' borderRadius='10px' />
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
                    />
                  </Box>
                  <Box padding='12px' height='100%' width='240px'>
                    <Heading color={variants.mocha.text.hex} fontSize='17px' className='episode-name'>
                      E{episodeData.episodeIndex + 2} - {episodes[episodeData.episodeIndex + 1].title}
                    </Heading>
                    <Text color={variants.mocha.subtext0.hex} fontSize='13px' className='episode-desc'>
                      {episodes[episodeData.episodeIndex + 1].description}
                    </Text>
                  </Box>
                </Box>
              </Box>
            }
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default VideoPage;
