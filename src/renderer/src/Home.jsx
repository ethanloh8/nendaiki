import React, { useEffect, useState, useRef } from 'react';
import { SimpleGrid, Box, useToast, Heading, IconButton } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import HomePanel1 from './components/HomePanel1';
import { variants } from '@catppuccin/palette';
import axios from 'axios';
import Bar from './components/Bar';
import MediaBox from './components/MediaBox';

function Home() {
  const [featuredData, setFeaturedData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [mediaData, setMediaData] = useState({});
  const hasFetchedFeaturedDataRef = useRef(false);
  const trendingBoxRef = useRef(null);
  const historyBoxRef = useRef(null);
  const toast = useToast();

  const getCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    now.setDate(now.getDate() - dayOfWeek + 3); // Move to Thursday

    const firstThursday = new Date(now.getFullYear(), 0, 4);
    return 1 + Math.round(
      ((now.getTime() - firstThursday.getTime()) / (24 * 60 * 60 * 1000) - 3 + firstThursday.getDay()) / 7
    );
  };

  const scrollContent = (ref, direction) => {
    const maxScrollLength = ref.current.scrollWidth - ref.current.clientWidth;
    const scrollValue = maxScrollLength / 2 * direction;
    ref.current.scrollTo({ left: ref.current.scrollLeft + scrollValue, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: history } = await axios.get('http://localhost:3001/get-history');
        setHistoryData(history);

        const mediaIds = history.map(item => item.idAndEpisode.split('-')[0]);
        if (mediaIds.length > 0) {
          const { data } = await axios.post('http://localhost:3001/get-anime-batch', { ids: mediaIds });
          setMediaData(data);
        }
      } catch {
        toast({
          title: 'Error fetching history',
          description: 'Please check your network connectivity',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    const updateEpisodeTimestamp = async () => {
      const savedTimestamp = localStorage.getItem('saved-timestamp');
      if (savedTimestamp) {
        const [id, episodesData] = Object.entries(JSON.parse(savedTimestamp))[0];
        await axios.post('http://localhost:3001/update-anime', { id, episodesData });
        localStorage.removeItem('saved-timestamp');
      }
    };

    fetchHistory();
    updateEpisodeTimestamp();
  }, []);

  useEffect(() => {
    const fetchFeaturedData = async () => {
      try {
        const currentDate = new Date();
        const seasonMonths = ["WINTER", "SPRING", "SUMMER", "FALL"];
        const currentSeason = seasonMonths[Math.floor((currentDate.getMonth() + 1) / 3) % 4];
        const currentYear = currentDate.getFullYear();

        const queryData = JSON.stringify({
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
                  genres
                }
              }
            }
          `
        });

        const { data } = await axios.post('https://graphql.anilist.co', queryData, {
          headers: { 'Content-Type': 'application/json' }
        });

        setFeaturedData(data);
        localStorage.setItem('featuredData', JSON.stringify({ ...data, week: getCurrentWeek() }));
      } catch {
        toast({
          title: 'Error fetching featured anime',
          description: 'Please check your network connectivity',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (!hasFetchedFeaturedDataRef.current) {
      const cachedData = JSON.parse(localStorage.getItem('featuredData'));
      if (cachedData && getCurrentWeek() === cachedData.week) {
        setFeaturedData(cachedData);
      } else {
        fetchFeaturedData();
      }
      hasFetchedFeaturedDataRef.current = true;
    }
  }, []);

  return (
    <Box>
      <Bar />
      <Box display="flex" paddingY="60px" flexDirection="column" bgColor={variants.mocha.base.hex}>
        <HomePanel1 popularMedia={featuredData?.data.Page.media.slice(0, 11).sort(() => Math.random() - 0.5)} />
        <Box paddingX="70px" paddingY="40px" display="flex" flexDir="column" rowGap="30px">

          {historyData.length > 0 && (
            <Box>
              <Heading color={variants.mocha.text.hex}>Last Watched</Heading>
              <Box ref={historyBoxRef} display="flex" flexDir="row" gap="30px" overflowX="auto" mt="15px" width="100%" position="relative">
                <ChevronLeftIcon
                  position="sticky"
                  ml="-80px"
                  zIndex="1"
                  left="0"
                  boxSize="50px"
                  height="100%"
                  alignSelf="center"
                  color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
                  _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
                  onMouseDown={() => scrollContent(historyBoxRef, -1)}
                />
                {historyData
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .reduce((uniqueItems, item) => {
                    const [mediaId, episodeIndex] = item.idAndEpisode.split('-');
                    const media = mediaData[mediaId];
                    if (media && !uniqueItems.some(({ title }) => title === media.title)) {
                      uniqueItems.push({ ...item, title: media.title });
                    }
                    return uniqueItems;
                  }, [])
                  .map(({ idAndEpisode }) => {
                    const [mediaId, episodeIndex] = idAndEpisode.split('-');
                    return mediaData[mediaId] ? (
                      <MediaBox key={mediaId} media={mediaData[mediaId]} episodeIndex={episodeIndex} />
                    ) : null;
                  })}
                <ChevronRightIcon
                  position="sticky"
                  ml="-80px"
                  right="0"
                  boxSize="50px"
                  height="100%"
                  alignSelf="center"
                  color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
                  _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
                  onMouseDown={() => scrollContent(historyBoxRef, 1)}
                />
              </Box>
            </Box>
          )}

          <Box>
            <Heading color={variants.mocha.text.hex}>Trending Anime</Heading>
            <Box ref={trendingBoxRef} display="flex" flexDir="row" gap="30px" overflowX="auto" mt="15px" width="100%" position="relative">
              <ChevronLeftIcon
                position="sticky"
                ml="-80px"
                zIndex="1"
                left="0"
                boxSize="50px"
                height="100%"
                alignSelf="center"
                color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
                _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
                onMouseDown={() => scrollContent(trendingBoxRef, -1)}
              />
              {featuredData?.data.Page.media
                .sort((a, b) => b.trending - a.trending)
                .slice(0, 10)
                .map((media) => (
                  <MediaBox key={media.id} media={{
                    ...media,
                    title: media.title.english || media.title.romaji,
                    coverImage: media.coverImage.large
                  }} />
                ))}
              <ChevronRightIcon
                position="sticky"
                ml="-80px"
                right="0"
                boxSize="50px"
                height="100%"
                alignSelf="center"
                color={`rgba(${variants.mocha.text.rgb.slice(4, -1)}, 0.3)`}
                _hover={{ color: variants.mocha.text.hex, cursor: 'pointer' }}
                onMouseDown={() => scrollContent(trendingBoxRef, 1)}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Home;
