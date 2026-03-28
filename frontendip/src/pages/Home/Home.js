// Home Component
// Purpose: Landing page of the application
// Features: Hero section with search, how it works section, top turfs display

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');

  // Handle Get Started button click
  function handleGetStarted() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    window.scrollTo(0, 0);
    if (isLoggedIn) {
      navigate('/turfs');
    } else {
      navigate('/login');
    }
  }

  function handleNameSearch(event) {
    event.preventDefault();
    const query = searchName.trim();
    if (!query) {
      navigate('/turfs');
      return;
    }
    navigate(`/turfs?search=${encodeURIComponent(query)}`);
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Play Football or Cricket Anytime, Book the Nearest Turf in Seconds
            </h1>
            <p className="hero-subtitle">
              Find and book the best turfs with ease.
            </p>
            <form className="hero-search" onSubmit={handleNameSearch}>
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search by turf name"
                value={searchName}
                onChange={function(event) { setSearchName(event.target.value); }}
                aria-label="Search turfs by name"
              />
              <button type="submit" className="hero-search-button">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Book your perfect turf in three simple steps
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">📍</div>
              <div className="step-number">Step 1</div>
              <h3 className="step-title">Browse Turfs</h3>
              <p className="step-description">
                Browse all available turfs in your area. Filter and sort to find the perfect match.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon">⚡</div>
              <div className="step-number">Step 2</div>
              <h3 className="step-title">Compare Options</h3>
              <p className="step-description">
                View detailed information about each turf including price, facilities, and availability.
              </p>
            </div>

            <div className="step-card">
              <div className="step-icon">✅</div>
              <div className="step-number">Step 3</div>
              <h3 className="step-title">Book Your Slot</h3>
              <p className="step-description">
                Select your preferred date and time, then confirm your booking in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Turf Explorer?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🏟️</span>
              <h3>Wide Selection</h3>
              <p>Choose from multiple turfs across Chittagong</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⏰</span>
              <h3>Easy Booking</h3>
              <p>Book your slot in just a few clicks</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⭐</span>
              <h3>Top Rated</h3>
              <p>All turfs are verified and highly rated</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Play?</h2>
            <p className="cta-description">
              Find and book your perfect turf in Chittagong with ease
            </p>
            <div className="cta-buttons">
              <button onClick={handleGetStarted} className="btn btn-primary">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
