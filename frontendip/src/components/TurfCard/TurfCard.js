import React from 'react';
import { Link } from 'react-router-dom';
import './TurfCard.css';

const TurfCard = ({ turf }) => {
  return (
    <div className="turf-card">
      <div className="turf-image">
        {turf.image ? (
          <img src={turf.image} alt={turf.name} />
        ) : (
          <div className="turf-placeholder">
            <span className="turf-icon">🏟️</span>
          </div>
        )}
      </div>

      <div className="turf-info">
        <h3 className="turf-name">{turf.name}</h3>
        <p className="turf-location">📍 {turf.location}</p>
        
        <div className="turf-meta">
          <span className="turf-type">⚽ {turf.type}</span>
          <span className="turf-price">৳{turf.price || turf.pricePerHour}/hr</span>
        </div>

        <div className="turf-stats">
          <span className="turf-rating">⭐ {turf.rating || 4.5}</span>
          <span className={`availability ${turf.available ? 'available' : 'unavailable'}`}>
            {turf.available ? '✓' : '✗'}
          </span>
        </div>

        <Link to={`/turf/${turf.id}`} className="btn btn-primary view-btn">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default TurfCard;
