// Turf Listing Component
// Purpose: Display all approved turfs with filtering and sorting options
// Features: Search by location, filter by availability, sort by different criteria

import React, { useState, useEffect } from 'react';
import TurfCard from '../../components/TurfCard/TurfCard';
import { getAllTurfs, getNearbyTurfs } from '../../services/turfService';
import './TurfListing.css';

const TurfListing = () => {
  // State variables
  const [allTurfs, setAllTurfs] = useState([]);
  const [sortBy, setSortBy] = useState('popular');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [manualLocationQuery, setManualLocationQuery] = useState('');
  const [distanceMode, setDistanceMode] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load turfs when page first opens
  useEffect(function() {
    async function fetchTurfs() {
      setLoading(true);
      setError('');
      setLocationStatus('');
      try {
        const turfs = await getAllTurfs();
        handleLoadedTurfs(turfs);
      } catch (err) {
        setError('Failed to load turfs. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchTurfs();
  }, []);

  function handleLoadedTurfs(turfs) {
    setAllTurfs(turfs);
    const hasDistance = turfs.some(function(t) { return typeof t.distanceKm === 'number'; });
    setDistanceMode(hasDistance);

    setSortBy(function(prev) {
      if (hasDistance && prev !== 'distance') {
        return 'distance';
      }
      if (!hasDistance && prev === 'distance') {
        return 'popular';
      }
      return prev;
    });

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
  if (sortBy === 'popular') {
    // Sort by booking count: most popular first
    sortedTurfs.sort(function(turfA, turfB) {
      const countA = turfA.bookingCount || 0;
      const countB = turfB.bookingCount || 0;
      return countB - countA;  // Higher count comes first
    });
  } else if (sortBy === 'priceLow') {
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
  } else if (sortBy === 'distance') {
    sortedTurfs.sort(function(turfA, turfB) {
      const distanceA = typeof turfA.distanceKm === 'number' ? turfA.distanceKm : Number.MAX_VALUE;
      const distanceB = typeof turfB.distanceKm === 'number' ? turfB.distanceKm : Number.MAX_VALUE;
      return distanceA - distanceB;
    });
  }

  // Handler functions for user interactions
  function handleAvailabilityFilterChange(event) {
    // When user checks/unchecks "Show only available", update the filter
    setShowAvailableOnly(event.target.checked);
  }

  function handleSortChange(event) {
    // When user selects a different sort option, update sort preference
    setSortBy(event.target.value);
  }

  async function loadNearbyByCoords(lat, lng, successMessage, options = {}) {
    const manageLoading = options.manageLoading !== false;
    if (manageLoading) {
      setLoading(true);
    }
    setError('');
    try {
      const turfs = await getNearbyTurfs(lat, lng);
      handleLoadedTurfs(turfs);
      const label = successMessage || `Showing turfs near (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
      setLocationStatus(label);
    } catch (err) {
      setError('Failed to load nearby turfs. Please try again.');
      setLocationStatus('');
    } finally {
      if (manageLoading) {
        setLoading(false);
      }
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported in this browser. Please enter a location manually.');
      return;
    }

    setLocationStatus('Requesting your location...');
    navigator.geolocation.getCurrentPosition(function(position) {
      loadNearbyByCoords(
        position.coords.latitude,
        position.coords.longitude,
        'Showing turfs closest to you'
      );
    }, function() {
      setLocationStatus('Location access was denied. Use the manual search box instead.');
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  }

  async function geocodeLocation(query) {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(query)}&email=contact@turfexplorer.com`;
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    const data = await response.json();
    if (!data || data.length === 0) {
      return null;
    }
    const match = data[0];
    return {
      lat: parseFloat(match.lat),
      lng: parseFloat(match.lon),
      label: match.display_name?.split(',')[0] || query,
    };
  }

  async function handleManualLocationSearch() {
    const query = manualLocationQuery.trim();
    if (!query) {
      setLocationStatus('Please enter a city, neighborhood, or address to search.');
      return;
    }

    setLoading(true);
    setError('');
    setLocationStatus('Finding that location...');
    try {
      const result = await geocodeLocation(query);
      if (!result) {
        setLocationStatus('No matching location was found. Try a nearby city or landmark.');
        return;
      }
      await loadNearbyByCoords(result.lat, result.lng, `Showing turfs near ${result.label}`, { manageLoading: false });
    } catch (err) {
      setLocationStatus('Unable to resolve that address. Please try again.');
    } finally {
      setLoading(false);
    }
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
          {distanceMode && (
            <div className="distance-indicator">Sorted by nearest first</div>
          )}
        </div>
      </div>

      <div className="container">
        <div className="proximity-tools">
          <button className="nearby-btn" onClick={handleUseCurrentLocation}>
            Find Nearby Turfs
          </button>
          <div className="manual-location-form">
            <input
              type="text"
              className="manual-location-input"
              placeholder="Enter a city, area, or address"
              value={manualLocationQuery}
              onChange={function(event) { setManualLocationQuery(event.target.value); }}
              onKeyDown={function(event) {
                if (event.key === 'Enter') {
                  handleManualLocationSearch();
                }
              }}
            />
            <button className="manual-location-button" onClick={handleManualLocationSearch}>
              Search Area
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
              {distanceMode && <option value="distance">Nearest First</option>}
              <option value="popular">Most Popular</option>
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
              <p>
                {showAvailableOnly 
                  ? 'No available turfs at the moment.' 
                  : 'No turfs found. Please check back later!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurfListing;
