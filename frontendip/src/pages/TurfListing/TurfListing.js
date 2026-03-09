// Turf Listing Component
// Purpose: Display all approved turfs with filtering and sorting options
// Features: Search by location, filter by availability, sort by different criteria

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TurfCard from '../../components/TurfCard/TurfCard';
import { getAllTurfs } from '../../services/turfService';
import './TurfListing.css';

const TurfListing = () => {
  // Get URL parameters (for location search from home page)
  const [searchParams] = useSearchParams();
  
  // State variables
  const [allTurfs, setAllTurfs] = useState([]);
  const [sortBy, setSortBy] = useState('rating');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [locationSearch, setLocationSearch] = useState(searchParams.get('location') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load turfs when page first opens
  useEffect(function() {
    async function fetchTurfs() {
      setLoading(true);
      setError('');
      try {
        const turfs = await getAllTurfs();
        setAllTurfs(turfs);
      } catch (err) {
        setError('Failed to load turfs. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchTurfs();

    const loc = searchParams.get('location');
    if (loc) {
      setLocationSearch(loc);
    }
  }, [searchParams]);

  // Step 1: Filter turfs based on user's selections
  const filteredTurfs = [];
  for (let i = 0; i < allTurfs.length; i++) {
    const turf = allTurfs[i];
    let shouldInclude = true;  // Assume we include this turf
    
    // Check availability filter
    if (showAvailableOnly && !turf.available) {
      shouldInclude = false;  // User wants available only, this one isn't
    }
    
    // Check location search
    if (locationSearch.trim()) {
      const searchLower = locationSearch.toLowerCase();
      const turfLocationLower = turf.location.toLowerCase();
      const locationMatches = turfLocationLower.includes(searchLower);
      
      if (!locationMatches) {
        shouldInclude = false;  // Location doesn't match search
      }
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
  if (sortBy === 'rating') {
    // Sort by rating: highest first
    sortedTurfs.sort(function(turfA, turfB) {
      const ratingA = turfA.rating || 0;
      const ratingB = turfB.rating || 0;
      return ratingB - ratingA;  // Higher rating comes first
    });
  } else if (sortBy === 'popular') {
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
  }

  // Handler functions for user interactions
  function handleLocationSearchChange(event) {
    // When user types in location search box, update the search text
    setLocationSearch(event.target.value);
  }

  function handleAvailabilityFilterChange(event) {
    // When user checks/unchecks "Show only available", update the filter
    setShowAvailableOnly(event.target.checked);
  }

  function handleSortChange(event) {
    // When user selects a different sort option, update sort preference
    setSortBy(event.target.value);
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
        </div>
      </div>

      <div className="container">
        {/* Location Search */}
        <div className="location-search-box">
          <input 
            type="text"
            className="location-search-input"
            placeholder="📍 Search by location (e.g., Agrabad, Khulshi, CDA Avenue...)"
            value={locationSearch}
            onChange={handleLocationSearchChange}
          />
        </div>

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
              <option value="rating">Highest Rated</option>
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
                {locationSearch.trim() 
                  ? `No turfs found in "${locationSearch}". Try a different location.` 
                  : showAvailableOnly 
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
