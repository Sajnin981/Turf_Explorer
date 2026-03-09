// My Turfs Component
// Purpose: Owner dashboard for managing their submitted turfs
// Features: View turfs, delete turfs, view bookings, manage slots

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTurfs, deleteTurf, getTurfBookings } from '../../services/turfService';
import { addSlot, deleteSlot } from '../../services/slotService';
import './MyTurfs.css';

const MyTurfs = () => {
  const navigate = useNavigate();

  const [myTurfs, setMyTurfs] = useState([]);
  const [viewingBookings, setViewingBookings] = useState(null);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [turfBookings, setTurfBookings] = useState({});
  const [loading, setLoading] = useState(true);

  // Slot management state
  const [managingSlots, setManagingSlots] = useState(null);
  const [slotForm, setSlotForm] = useState({ startTime: '', endTime: '', price: '' });
  const [slotLoading, setSlotLoading] = useState(false);

  useEffect(function() {
    const userRole = localStorage.getItem('userRole');
    if (!localStorage.getItem('userEmail')) {
      alert('Please login first');
      navigate('/login');
      return;
    }
    if (userRole === 'admin') {
      navigate('/admin');
      return;
    }
    loadMyTurfs();
  }, [navigate]);

  async function loadMyTurfs() {
    setLoading(true);
    try {
      const turfs = await getMyTurfs();
      setMyTurfs(turfs);

      // Load bookings for each turf
      const bookingsMap = {};
      for (const turf of turfs) {
        try {
          const bookings = await getTurfBookings(turf.id);
          bookingsMap[turf.id] = bookings;
        } catch (e) {
          bookingsMap[turf.id] = [];
        }
      }
      setTurfBookings(bookingsMap);
    } catch (err) {
      alert('Failed to load your turfs.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(turfId) {
    if (!window.confirm('Are you sure you want to delete this turf?')) return;
    try {
      await deleteTurf(turfId);
      alert('Turf deleted successfully!');
      loadMyTurfs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete turf.');
    }
  }

  async function handleAddSlot(turfId) {
    if (!slotForm.startTime || !slotForm.endTime) {
      alert('Please enter start and end time.');
      return;
    }
    setSlotLoading(true);
    try {
      await addSlot(turfId, {
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        price: slotForm.price ? parseFloat(slotForm.price) : null
      });
      setSlotForm({ startTime: '', endTime: '', price: '' });
      alert('Slot added successfully!');
      loadMyTurfs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add slot.');
    } finally {
      setSlotLoading(false);
    }
  }

  async function handleDeleteSlot(slotId) {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await deleteSlot(slotId);
      loadMyTurfs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete slot.');
    }
  }

  if (loading) {
    return (
      <div className="my-turfs-page">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading your turfs...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="my-turfs-page">
      <div className="my-turfs-header">
        <div className="container">
          <h1>My Turfs</h1>
          <p>View all your submitted turfs</p>
        </div>
      </div>

      <div className="container">
        {myTurfs.length === 0 ? (
          <div className="no-turfs">
            <div className="no-turfs-icon">🏟️</div>
            <h2>No Turfs Yet</h2>
            <p>You have not submitted any turfs yet.</p>
            <button className="btn-primary" onClick={function() { navigate('/add-turf'); }}>
              Add Your First Turf
            </button>
          </div>
        ) : (
          <div className="turfs-grid">
            {myTurfs.map(function(turf) {
              const statusLabel = turf.status ? turf.status.toUpperCase() : 'PENDING';
              return (
                <div key={turf.id} className="turf-card-my">
                  <div className={`status-badge ${statusLabel === 'APPROVED' ? 'approved' : 'pending'}`}>
                    {statusLabel === 'APPROVED' ? '✅ Approved' : '⏳ Pending'}
                  </div>

                  <div className="turf-image-my">
                    {turf.image ? (
                      <img src={turf.image} alt={turf.name} />
                    ) : (
                      <div className="placeholder-image"><span>🏟️</span></div>
                    )}
                  </div>

                  <div className="turf-content-my">
                    <h3>{turf.name}</h3>
                    <p className="location">📍 {turf.location}</p>
                    <p className="type">⚽ {turf.type || turf.turfType}</p>
                    <p className="price">💰 ৳{turf.pricePerHour}/hour</p>
                    {turf.description && <p className="description">{turf.description}</p>}

                    <div className="turf-stats">
                      <span className="stat stat-pending">⏳ {(turfBookings[turf.id] || []).filter(function(b) { return b.status === 'PENDING'; }).length} Pending</span>
                      <span className="stat stat-confirmed">✅ {(turfBookings[turf.id] || []).filter(function(b) { return b.status === 'CONFIRMED'; }).length} Confirmed</span>
                      <span className="stat stat-cancelled">❌ {(turfBookings[turf.id] || []).filter(function(b) { return b.status === 'CANCELLED'; }).length} Cancelled</span>
                    </div>

                    <div className="turf-actions-my">
                      <button
                        onClick={function() { setSelectedTurf(turf); setViewingBookings(turf.id); }}
                        className="btn btn-view-bookings"
                      >
                        📅 View Bookings
                      </button>
                      <button
                        onClick={function() { setManagingSlots(managingSlots === turf.id ? null : turf.id); }}
                        className="btn btn-view-bookings"
                      >
                        🕒 Manage Slots
                      </button>
                      <button
                        onClick={function() { handleDelete(turf.id); }}
                        className="btn btn-delete-my"
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    {/* Slot Management Panel */}
                    {managingSlots === turf.id && (
                      <div style={{ marginTop: '16px', background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                        <h4 style={{ marginBottom: '12px' }}>🕒 Manage Slots</h4>

                        {/* Existing slots */}
                        {turf.slots && turf.slots.length > 0 ? (
                          <div style={{ marginBottom: '12px' }}>
                            {turf.slots.map(function(slot) {
                              return (
                                <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                                  <span>{slot.startTime} - {slot.endTime}{slot.price ? ` (৳${slot.price})` : ''} — <em>{slot.status}</em></span>
                                  <button onClick={function() { handleDeleteSlot(slot.id); }} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ color: '#999', marginBottom: '12px' }}>No slots added yet.</p>
                        )}

                        {/* Add new slot */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82em', marginBottom: '4px' }}>Start Time</label>
                            <input type="time" value={slotForm.startTime} onChange={function(e) { setSlotForm({ ...slotForm, startTime: e.target.value }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82em', marginBottom: '4px' }}>End Time</label>
                            <input type="time" value={slotForm.endTime} onChange={function(e) { setSlotForm({ ...slotForm, endTime: e.target.value }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82em', marginBottom: '4px' }}>Price (৳)</label>
                            <input type="number" value={slotForm.price} onChange={function(e) { setSlotForm({ ...slotForm, price: e.target.value }); }} placeholder="Optional" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }} />
                          </div>
                          <button onClick={function() { handleAddSlot(turf.id); }} disabled={slotLoading} style={{ background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer' }}>
                            {slotLoading ? 'Adding...' : '+ Add Slot'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bookings Modal */}
      {viewingBookings && selectedTurf && (
        <div className="modal-overlay" onClick={function() { setViewingBookings(null); setSelectedTurf(null); }}>
          <div className="modal-content-bookings" onClick={function(e) { e.stopPropagation(); }}>
            <div className="modal-header">
              <h2>📋 Bookings for {selectedTurf.name}</h2>
              <button className="modal-close" onClick={function() { setViewingBookings(null); setSelectedTurf(null); }}>✕</button>
            </div>
            <div className="modal-body">
              {(turfBookings[selectedTurf.id] || []).length > 0 ? (
                <div className="bookings-list-modal">
                  {turfBookings[selectedTurf.id].map(function(booking) {
                    const bs = booking.status ? booking.status.toLowerCase() : 'pending';
                    return (
                      <div key={booking.id} className="booking-card-modal">
                        <div className="booking-header-modal">
                          <span className={`status-badge-modal status-${bs}`}>
                            {bs === 'pending' && '⏳ Pending'}
                            {bs === 'confirmed' && '✅ Confirmed'}
                            {bs === 'cancelled' && '❌ Cancelled'}
                          </span>
                        </div>
                        <div className="booking-details-modal">
                          <div className="booking-row">
                            <span className="booking-label">📅 Date:</span>
                            <span className="booking-value">{booking.bookingDate}</span>
                          </div>
                          {booking.slotTime && (
                            <div className="booking-row">
                              <span className="booking-label">⏰ Slot:</span>
                              <span className="booking-value">{booking.slotTime}</span>
                            </div>
                          )}
                          {booking.price && (
                            <div className="booking-row">
                              <span className="booking-label">💰 Amount:</span>
                              <span className="booking-value">৳{booking.price}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-bookings-modal">
                  <div className="no-bookings-icon">📅</div>
                  <p>No bookings yet for this turf.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTurfs;
