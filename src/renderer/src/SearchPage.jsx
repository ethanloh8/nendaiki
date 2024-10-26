import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  useToast,
  Input,
  Button
} from '@chakra-ui/react';
import {
  UpDownIcon
} from '@chakra-ui/icons';
import MediaBox from './components/MediaBox';
import Bar from './components/Bar';
import { variants } from '@catppuccin/palette';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Select, { components } from 'react-select';

const selectStyles = {
  control: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: variants.mocha.surface0.hex,
    color: variants.mocha.text.hex,
    borderWidth: '1px',
    borderColor: variants.mocha.surface2.hex,
    ':hover': {
      backgroundColor: variants.mocha.surface1.hex,
    },
    boxShadow: 'none',
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: variants.mocha.blue.hex,
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: variants.mocha.surface0.hex,
    color: variants.mocha.subtext1.hex,
  }),
  placeholder: (baseStyles) => ({
    ...baseStyles,
    color: variants.mocha.text.hex,
  }),
  dropdownIndicator: (baseStyles) => ({
    ...baseStyles,
    color: variants.mocha.text.hex,
    ':hover': {
      color: variants.mocha.text.hex,
    },
  }),
  indicatorSeparator: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: variants.mocha.text.hex,
  }),
  option: (baseStyles, { isFocused }) => ({
    ...baseStyles,
    backgroundColor: isFocused ? variants.mocha.surface1.hex : variants.mocha.surface0.hex, // Change background color on hover
    color: variants.mocha.text.hex,
    ':active': {
      backgroundColor: variants.mocha.surface1.hex, // Optional: Change on active state
    },
  }),
  multiValue: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: variants.mocha.surface2.hex, // Change this to your desired background color
  }),
  multiValueLabel: (baseStyles) => ({
    ...baseStyles,
    color: variants.mocha.text.hex, // Change the text color inside the selected value box
  }),
  multiValueRemove: (baseStyles) => ({
    ...baseStyles,
    color: variants.mocha.text.hex, // Change the color of the remove button
    ':hover': {
      backgroundColor: variants.mocha.red.hex, // Change background color on hover
      color: variants.mocha.surface1.hex, // Change text color on hover
    },
  }),
};


const sortOptions = [
  { value: 'TITLE_ROMAJI', label: 'Title (Romaji)' },
  { value: 'TITLE_ENGLISH', label: 'Title (English)' },
  { value: 'START_DATE_DESC', label: 'Release Date' },
  { value: 'SCORE_DESC', label: 'Score' },
  { value: 'POPULARITY_DESC', label: 'Popularity' },
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'FAVOURITES_DESC', label: 'Favorites' },
];

const seasonOptions = [
  { value: 'WINTER', label: 'Winter' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'FALL', label: 'Fall' },
];

const yearOptions = ((startYear, endYear) => {
  let arr = [];
  for (let i = endYear; i >= startYear; i--) {
    arr.push(i);
  }
  return arr;
})(1940, new Date().getFullYear() + 1);

