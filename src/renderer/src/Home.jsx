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
import HomePanel from './components/HomePanel';
import HomePanel1 from './components/HomePanel1';
import { variants, labels } from '@catppuccin/palette';
import axios from 'axios';
import Bar from './components/Bar';
import MediaBox from './components/MediaBox';

function Home() {
  const cachedHistory = localStorage.getItem('history');
  const historyObject = cachedHistory ? JSON.parse(cachedHistory) : {};
  const cachedMedia = localStorage.getItem('media');
  const mediaObject = cachedMedia ? JSON.parse(cachedMedia) : {};
  const [featuredData, setFeaturedData] = useState(null);
  const hasFetchedFeaturedDataRef = useRef(false);
  const trendingBoxRef = useRef(null);
  const historyBoxRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    console.log(import.meta.url);
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
        console.log(currentSeason)

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
      const cachedFeaturedData = sessionStorage.getItem('featuredData');
      if (cachedFeaturedData) {
        console.log('Using cached Featured Data');
        setFeaturedData(JSON.parse(cachedFeaturedData));
      } else {
        console.log('Requesting Featured Data');
        fetchFeaturedData();
      }
      hasFetchedFeaturedDataRef.current = true;
    }
  }, []);

  const handleScrollLeft = (ref) => {
    const maxScrollLength = ref.current.scrollWidth - ref.current.clientWidth;
    const currentPosition = ref.current.scrollLeft;
    ref.current.scrollTo({ left: currentPosition - (maxScrollLength / 2), behavior: 'smooth' })
  }

  const handleScrollRight = (ref) => {
    const maxScrollLength = ref.current.scrollWidth - ref.current.clientWidth;
    const currentPosition = ref.current.scrollLeft;
    ref.current.scrollTo({ left: currentPosition + (maxScrollLength / 2), behavior: 'smooth' })
  }

  // TODO: cache trending anime data for a week
  // TODO: fix arrows for side scrolling
  return (
    <Box>
      <Bar />
      <Box display='flex' paddingY='60px' flexDirection='column' bgColor={variants.mocha.base.hex}>
        <HomePanel1 popularMedia={featuredData?.data.Page.media.slice(0, 11).toSorted(() => Math.random() - 0.5)} />
        <Box paddingX='70px' paddingY='40px' display='flex' flexDir='column' rowGap='30px'>
          {Object.keys(historyObject).length > 0 &&
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
                  Object.entries(historyObject)
                    .sort(([a, ], [b, ]) => new Date(b) - new Date(a))
                    .reduce((acc, [key, value]) => {
                      const mediaId = JSON.parse(value).mediaId;
                      if (!acc.some(mediaBox => mediaBox.props.media.id === mediaId)) {
                        // if problem occurs here, delete history from cache
                        acc.push(<MediaBox key={key} media={mediaObject[mediaId].mediaData} />);
                      }
                      return acc;
                    }, [])
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
          }
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
                  .toSorted((a, b) => b.trending - a.trending)
                  .slice(0, 10)
                  .map((media) => (
                    <MediaBox key={media.id} media={media} />
                  ))
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

