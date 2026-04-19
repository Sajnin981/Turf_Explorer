import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <h1>Page Not Found</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={function() { navigate('/'); }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export default NotFound;
