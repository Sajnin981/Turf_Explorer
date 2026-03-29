// Admin Dashboard Component
// Purpose: Allows admin to approve/reject pending turfs and view approved turfs

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [pendingTurfs, setPendingTurfs] = useState([]);
  const [approvedTurfs, setApprovedTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  function getApiErrorMessage(err, fallback) {
    if (err && err.response && err.response.data && err.response.data.message) {
      return err.response.data.message;
    }
    return fallback;
  }

  function getTurfNameForConfirm(turf) {
    if (turf && turf.name) {
      return turf.name;
    }
    return 'this turf';
  }

  function getEmptyTitle(hasSearch, sectionType) {
    if (hasSearch) {
      return 'No Matching Turfs';
    }
    if (sectionType === 'pending') {
      return 'No Pending Turfs';
    }
    return 'No Approved Turfs';
  }

  function getEmptyDescription(hasSearch, sectionType) {
    if (hasSearch) {
      return 'Try a different search term';
    }
    if (sectionType === 'pending') {
      return 'All submissions have been reviewed!';
    }
    return 'Start by approving some pending turfs!';
  }

  useEffect(function() {
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn || !isAdmin) {
      alert('Access denied! Admin login required.');
      navigate('/login');
      return;
    }
    loadTurfs();
  }, [navigate]);

  async function loadTurfs() {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        api.get('/admin/pending-turfs'),
        api.get('/admin/approved-turfs')
      ]);
      setPendingTurfs(pendingRes.data);
      setApprovedTurfs(approvedRes.data);
    } catch (err) {
      alert('Failed to load turf data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(turfId) {
    try {
      await api.put(`/admin/approve/${turfId}`);
      alert('✅ Turf approved and is now live on the site.');
      loadTurfs();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to approve turf.'));
    }
  }

  async function handleDecline(turfId) {
    const turf = pendingTurfs.find(function(t) { return t.id === turfId; });
    const turfName = getTurfNameForConfirm(turf);
    const shouldDecline = window.confirm(`Decline "${turfName}"? This will reject the submission.`);
    if (!shouldDecline) {
      return;
    }

    try {
      await api.put(`/admin/reject/${turfId}`);
      alert('Turf has been rejected.');
      loadTurfs();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to reject turf.'));
    }
  }

  const searchLower = searchTerm.toLowerCase();

  function turfMatchesSearch(turf) {
    return (
      turf.name.toLowerCase().includes(searchLower) ||
      turf.location.toLowerCase().includes(searchLower)
    );
  }

  const filteredPendingTurfs = pendingTurfs.filter(turfMatchesSearch);
  const filteredApprovedTurfs = approvedTurfs.filter(turfMatchesSearch);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header-admin">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <p>Manage Turf Submissions</p>
        </div>
      </div>

      <div className="container">
        {/* Statistics */}
        <div className="dashboard-stats-admin">
          <div className="stat-card-admin">
            <div className="stat-icon-admin">⏳</div>
            <div className="stat-info">
              <h3>{pendingTurfs.length}</h3>
              <p>Pending Approval</p>
            </div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-icon-admin" style={{ color: '#2ecc71' }}>✅</div>
            <div className="stat-info">
              <h3>{approvedTurfs.length}</h3>
              <p>Live on Site</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="turfs-section">
          <input
            type="text"
            placeholder="🔍 Search turfs by name or location..."
            value={searchTerm}
            onChange={function(e) { setSearchTerm(e.target.value); }}
            className="search-input-admin"
          />
        </div>

        {/* Pending Turfs Section */}
        <div className="turfs-section">
          <h2>⏳ Pending Turfs - Awaiting Your Approval</h2>

          <div className="turfs-list-admin">
            {filteredPendingTurfs.map(function(turf) {
              return (
                <div key={turf.id} className="turf-card-admin">
                  <div className="turf-details-admin">
                    <h3>{turf.name}</h3>
                    <div className="info-grid">
                      <p><strong>📍 Location:</strong> {turf.location}</p>
                      <p><strong>⚽ Type:</strong> {turf.turfType || turf.type}</p>
                      <p><strong>💰 Price:</strong> ৳{turf.pricePerHour}/hour</p>
                      {turf.createdAt && (
                        <p><strong>📅 Submitted:</strong> {new Date(turf.createdAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    {turf.description && (
                      <div className="turf-description">
                        <strong>Description:</strong> {turf.description}
                      </div>
                    )}
                  </div>

                  <div className="turf-actions-admin">
                    <button onClick={function() { handleApprove(turf.id); }} className="btn btn-approve-admin">
                      ✓ Approve
                    </button>
                    <button onClick={function() { handleDecline(turf.id); }} className="btn btn-decline-admin">
                      ✗ Decline
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredPendingTurfs.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>{getEmptyTitle(Boolean(searchTerm), 'pending')}</h3>
                <p>{getEmptyDescription(Boolean(searchTerm), 'pending')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Approved Turfs Section */}
        <div className="turfs-section">
          <h2>✅ Approved Turfs - Currently Live on Site</h2>

          <div className="turfs-list-admin">
            {filteredApprovedTurfs.map(function(turf) {
              return (
                <div key={turf.id} className="turf-card-admin approved">
                  <div className="turf-details-admin">
                    <h3>{turf.name}</h3>
                    <div className="info-grid">
                      <p><strong>📍 Location:</strong> {turf.location}</p>
                      <p><strong>⚽ Type:</strong> {turf.turfType || turf.type}</p>
                      <p><strong>💰 Price:</strong> ৳{turf.pricePerHour}/hour</p>
                    </div>
                    {turf.description && (
                      <div className="turf-description">
                        <strong>Description:</strong> {turf.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredApprovedTurfs.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🏟️</div>
                <h3>{getEmptyTitle(Boolean(searchTerm), 'approved')}</h3>
                <p>{getEmptyDescription(Boolean(searchTerm), 'approved')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
