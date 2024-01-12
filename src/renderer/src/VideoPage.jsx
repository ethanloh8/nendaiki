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
import Bar from './components/Bar'
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
  if (episodeData == null) {
    return <p>Loading...</p>
  }

  const navigate = useNavigate();
  const toast = useToast();
  toast.closeAll();
  const mediaObject = JSON.parse(localStorage.getItem('media'));
  const currentMedia = mediaObject[episodeData.mediaId];
  const mediaData = currentMedia.mediaData;
  const episodesData = currentMedia.episodesData;
  const episodes = Object.values(episodesData);
  const hasFetchedSourceRef = useRef(false);
  const [source, setSource] = useState(null);
  const videoRef = useRef(null);
  const [player, setPlayer] = useState(null)

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
        const response = await axios.request({
          method: 'get',
          url: 'http://localhost:3001/source',
          params: {
            providerId: episodesData.providerId,
            watchId: episodes[episodeData.episodeIndex].id,
            episode: episodeData.episodeNumber,
            id: episodeData.mediaId
          }
        });

        const defaultSource = response.data.sources.find(source => source.quality === 'default').url;
        episodes[episodeData.episodeIndex].source = defaultSource;
        const newMediaObject = mediaObject;
        newMediaObject[episodeData.mediaId].episodesData.episodes = episodes;
        localStorage.setItem('media', JSON.stringify(newMediaObject));
        setSource(defaultSource);
        toast.close('loading-video')
      } catch (error) {
        console.log(error);
        toast({
          title: 'Error fetching stream links',
          description: "Please check your network connectivity",
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        toast.close('loading-video')
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
      const cachedHistory = localStorage.getItem('history');
      const historyObject = cachedHistory ? JSON.parse(cachedHistory) : {};
      Object.entries(historyObject).forEach(([date, value]) => {
        const storedEpisodeData = JSON.parse(value);
        if (_.isEqual(storedEpisodeData, episodeData)) {
          delete historyObject[date];
        }
      });
      historyObject[new Date()] = JSON.stringify(episodeData);
      localStorage.setItem('history', JSON.stringify(historyObject));
      hasFetchedSourceRef.current = true;
    }

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [player]);

  useLayoutEffect(() => {
    if (source && videoRef.current) {
      // SOURCE: https://gist.github.com/io-st/9aabbac93ef7d32f1312c763495f10fb
      const defaultOptions = {};

      if (Hls.isSupported()) {
        // For more Hls.js options, see https://github.com/dailymotion/hls.js
        const hls = new Hls();
        hls.loadSource(source);

        // From the m3u8 playlist, hls parses the manifest and returns
        // all available video qualities. This is important, in this approach,
        // we will have one source on the Plyr player.
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {

          // Transform available levels into an array of integers (height values).
          const availableQualities = hls.levels.map((l) => l.height);

          // Add new qualities to option
          defaultOptions.quality = {
            default: availableQualities[0],
            options: availableQualities,
            // this ensures Plyr to use Hls to update quality level
            forced: true,
            onChange: (e) => updateQuality(e),
          };
          defaultOptions.keyboard = {
            focused: true,
            global: true
          };
          defaultOptions.seekTime = 5;

          // Initialize here
          setPlayer(new Plyr(videoRef.current, defaultOptions));
        });
        hls.attachMedia(videoRef.current);
        window.hls = hls;
      } else {
        // default options with no quality update in case Hls is not supported
        setPlayer(new Plyr(videoRef.current, defaultOptions));
      }
    }
  }, [source]);

  function updateQuality(newQuality) {
    window.hls.levels.forEach((level, levelIndex) => {
      if (level.height === newQuality) {
        console.log("Found quality match with " + newQuality);
        window.hls.currentLevel = levelIndex;
      }
    });
  }

  // TODO: fix video stuttering in wayland
  // TODO: conditionally render episode descriptions (for current and next episode) if description is not null and of length 0
  // TODO: make cache store current timestamp and have the caching occur when page is being navigated away
  // TODO: use ani-skip api to be able to skip intro/eds
  return (
    <Box>
      <Bar />
      <Box paddingY='60px' width='100%' display='flex' flexDir='column' bgColor={variants.mocha.base.hex}>
        <Box width='100%' textAlign='center' bg='black' display='flex' justifyContent='center'>
          {
            source &&
              <Box width='75%' maxHeight='75%' objectFit='initial'>
                <video ref={videoRef} controls poster={episodes[episodeData.episodeIndex].img}></video>
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
              onClick={() => navigate('/media-page', { state: { mediaId: mediaData.id } })}
              _hover={{ cursor: 'pointer', color: variants.mocha.text.hex, transition: 'color 0.4s ease', textDecoration: 'underline' }}
            >
              {mediaData.title.english ? mediaData.title.english : mediaData.title.romaji}
            </Heading>
            <Heading color={variants.mocha.text.hex} fontSize='30px' marginTop='8px'>
              E{episodeData.episodeIndex + 1} - {episodes[episodeData.episodeIndex].title}
            </Heading>
            <Text color={variants.mocha.text.hex} bgColor={variants.mocha.surface0.hex} padding='12px' borderRadius='10px' marginTop='15px'>
              {episodes[episodeData.episodeIndex].description}
            </Text>
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
                    navigate('/video-page', { state: { episodeData: { episodeIndex: episodeData.episodeIndex + 1, mediaId: episodeData.mediaId } } });
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
                    <Image src={episodes[episodeData.episodeIndex + 1].img} width='240px' height='135px' objectFit='cover' borderRadius='10px' />
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
  )
}

export default VideoPage;

