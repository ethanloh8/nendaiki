import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Image,
  Text,
  Heading
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import Autosuggest from 'react-autosuggest';
import _ from 'lodash';
import axios from 'axios';
import { variants } from '@catppuccin/palette';

function getSuggestionValue(suggestion) {
  return suggestion.name;
}

function renderSuggestion(suggestion, { isHighlighted }, suggestions) {
  const index = suggestions.findIndex(item => item.name == suggestion.name);

  return (
    <ListItem
      borderTopRadius={index == 0 ? '8px' : '0px' }
      // borderBottomRadius={index == suggestions.length - 1 ? '8px' : '0px' }
      // borderBottom={index != suggestions.length - 1 ? `1px solid ${variants.mocha.surface0.hex}` : undefined}
      borderBottom={`1px solid ${variants.mocha.surface0.hex}`}
      listStyleType='none'
      padding='10px'
      style={{ cursor: 'pointer' }}
      bgColor={isHighlighted ? variants.mocha.mantle.hex : variants.mocha.base.hex}
      display='flex'
      flexDir='row'
      alignItems='center'
    >
      <Box
        width='75px'
        height='75px'
        overflow='hidden'
        flexShrink='0'
      >
        <Image
          src={suggestion.imageUrl}
          width='100%'
          height='100%'
          objectFit='cover'
        />
      </Box>
      <Box display='flex' flexDir='column' margin='10px'>
        <Heading fontSize='17px' color={variants.mocha.text.hex}>{suggestion.name}</Heading>
        <Text fontSize='14px' color={variants.mocha.subtext0.hex}>{suggestion.description}</Text>
      </Box>
    </ListItem>
  );
}

class Search extends React.Component {
  constructor() {
    super();

    this.state = {
      value: '',
      suggestions: [],
      isLoading: false,
      highlightedIndex: null,
    };

    this.debouncedLoadSuggestions = _.debounce(this.loadSuggestions, 1000);
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
  }

  async loadSuggestions(value) {
    this.setState({
      isLoading: true,
    });

    try {
      const cachedSearchResults = sessionStorage.getItem('search-results');
      const searchResultsObject = cachedSearchResults ? JSON.parse(cachedSearchResults) : {};
      if (searchResultsObject[value]) {
        this.setState({
          isLoading: false,
          suggestions: searchResultsObject[value],
        });
        return;
      }

      const data = JSON.stringify({
        query: `
          {
            Page (page: 1, perPage: 5) {
              media (search: "${value}", type: ANIME, sort: FAVOURITES_DESC) {
                id
                title {
                  english
                  romaji
                }
                coverImage {
                  medium
                }
                season
                seasonYear
                format
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

      const generateDescription = (media) => {
        let returnString = '';
        if (media.format) {
          returnString += media.format.replace(/_/g, ' ');
        }
        if (media.seasonYear) {
          if (media.format && !media.season) {
            returnString += ' • ';
          } else if (media.format && media.season) {
            returnString += ` • ${media.season.charAt(0) + media.season.slice(1).toLowerCase()} `;
          }
          returnString += media.seasonYear;
        }
        return returnString;
      }

      const suggestions = response.data.data.Page.media.map(media => ({
        id: media.id,
        name: media.title.english ? media.title.english : media.title.romaji,
        imageUrl: media.coverImage.medium,
        description: generateDescription(media)
      }));

      searchResultsObject[value] = suggestions;
      sessionStorage.setItem('search-results', JSON.stringify(searchResultsObject));

      if (value === this.state.value) {
        this.setState({
          isLoading: false,
          suggestions,
        });
      } else {
        this.setState({
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      this.setState({
        isLoading: false,
      });
    }
  }

  onSuggestionSelected = (event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {
    if (this.props.onSuggestionClick) {
      this.props.onSuggestionClick({
        id: suggestion.id,
        title: suggestion.name
      });
    }
  }

  onViewMore = (value) => {
    if (this.props.onViewMore) {
      this.props.onViewMore(value);
    }
  }

  onChange = (event, { newValue, method }) => {
    this.setState({
      value: newValue,
    });

    this.props.onChange(newValue);
  };

  onSuggestionsFetchRequested = ({ value }) => {
    this.debouncedLoadSuggestions(value);
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  onSuggestionMouseEnter = (event, { index }) => {
    this.setState({
      highlightedIndex: index,
    });
  };

  onSuggestionMouseLeave = () => {
    this.setState({
      highlightedIndex: null,
    });
  };

  render() {
    const { value, suggestions, isLoading, highlightedIndex, isOpen } = this.state;
    const inputProps = {
      placeholder: 'Search anime...',
      value,
      onChange: this.onChange,
    };
    const status = isLoading ? 'Loading...' : 'Type to load suggestions';

    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        onSuggestionSelected={this.onSuggestionSelected}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={(suggestion, { isHighlighted }) =>
          renderSuggestion(suggestion, { isHighlighted }, suggestions, this.onSuggestionClick, this.onViewMore)
        }
        inputProps={inputProps}
        onSuggestionMouseEnter={this.onSuggestionMouseEnter}
        onSuggestionMouseLeave={this.onSuggestionMouseLeave}
        renderInputComponent={(inputProps) => (
          <InputGroup
            bgColor={variants.mocha.base.hex}
            color={variants.mocha.text.hex}
            borderRadius='10px'
            alignItems='center'
            boxShadow="0 0px 20px rgba(0, 0, 0, 1)"
            _focus={{ borderWidth: '0px' }}
          >
            <InputLeftElement marginLeft='8px' marginRight='8px' height='100%'>
              <SearchIcon color={variants.mocha.subtext0.hex} boxSize='18px' />
            </InputLeftElement>
            <Input
              {...inputProps}
              ref={this.inputRef}
              width='580px'
              height='60px'
              fontSize='18px'
              borderWidth='0px'
              pl='50px'
              onKeyPress={(event) => {
                if (event.key === 'Enter' && this.state.highlightedIndex === null) {
                  this.onViewMore(this.state.value);
                }
              }}
            />
          </InputGroup>
        )}
        renderSuggestionsContainer={({ containerProps, children }) => (
          <Box {...containerProps} position='absolute' zIndex='1'>
            <List
              bgColor={variants.mocha.base.hex}
              width='580px'
              styleType='none'
              borderRadius='10px'
              marginTop='12px'
              boxShadow="0 0px 20px rgba(0, 0, 0, 1)"
            >
              {React.Children.map(children, (child, index) =>
                React.cloneElement(child, {
                  onMouseEnter: (event) => {
                    this.onSuggestionMouseEnter(event, { index });
                    if (child.props.onMouseEnter) {
                      child.props.onMouseEnter(event);
                    }
                  },
                  onMouseLeave: (event) => {
                    this.onSuggestionMouseLeave(event, { index });
                    if (child.props.onMouseLeave) {
                      child.props.onMouseLeave(event);
                    }
                  },
                })
              )}
            </List>
            {
              suggestions.length > 0 &&
                <Box
                  bgColor={variants.mocha.crust.hex}
                  onClick={() => this.onViewMore(this.state.value)}
                  borderBottomRadius='8px'
                  height='40px'
                  textAlign='right'
                  paddingX='15px'
                  paddingY='8px'
                  _hover={{ cursor: 'pointer' }}
                >
                  <Text color={variants.mocha.subtext0.hex}>View More</Text>
                </Box>
            }
          </Box>
        )}
      />
    );
  }
}

export default Search;

