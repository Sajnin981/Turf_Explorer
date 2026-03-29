// Turf Listing Component
// Purpose: Display all approved turfs with filtering and sorting options
// Features: Search by turf name, filter by availability, sort by different criteria

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TurfCard from '../../components/TurfCard/TurfCard';
import { getAllTurfs } from '../../services/turfService';
import './TurfListing.css';

const TurfListing = () => {
  const [searchParams] = useSearchParams();

  // State variables
  const [allTurfs, setAllTurfs] = useState([]);
  const [sortBy, setSortBy] = useState('priceLow');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [hasDistanceData, setHasDistanceData] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (showAvailableOnly) {
      return 'No available turfs at the moment.';
    }
    return 'No turfs found. Please check back later!';
  }

  // Load turfs when page first opens and when query string changes
  useEffect(function() {
    const initialSearch = (searchParams.get('search') || '').trim();
    setSearchQuery(initialSearch);
    const initialStatus = getInitialSearchStatus(initialSearch);
    loadTurfs(initialSearch, userCoords, initialStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleLoadedTurfs(turfs) {
    setAllTurfs(turfs);
    const hasDistance = turfs.some(function(t) { return typeof t.distanceKm === 'number'; });
    setHasDistanceData(hasDistance);
  }

  async function loadTurfs(query, coords, successMessage) {
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
    let shouldInclude = true;  // Assume we include this turf
    
    // Check availability filter
    if (showAvailableOnly && !turf.available) {
      shouldInclude = false;  // User wants available only, this one isn't
    }
    
    // Add to filtered list if it passed all checks
    if (shouldInclude) {
      filteredTurfs.push(turf);
    }
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
  function handleAvailabilityFilterChange(event) {
    // When user checks/unchecks "Show only available", update the filter
    setShowAvailableOnly(event.target.checked);
  }

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

    await loadTurfs(searchQuery.trim(), userCoords, 'Showing turfs closest to you');
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

    setLocationStatus('Requesting your location...');
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
    if (overrideQuery !== undefined && overrideQuery !== null) {
      finalQuery = overrideQuery;
    }

    const query = finalQuery.trim();
    if (!query) {
      await loadTurfs('', userCoords, '');
      return;
    }

    const status = `Showing results for "${query}"`;
    await loadTurfs(query, userCoords, status);
  }

  if (loading) {
    return (
      <div className="turf-listing">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading turfs...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="turf-listing">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2 style={{ color: '#e74c3c' }}>{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="turf-listing">
      {/* Page Header */}
      <div className="listing-header">
        <div className="container">
          <h1 className="listing-title">Find Your Perfect Turf</h1>
          <p className="listing-subtitle">Browse and book sports turfs in Chittagong</p>
          {sortBy === 'nearest' && hasDistanceData && (
            <div className="distance-indicator">Sorted by nearest first</div>
          )}
        </div>
      </div>

      <div className="container">
        <div className="proximity-tools">
          <div className="manual-location-form">
            <input
              type="text"
              className="manual-location-input"
              placeholder="Search by turf name"
              value={searchQuery}
              onChange={function(event) { setSearchQuery(event.target.value); }}
              onKeyDown={function(event) {
                if (event.key === 'Enter') {
                  handleNameSearch();
                }
              }}
            />
            <button className="manual-location-button" onClick={handleNameSearch}>
              Search
            </button>
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
                onChange={handleAvailabilityFilterChange} 
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
