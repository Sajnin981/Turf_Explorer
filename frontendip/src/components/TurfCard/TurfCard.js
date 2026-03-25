import React from 'react';
import { Link } from 'react-router-dom';
import './TurfCard.css';

const TurfCard = ({ turf }) => {
  return (
    <div className="turf-card">
      <div className="turf-image">
        {(turf.image || turf.imageUrl) ? (
          <img 
            src={turf.image || turf.imageUrl} 
            alt={turf.name} 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="turf-placeholder" 
          style={{ display: (turf.image || turf.imageUrl) ? 'none' : 'flex' }}
        >
          <span className="turf-icon">{"\uD83C\uDFDF"}</span>
        </div>
      </div>

      <div className="turf-info">
        <h3 className="turf-name">{turf.name}</h3>
        <p className="turf-location">{"\uD83D\uDCCD"} {turf.location}</p>
        {typeof turf.distanceKm === 'number' && (
          <span className="distance-pill">{turf.distanceKm.toFixed(1)} km away</span>
        )}
        
        <div className="turf-meta">
          <span className="turf-type">{"\u26BD"} {turf.type}</span>
          <span className="turf-price">Tk {turf.price || turf.pricePerHour}/hr</span>
        </div>

        <div className="turf-stats">
          <span className="turf-rating">{"\u2B50"} {turf.rating || 4.5}</span>
          <span className={`availability ${turf.available ? 'available' : 'unavailable'}`}>
            {turf.available ? '{"\u2713"}' : '{"\u2717"}'}
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
