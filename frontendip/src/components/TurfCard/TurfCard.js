import React from 'react';
import { Link } from 'react-router-dom';
import './TurfCard.css';

const TurfCard = ({ turf }) => {
  let imageUrl = null;
  if (turf.image) {
    imageUrl = turf.image;
  } else if (turf.imageUrl) {
    imageUrl = turf.imageUrl;
  }

  const hasImage = imageUrl !== null;

  let pricePerHour = turf.price;
  if (!pricePerHour) {
    pricePerHour = turf.pricePerHour;
  }

  let availabilityClass = 'unavailable';
  if (turf.available) {
    availabilityClass = 'available';
  }

  let availabilityText = 'Unavailable';
  if (turf.available) {
    availabilityText = 'Available';
  }

  let placeholderDisplay = 'flex';
  if (hasImage) {
    placeholderDisplay = 'none';
  }

  return (
    <div className="turf-card">
      <div className="turf-image">
        {hasImage && (
          <img 
            src={imageUrl}
            alt={turf.name} 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        )}
        <div 
          className="turf-placeholder" 
          style={{ display: placeholderDisplay }}
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
          <span className="turf-price">৳{pricePerHour}/hr</span>
        </div>

        <div className="turf-status">
          <span className={`availability ${availabilityClass}`}>
            {availabilityText}
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
