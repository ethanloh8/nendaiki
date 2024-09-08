import React, { useEffect, useState, useRef } from 'react';
import {
  SimpleGrid,
  Box,
  useToast,
  Heading,
  IconButton,
  Text
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from '@chakra-ui/icons';
import HomePanel1 from './components/HomePanel1';
import { variants } from '@catppuccin/palette';
import axios from 'axios';
import Bar from './components/Bar';
import MediaBox from './components/MediaBox';

function Home() {
  const [featuredData, setFeaturedData] = useState(null);
  const [historyData, setHistoryData] = useState([]); // History state from the backend
  const [mediaData, setMediaData] = useState({}); // Anime data fetched from backend using get-anime-batch
  const hasFetchedFeaturedDataRef = useRef(false);
  const trendingBoxRef = useRef(null);
  const historyBoxRef = useRef(null);
  const toast = useToast();

  // Fetch the history from the backend and media data for each anime in the history
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
  }, []);

  useEffect(() => {
    const fetchFeaturedData = async () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        let currentSeason;
        if (currentMonth >= 3 && currentMonth <= 5) {
          currentSeason = 'SPRING';
        } else if (currentMonth >= 6 && currentMonth <= 8) {
          currentSeason = 'SUMMER';
        } else if (currentMonth >= 9 && currentMonth <= 11) {
          currentSeason = 'FALL';
        } else {
          currentSeason = 'WINTER';
        }
        const currentYear = currentDate.getFullYear();

        const data = JSON.stringify({
          query: `
            {
              Page (page: 1, perPage: 20) {
                media (type: ANIME, season: ${currentSeason}, seasonYear: ${currentYear}, sort: POPULARITY_DESC) {
                  id
                  title {
                    english
                    romaji
                  }
                  coverImage {
                    large
                  }
                  trailer {
                    site
                    id
                    thumbnail
                  }
                  description
                  trending
                  status
                  meanScore
                  popularity
                  episodes
                }
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
        setFeaturedData(response.data);
        sessionStorage.setItem('featuredData', JSON.stringify(response.data));
      } catch (error) {
        toast({
          title: 'Error fetching featured anime',
          description: "Please check your network connectivity",
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (!hasFetchedFeaturedDataRef.current) {
      fetchFeaturedData();
      const cachedFeaturedData = sessionStorage.getItem('featuredData');
      if (cachedFeaturedData) {
        setFeaturedData(JSON.parse(cachedFeaturedData));
      } else {
        fetchFeaturedData();
      }
      hasFetchedFeaturedDataRef.current = true;
    }
  }, []);

  const handleScrollLeft = (ref) => {
    const maxScrollLength = ref.current.scrollWidth - ref.current.clientWidth;
    const currentPosition = ref.current.scrollLeft;
    ref.current.scrollTo({ left: currentPosition - (maxScrollLength / 2), behavior: 'smooth' });
  };

  const handleScrollRight = (ref) => {
    const maxScrollLength = ref.current.scrollWidth - ref.current.clientWidth;
    const currentPosition = ref.current.scrollLeft;
    ref.current.scrollTo({ left: currentPosition + (maxScrollLength / 2), behavior: 'smooth' });
  };

  return (
    <Box>
      <Bar />
      <Box display='flex' paddingY='60px' flexDirection='column' bgColor={variants.mocha.base.hex}>
        <HomePanel1 popularMedia={featuredData?.data.Page.media.slice(0, 11).sort(() => Math.random() - 0.5)} />
        <Box paddingX='70px' paddingY='40px' display='flex' flexDir='column' rowGap='30px'>
          {historyData.length > 0 && (
            <Box>
              <Heading color={variants.mocha.text.hex}>Last Watched</Heading>
              <Box
                ref={historyBoxRef}
                display='flex'
                flexDir='row'
                gap='30px'
                overflowX='auto'
                marginTop='15px'
                width='100%'
                position='relative'
              >
                <ChevronLeftIcon
                  position='sticky'
                  marginLeft='-80px'
                  zIndex='1'
                  left='0'
                  boxSize='50px'
                  height='100%'
                  alignSelf='center'
                  color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
                  _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
                  onMouseDown={() => handleScrollLeft(historyBoxRef)}
                />
                {
                  historyData
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .reduce((acc, historyItem) => {
                      const [mediaId, episodeIndex] = historyItem.idAndEpisode.split('-');
                      const media = mediaData[mediaId]; // Get media data

                      // Check if media already exists in the accumulator (based on media.title)
                      if (media && !acc.some(item => item.title === media.title)) {
                        acc.push({ ...historyItem, title: media.title }); // Push only unique titles
                      }

                      return acc;
                    }, []) // Initialize an empty array for accumulation
                    .map((historyItem) => {
                      const [mediaId, episodeIndex] = historyItem.idAndEpisode.split('-');
                      const media = mediaData[mediaId]; // Use the fetched media data
                      if (media) {
                        return <MediaBox key={mediaId} media={media} episodeIndex={episodeIndex} />;
                      }
                      return null;
                    })
                }
                <ChevronRightIcon
                  position='sticky'
                  marginLeft='-80px'
                  right='0'
                  boxSize='50px'
                  height='100%'
                  alignSelf='center'
                  color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
                  _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
                  onMouseDown={() => handleScrollRight(historyBoxRef)}
                />
              </Box>
            </Box>
          )}
          <Box>
            <Heading color={variants.mocha.text.hex}>Trending Anime</Heading>
            <Box
              ref={trendingBoxRef}
              display='flex'
              flexDir='row'
              gap='30px'
              overflowX='auto'
              marginTop='15px'
              width='100%'
              position='relative'
            >
              <ChevronLeftIcon
                position='sticky'
                marginLeft='-80px'
                zIndex='1'
                left='0'
                boxSize='50px'
                height='100%'
                alignSelf='center'
                color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
                _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
                onMouseDown={() => handleScrollLeft(trendingBoxRef)}
              />
              {
                featuredData?.data.Page.media
                  .sort((a, b) => b.trending - a.trending)
                  .slice(0, 10)
                  .map((media) => {
                    const newMedia = { ...media, title: media.title.english || media.title.romaji, coverImage: media.coverImage.large }
                    return (
                      <MediaBox key={media.id} media={newMedia} />
                    )
                  })
              }
              <ChevronRightIcon
                position='sticky'
                marginLeft='-80px'
                right='0'
                boxSize='50px'
                height='100%'
                alignSelf='center'
                color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
                _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
                onMouseDown={() => handleScrollRight(trendingBoxRef)}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Home;
