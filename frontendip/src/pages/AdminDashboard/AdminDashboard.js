// Admin Dashboard Component
// Purpose: Allows admin to approve/reject pending turfs and view approved turfs

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useNotification();

  const [pendingTurfs, setPendingTurfs] = useState([]);
  const [approvedTurfs, setApprovedTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingDeclineTurfId, setPendingDeclineTurfId] = useState(null);

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
      return 'Try a different search term.';
    }
    if (sectionType === 'pending') {
      return 'All submissions have been reviewed.';
    }
    return 'Start by approving pending turfs.';
  }

  const loadTurfs = useCallback(async function() {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        api.get('/admin/pending-turfs'),
        api.get('/admin/approved-turfs')
      ]);
      setPendingTurfs(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setApprovedTurfs(Array.isArray(approvedRes.data) ? approvedRes.data : []);
    } catch (err) {
      showError('Unable to load turf information.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(function() {
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn || !isAdmin) {
      showError('Access denied. Admin login is required.');
      navigate('/login');
      return;
    }
    loadTurfs();
  }, [navigate, showError, loadTurfs]);

  async function handleApprove(turfId) {
    try {
      await api.put(`/admin/approve/${turfId}`);
      showSuccess('Turf approved and now live on the site.');
      loadTurfs();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to approve turf.'));
    }
  }

  function handleOpenDeclineModal(turfId) {
    setPendingDeclineTurfId(turfId);
  }

  function handleCloseDeclineModal() {
    setPendingDeclineTurfId(null);
  }

  async function handleConfirmDecline() {
    if (!pendingDeclineTurfId) {
      return;
    }

    const turfId = pendingDeclineTurfId;
    setPendingDeclineTurfId(null);

    try {
      await api.put(`/admin/reject/${turfId}`);
      showInfo('Turf was declined successfully.');
      loadTurfs();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to reject turf.'));
    }
  }

  const searchLower = searchTerm.toLowerCase();

  function turfMatchesSearch(turf) {
    const safeName = String((turf && turf.name) || '').toLowerCase();
    const safeLocation = String((turf && turf.location) || '').toLowerCase();
    return (
      safeName.includes(searchLower) ||
      safeLocation.includes(searchLower)
    );
  }

  const filteredPendingTurfs = pendingTurfs.filter(turfMatchesSearch);
  const filteredApprovedTurfs = approvedTurfs.filter(turfMatchesSearch);
  const isPendingTab = activeTab === 'pending';
  const activeTurfs = isPendingTab ? filteredPendingTurfs : filteredApprovedTurfs;

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-shell page-shell" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading Dashboard</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-shell page-shell">
        {/* Header */}
        <div className="dashboard-header-admin">
          <div className="header-content">
          <h1>Admin Dashboard</h1>
          <p>Manage Turf Submissions</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="dashboard-stats-admin">
          <div
            className={`stat-card-admin pending ${isPendingTab ? 'active' : ''}`}
            onClick={function() { setActiveTab('pending'); }}
          >
            <div className="stat-icon-admin">⏳</div>
            <div className="stat-info">
              <h3>{pendingTurfs.length}</h3>
              <p>Pending Approval</p>
            </div>
          </div>
          <div
            className={`stat-card-admin approved ${!isPendingTab ? 'active' : ''}`}
            onClick={function() { setActiveTab('approved'); }}
          >
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

        {/* Active Turfs Section */}
        <div className="turfs-section">
          <div className="turfs-list-admin">
            {activeTurfs.map(function(turf) {
              return (
                <div key={turf.id} className="turf-card-admin">
                  <div className="turf-main-admin">
                    <h3>{turf.name}</h3>
                    <p><strong>📍 Location:</strong> {turf.location}</p>
                    <p><strong>⚽ Type:</strong> {turf.turfType || turf.type || '-'}</p>
                    {turf.description && (
                      <div className="turf-description">
                        {turf.description}
                      </div>
                    )}
                  </div>

                  <div className="turf-price-admin">
                    <span className="price-label-admin">Price</span>
                    <strong>৳{turf.pricePerHour}/hour</strong>
                  </div>

                  {isPendingTab && (
                    <div className="turf-actions-admin">
                      <button onClick={function() { handleApprove(turf.id); }} className="btn btn-approve-admin">
                        ✓ Approve
                      </button>
                      <button onClick={function() { handleOpenDeclineModal(turf.id); }} className="btn btn-decline-admin">
                        ✗ Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {activeTurfs.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">{isPendingTab ? '📭' : '🏟️'}</div>
                <h3>{getEmptyTitle(Boolean(searchTerm), activeTab)}</h3>
                <p>{getEmptyDescription(Boolean(searchTerm), activeTab)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={pendingDeclineTurfId !== null}
        title="Decline Turf Submission"
        message={(() => {
          const selectedTurf = pendingTurfs.find(function(item) {
            return item.id === pendingDeclineTurfId;
          });
          const turfName = getTurfNameForConfirm(selectedTurf);
          return `Decline "${turfName}"? This will reject the submission.`;
        })()}
        confirmLabel="Yes, Decline"
        cancelLabel="No, Keep It"
        onConfirm={handleConfirmDecline}
        onCancel={handleCloseDeclineModal}
      />
    </div>
  );
};

export default AdminDashboard;