const formatOptions = [
  { label: 'TV Show', value: 'TV' },
  { label: 'TV Short', value: 'TV_SHORT' },
  { label: 'Movie', value: 'MOVIE' },
  { label: 'Special', value: 'SPECIAL' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Music', value: 'MUSIC' },
];

// SOURCE: https://codesandbox.io/p/sandbox/react-select-with-checkboxes-bedj8?file=%2Fsrc%2FApp.js%3A8%2C14
const InputOption = ({
  getStyles,
  Icon,
  isDisabled,
  isFocused,
  isSelected,
  children,
  innerProps,
  ...rest
}) => {
  const [isActive, setIsActive] = useState(false);
  const onMouseDown = () => setIsActive(true);
  const onMouseUp = () => setIsActive(false);
  const onMouseLeave = () => setIsActive(false);

  // styles
  let bg = "transparent";
  if (isFocused) bg = "#eee";
  if (isActive) bg = "#B2D4FF";

  const style = selectStyles

  // prop assignment
  const props = {
    ...innerProps,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    style
  };

  return (
    <components.Option
      {...rest}
      isDisabled={isDisabled}
      isFocused={isFocused}
      isSelected={isSelected}
      getStyles={getStyles}
      innerProps={props}
    >
      <input type="checkbox" checked={isSelected} />
      {children}
    </components.Option>
  );
};

function SearchPage() {
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.query);
  const toast = useToast();

  const [results, setResults] = useState(null);
  const hasFetchedSearchRef = useRef(false);

  const cachedGenreCollection = localStorage.getItem('genre-collection');
  const cachedMediaTagCollection = localStorage.getItem('media-tag-collection');

  const [genreCollection, setGenreCollection] = useState([]);
  const [mediaTagCollection, setMediaTagCollection] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedSort, setSelectedSort] = useState('FAVOURITES_DESC');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);

  useEffect(() => {
    const fetchSearch = async () => {
      try {
        const data = JSON.stringify({
          query: `
            {
              Page (page: 1, perPage: 30) {
                media (${query ? `search: "${query}", ` : ''}type: ANIME, sort: FAVOURITES_DESC, genre_not_in: ["Hentai"]) {
                  id
                  title {
                    english
                    romaji
                  }
                  coverImage {
                    large
                  }
                  trailer {
                    id
                    site
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
              ${!cachedGenreCollection ? 'GenreCollection' : ''}
              ${
                !cachedMediaTagCollection
                  ? `MediaTagCollection {
                      isAdult
                      name
                    }`
                  : ''
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

        setResults(response.data.data.Page.media);

        if (!cachedGenreCollection) {
          const genreCollectionData = response.data.data.GenreCollection
            .filter(genre => genre != 'Hentai')
            .map(genre => ({ label: genre, value: genre }));
          setGenreCollection(genreCollectionData);
          localStorage.setItem('genre-collection', JSON.stringify(genreCollectionData));
        } else {
          setGenreCollection(JSON.parse(cachedGenreCollection));
        }

        if (!cachedMediaTagCollection) {
          const filteredMediaTagCollection = response.data.data.MediaTagCollection
            .filter((e) => !e.isAdult)
            .map((e) => e.name)
            .map((e) => ({ label: e, value: e }));
          setMediaTagCollection(filteredMediaTagCollection);
          localStorage.setItem('media-tag-collection', JSON.stringify(filteredMediaTagCollection));
        } else {
          setMediaTagCollection(JSON.parse(cachedMediaTagCollection));
        }
      } catch (error) {
        console.log(error);
        toast({
          title: 'Error searching for anime',
          description: 'Please check your network connectivity',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (!hasFetchedSearchRef.current) {
      fetchSearch();
      hasFetchedSearchRef.current = true;
    }
  }, []);

  const handleFilter = async () => {
    const formattedGenres = selectedGenres
      .map(genre => `"${genre}"`)
      .join(', ');
    const formattedTags = selectedTags
      .map(tag => `"${tag}"`)
      .join(', ');

    try {
      const data = JSON.stringify({
        query: `
          {
            Page (page: 1, perPage: 30) {
              media (
${query && `search: "${query}", `}
${selectedGenres.length > 0 ? `genre_in: [${formattedGenres}], ` : ''}
${selectedTags.length > 0 ? `tag_in: [${formattedTags}], ` : ''}
${selectedSort ? `sort: ${selectedSort}, ` : ''}
${selectedYear ? `seasonYear: ${selectedYear}, ` : ''}
${selectedSeason ? `season: ${selectedSeason}, ` : ''}
${selectedFormat ? `format: ${selectedFormat}, ` : ''}
genre_not_in: ["Hentai"],
type: ANIME
              ) {
                id
                title {
                  english
                  romaji
                }
                coverImage {
                  large
                }
                trailer {
                  id
                  site
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
      console.log(data)

      const response = await axios.request({
        method: 'post',
        url: 'https://graphql.anilist.co',
        headers: {
          'Content-Type': 'application/json'
        },
        data: data
      });

      setResults(response.data.data.Page.media)
    } catch (error) {
      console.log(error);
      toast({
        title: 'Error searching for anime',
        description: 'Please check your network connectivity',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Bar />
      <Box paddingY="60px" display="flex" flexDirection="column" bgColor={variants.mocha.base.hex} minHeight="100vh">
        <Box display='flex' wrap="wrap" justifyContent="center" alignItems="center" gap="20px" padding="20px">
          <Input
            placeholder="Search"
            color={variants.mocha.text.hex}
            variant="filled"
            bg={variants.mocha.surface0.hex}
            _hover={{ bg: variants.mocha.surface1.hex }}
            onChange={(e) => setQuery(e.target.value)}
            width="300px"
          />
          <Box width="200px">
            <Select
              closeMenuOnSelect={true}
              hideSelectedOptions={false}
              isClearable={true}
              onChange={(option) => setSelectedYear(option ? option.value : null)}
              options={yearOptions.map(year => ({ label: year, value: year }))}
              placeholder="Year"
              styles={selectStyles} // Apply common styles
            />
          </Box>
          <Box width="200px">
            <Select
              closeMenuOnSelect={true}
              hideSelectedOptions={false}
              isClearable={true}
              onChange={(option) => setSelectedSeason(option ? option.value : null)}
              options={seasonOptions}
              placeholder="Season"
              styles={selectStyles} // Apply common styles
            />
          </Box>
          <Box width='200px'>
            <Select
              defaultValue={[]}
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              onChange={(options) => {
                if (Array.isArray(options)) {
                  setSelectedGenres(options.map((opt) => opt.value));
                }
              }}
              options={genreCollection}
              components={{
                Option: InputOption,
              }}
              placeholder="Genres"
              styles={selectStyles} // Apply common styles
            />
          </Box>
          <Box width='200px'>
            <Select
              defaultValue={[]}
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              onChange={(options) => {
                if (Array.isArray(options)) {
                  setSelectedTags(options.map((opt) => opt.value));
                }
              }}
              options={mediaTagCollection}
              components={{
                Option: InputOption
              }}
              placeholder="Tags"
              styles={selectStyles} // Apply common styles
            />
          </Box>
          <Box width="200px">
            <Select
              closeMenuOnSelect={true}
              hideSelectedOptions={false}
              isClearable={true}
              onChange={(option) => setSelectedFormat(option ? option.value : null)}
              options={formatOptions}
              placeholder="Format"
              styles={selectStyles} // Apply common styles
            />
          </Box>
          <Box width="200px">
            <Select
              defaultValue={{ value: 'FAVOURITES_DESC', label: 'Favorites' }}
              closeMenuOnSelect={true}
              hideSelectedOptions={false}
              onChange={(option) => setSelectedSort(option.value)}
              options={sortOptions}
              styles={selectStyles} // Apply common styles
              placeholder="Sort By"
            />
          </Box>
          <Button colorScheme="teal" variant="solid" onClick={() => handleFilter()}>
            Filter
          </Button>
        </Box>
        {results && (
          <Box
            display="flex"
            flexWrap="wrap"
            justifyContent="center"
            padding="20px"
            bgColor={variants.mocha.base.hex}
            gap="25px"
          >
            {results.map((result, index) => (
              <MediaBox key={index} media={{ ...result, title: result.title.english || result.title.romaji, coverImage: result.coverImage.large }} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default SearchPage;
