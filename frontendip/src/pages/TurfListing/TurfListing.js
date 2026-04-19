// Turf Listing Component
// Purpose: Display all approved turfs with filtering and sorting options
// Features: Search by turf name, filter by availability, sort by different criteria

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import TurfCard from '../../components/TurfCard/TurfCard';
import { getAllTurfs, getTurfSearchSuggestions } from '../../services/turfService';
import './TurfListing.css';

const TurfListing = () => {
  const [searchParams] = useSearchParams();

  // State variables
  const [allTurfs, setAllTurfs] = useState([]);
  const [sortBy, setSortBy] = useState('priceLow');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [hasDistanceData, setHasDistanceData] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const searchContainerRef = useRef(null);

  function getInitialSearchStatus(searchValue) {
    if (searchValue) {
      return `Showing results for "${searchValue}"`;
    }
    return '';
  }

  function getDistanceForSort(turf) {
    if (typeof turf.distanceKm === 'number') {
      return turf.distanceKm;
    }
    return Number.MAX_VALUE;
  }

  function getNoResultsMessage() {
    return 'No turfs found. Please check back later.';
  }

  // Load turfs when page first opens and when query string changes
  useEffect(function() {
    const initialSearch = (searchParams.get('search') || '').trim();
    setSearchQuery(initialSearch);
    const initialStatus = getInitialSearchStatus(initialSearch);
    loadTurfs(initialSearch, userCoords, initialStatus, showAvailableOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(function() {
    if (!showSuggestions) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return function() {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  useEffect(function() {
    const normalizedQuery = (searchQuery || '').trim();
    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return undefined;
    }

    const timeoutId = setTimeout(async function() {
      try {
        const serverSuggestions = await getTurfSearchSuggestions(normalizedQuery);
        setSuggestions(serverSuggestions || []);
        setShowSuggestions(true);
        setActiveSuggestionIndex(-1);
      } catch (_ignored) {
        setSuggestions([]);
        setShowSuggestions(true);
        setActiveSuggestionIndex(-1);
      }
    }, 300);

    return function() {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  function handleLoadedTurfs(turfs) {
    setAllTurfs(turfs);
    const hasDistance = turfs.some(function(t) { return typeof t.distanceKm === 'number'; });
    setHasDistanceData(hasDistance);
  }

  async function loadTurfs(query, coords, successMessage, availableOnly = showAvailableOnly) {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (query) {
        params.search = query;
      }
      if (coords) {
        params.lat = coords.lat;
        params.lng = coords.lng;
      }
      params.availableOnly = availableOnly;

      const serverTurfs = await getAllTurfs(params);
      const normalizedQuery = (query || '').trim().toLowerCase();
      let turfs = serverTurfs;
      if (normalizedQuery) {
        turfs = serverTurfs.filter(function(turf) {
          const turfName = (turf.name || '').toLowerCase();
          return turfName.includes(normalizedQuery);
        });
      }

      handleLoadedTurfs(turfs);
      setLocationStatus(successMessage || '');
    } catch (err) {
      setError('Failed to load turfs. Please try again.');
      setLocationStatus('');
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Filter turfs based on user's selections
  const filteredTurfs = [];
  for (let i = 0; i < allTurfs.length; i++) {
    const turf = allTurfs[i];
    filteredTurfs.push(turf);
  }

  // Step 2: Sort the filtered turfs based on selected option
  const sortedTurfs = [];
  // First, copy all filtered turfs to sorted array
  for (let i = 0; i < filteredTurfs.length; i++) {
    sortedTurfs.push(filteredTurfs[i]);
  }
  
  // Now sort the array based on selected criteria
  if (sortBy === 'priceLow') {
    // Sort by price: lowest first
    sortedTurfs.sort(function(turfA, turfB) {
      const priceA = turfA.pricePerHour || 0;
      const priceB = turfB.pricePerHour || 0;
      return priceA - priceB;  // Lower price comes first
    });
  } else if (sortBy === 'priceHigh') {
    // Sort by price: highest first
    sortedTurfs.sort(function(turfA, turfB) {
      const priceA = turfA.pricePerHour || 0;
      const priceB = turfB.pricePerHour || 0;
      return priceB - priceA;  // Higher price comes first
    });
  } else if (sortBy === 'nearest') {
    sortedTurfs.sort(function(turfA, turfB) {
      const distanceA = getDistanceForSort(turfA);
      const distanceB = getDistanceForSort(turfB);
      return distanceA - distanceB;
    });
  }

  // Handler functions for user interactions
  async function handleSortChange(event) {
    const selectedSort = event.target.value;

    if (selectedSort !== 'nearest') {
      setSortBy(selectedSort);
      return;
    }

    setSortBy('nearest');
    if (!userCoords) {
      await handleUseCurrentLocation({ keepNearestSort: true });
      return;
    }

    await loadTurfs(searchQuery.trim(), userCoords, 'Showing turfs closest to you', showAvailableOnly);
  }

  async function handleAvailableOnlyChange(event) {
    const checked = event.target.checked;
    setShowAvailableOnly(checked);
    await loadTurfs(searchQuery.trim(), userCoords, locationStatus, checked);
  }

  function handleUseCurrentLocation(options = {}) {
    const keepNearestSort = options.keepNearestSort === true;
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported in this browser. Nearest sorting is unavailable.');
      if (keepNearestSort) {
        setSortBy('priceLow');
      }
      return;
    }

    setLocationStatus('Requesting your location.');
    navigator.geolocation.getCurrentPosition(async function(position) {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setUserCoords(coords);
      await loadTurfs(searchQuery.trim(), coords, 'Showing turfs closest to you');
    }, function() {
      setLocationStatus('Location access was denied. Enable location to sort by nearest.');
      if (keepNearestSort) {
        setSortBy('priceLow');
      }
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  }

  async function handleNameSearch(overrideQuery) {
    let finalQuery = searchQuery;
    if (typeof overrideQuery === 'string') {
      finalQuery = overrideQuery;
    }

    const query = String(finalQuery || '').trim();
    if (!query) {
      await loadTurfs('', userCoords, '', showAvailableOnly);
      return;
    }

    const status = `Showing results for "${query}"`;
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    await loadTurfs(query, userCoords, status, showAvailableOnly);
  }

  async function handleSuggestionSelect(suggestionName) {
    setSearchQuery(suggestionName);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    await handleNameSearch(suggestionName);
  }

  function renderSuggestionName(suggestionName) {
    const normalizedQuery = (searchQuery || '').trim();
    if (!normalizedQuery) {
      return suggestionName;
    }

    const lowerName = suggestionName.toLowerCase();
    const lowerQuery = normalizedQuery.toLowerCase();
    const matchIndex = lowerName.indexOf(lowerQuery);

    if (matchIndex < 0) {
      return suggestionName;
    }

    const before = suggestionName.slice(0, matchIndex);
    const matched = suggestionName.slice(matchIndex, matchIndex + normalizedQuery.length);
    const after = suggestionName.slice(matchIndex + normalizedQuery.length);

    return (
      <>
        {before}
        <strong>{matched}</strong>
        {after}
      </>
    );
  }

  if (loading) {
    return (
      <div className="turf-listing">
        <div className="container page-shell" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading Turfs</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="turf-listing">
        <div className="container page-shell" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2 style={{ color: '#e74c3c' }}>Unable To Load Turfs</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="turf-listing">
      {/* Page Header */}
      <div className="listing-header">
        <div className="container page-shell">
          <h1 className="listing-title">Find Your Perfect Turf</h1>
          <p className="listing-subtitle">Browse and book the best sports turfs in your area.</p>
          {sortBy === 'nearest' && hasDistanceData && (
            <div className="distance-indicator">Sorted by nearest first</div>
          )}
        </div>
      </div>

      <div className="container page-shell">
        <div className="proximity-tools">
          <div className="hero-search" ref={searchContainerRef}>
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search by turf name"
              value={searchQuery}
              onChange={function(event) {
                setSearchQuery(event.target.value);
              }}
              onFocus={function() {
                if ((searchQuery || '').trim().length >= 2) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={function(event) {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  if (!showSuggestions) {
                    setShowSuggestions(true);
                    return;
                  }

                  setActiveSuggestionIndex(function(prev) {
                    const next = prev + 1;
                    if (next >= suggestions.length) {
                      return 0;
                    }
                    return next;
                  });
                  return;
                }

                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveSuggestionIndex(function(prev) {
                    const next = prev - 1;
                    if (next < 0) {
                      return suggestions.length - 1;
                    }
                    return next;
                  });
                  return;
                }

                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (showSuggestions && activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                    handleSuggestionSelect(suggestions[activeSuggestionIndex].name);
                    return;
                  }
                  handleNameSearch();
                }

                if (event.key === 'Escape') {
                  setShowSuggestions(false);
                  setActiveSuggestionIndex(-1);
                }
              }}
            />
            <button className="hero-search-button" onClick={handleNameSearch}>
              Search
            </button>

            {showSuggestions && (searchQuery || '').trim().length >= 2 && (
              <div className="search-suggestions-dropdown">
                {suggestions.length > 0 ? (
                  suggestions.map(function(suggestion, index) {
                    const isActive = index === activeSuggestionIndex;
                    return (
                      <button
                        type="button"
                        key={suggestion.id}
                        className={isActive ? 'search-suggestion-item active' : 'search-suggestion-item'}
                        onMouseEnter={function() {
                          setActiveSuggestionIndex(index);
                        }}
                        onClick={function() {
                          handleSuggestionSelect(suggestion.name);
                        }}
                      >
                        {renderSuggestionName(suggestion.name)}
                      </button>
                    );
                  })
                ) : (
                  <div className="search-suggestion-empty">No results found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {locationStatus && (
          <p className="location-hint">{locationStatus}</p>
        )}

        {/* Filter and Sort Controls */}
        <div className="controls">
          <div className="filter-section">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={handleAvailableOnlyChange}
              />
              Show only available turfs
            </label>
          </div>

          <div className="sort-section">
            <label>Sort by:</label>
            <select 
              className="sort-select" 
              value={sortBy} 
              onChange={handleSortChange}
            >
              <option value="nearest">Nearest</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Display turfs */}
        <div className="turfs-grid">
          {/* Create a TurfCard for each turf in our sorted list */}
          {sortedTurfs.map(function(turf) {
            return <TurfCard key={turf.id} turf={turf} />;
          })}
          {sortedTurfs.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h2>No Turfs Found</h2>
              <p>{getNoResultsMessage()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurfListing;
