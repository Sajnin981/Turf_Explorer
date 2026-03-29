// My Turfs Component
// Purpose: Owner dashboard for managing their submitted turfs
// Features: View turfs, delete turfs, view bookings, manage slots

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTurfs, deleteTurf, getTurfBookings, getOwnerEarningsSummary } from '../../services/turfService';
import { addSlot, deleteSlot, getSlotsByTurf, updateSlot } from '../../services/slotService';
import './MyTurfs.css';

const MyTurfs = () => {
  const navigate = useNavigate();

  const [myTurfs, setMyTurfs] = useState([]);
  const [viewingBookings, setViewingBookings] = useState(null);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [turfBookings, setTurfBookings] = useState({});
  const [earningsSummary, setEarningsSummary] = useState({ successfulPayments: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);

  // Slot management state
  const [managingSlots, setManagingSlots] = useState(null);
  const [slotForm, setSlotForm] = useState({ startTime: '', endTime: '', price: '', status: 'AVAILABLE' });
  const [slotsByTurf, setSlotsByTurf] = useState({});
  const [loadingSlotsFor, setLoadingSlotsFor] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editSlotForm, setEditSlotForm] = useState({ startTime: '', endTime: '', price: '', status: 'AVAILABLE' });
  const [slotLoading, setSlotLoading] = useState(false);

  function getApiErrorMessage(err, fallback) {
    if (err && err.response && err.response.data && err.response.data.message) {
      return err.response.data.message;
    }
    return fallback;
  }

  function getStatusText(status) {
    if (!status) {
      return 'PENDING';
    }
    return status.toUpperCase();
  }

  function countBookingsByStatus(turfId, targetStatus) {
    const bookings = turfBookings[turfId] || [];
    let count = 0;
    for (const booking of bookings) {
      if (booking.status === targetStatus) {
        count += 1;
      }
    }
    return count;
  }

  function getBookingStatusLower(status) {
    if (!status) {
      return 'pending';
    }
    return status.toLowerCase();
  }

  function getApprovalBadgeClass(statusLabel) {
    if (statusLabel === 'APPROVED') {
      return 'status-badge approved';
    }
    return 'status-badge pending';
  }

  function getApprovalBadgeText(statusLabel) {
    if (statusLabel === 'APPROVED') {
      return '✅ Approved';
    }
    return '⏳ Pending';
  }

  function getSlotPriceLabel(slot) {
    if (slot.price) {
      return ` (৳${slot.price})`;
    }
    return '';
  }

  function getSaveSlotButtonLabel() {
    if (slotLoading) {
      return 'Saving...';
    }
    return 'Save';
  }

  function getAddSlotButtonLabel() {
    if (slotLoading) {
      return 'Adding...';
    }
    return '+ Add Slot';
  }

  function closeBookingsModal() {
    setViewingBookings(null);
    setSelectedTurf(null);
  }

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

      try {
        const earnings = await getOwnerEarningsSummary();
        setEarningsSummary(earnings);
      } catch (e) {
        setEarningsSummary({ successfulPayments: 0, totalEarnings: 0 });
      }

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
      alert(getApiErrorMessage(err, 'Failed to delete turf.'));
    }
  }

  async function handleAddSlot(turfId) {
    if (!slotForm.startTime || !slotForm.endTime) {
      alert('Please enter start and end time.');
      return;
    }
    if (slotForm.price === '' || Number(slotForm.price) <= 0) {
      alert('Please enter a valid slot price.');
      return;
    }
    setSlotLoading(true);
    try {
      await addSlot(turfId, {
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        price: parseFloat(slotForm.price),
        status: slotForm.status
      });
      setSlotForm({ startTime: '', endTime: '', price: '', status: 'AVAILABLE' });
      alert('Slot added successfully!');
      await loadSlotsForTurf(turfId);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to add slot.'));
    } finally {
      setSlotLoading(false);
    }
  }

  async function loadSlotsForTurf(turfId) {
    setLoadingSlotsFor(turfId);
    try {
      const slots = await getSlotsByTurf(turfId);
      setSlotsByTurf(function(prev) {
        return { ...prev, [turfId]: slots };
      });
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to load slots.'));
    } finally {
      setLoadingSlotsFor(null);
    }
  }

  async function handleToggleManageSlots(turfId) {
    let nextOpen = turfId;
    if (managingSlots === turfId) {
      nextOpen = null;
    }

    setManagingSlots(nextOpen);
    setEditingSlot(null);
    if (nextOpen && !slotsByTurf[turfId]) {
      await loadSlotsForTurf(turfId);
    }
  }

  function handleEditSlotStart(turfId, slot) {
    let slotPrice = '';
    if (slot.price) {
      slotPrice = slot.price;
    }

    let slotStatus = 'AVAILABLE';
    if (slot.status) {
      slotStatus = slot.status;
    }

    setEditingSlot({ turfId: turfId, slotId: slot.id });
    setEditSlotForm({
      startTime: slot.startTime,
      endTime: slot.endTime,
      price: slotPrice,
      status: slotStatus
    });
  }

  function handleEditSlotCancel() {
    setEditingSlot(null);
  }

  async function handleUpdateSlot(turfId, slotId) {
    if (!editSlotForm.startTime || !editSlotForm.endTime || editSlotForm.price === '') {
      alert('Please fill start time, end time and price.');
      return;
    }

    setSlotLoading(true);
    try {
      await updateSlot(slotId, {
        startTime: editSlotForm.startTime,
        endTime: editSlotForm.endTime,
        price: parseFloat(editSlotForm.price),
        status: editSlotForm.status
      });
      setEditingSlot(null);
      await loadSlotsForTurf(turfId);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to update slot.'));
    } finally {
      setSlotLoading(false);
    }
  }

  async function handleDeleteSlot(turfId, slotId) {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await deleteSlot(slotId);
      setEditingSlot(null);
      await loadSlotsForTurf(turfId);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete slot.'));
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
          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span className="stat stat-confirmed">💸 Total Earnings: ৳{Number(earningsSummary.totalEarnings || 0).toFixed(2)}</span>
            <span className="stat stat-pending">✅ Successful Payments: {earningsSummary.successfulPayments || 0}</span>
          </div>
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
              const statusLabel = getStatusText(turf.status);
              const turfSlots = slotsByTurf[turf.id] || [];
              const pendingCount = countBookingsByStatus(turf.id, 'PENDING');
              const confirmedCount = countBookingsByStatus(turf.id, 'CONFIRMED');
              const cancelledCount = countBookingsByStatus(turf.id, 'CANCELLED');

              let turfImageUrl = null;
              if (turf.image) {
                turfImageUrl = turf.image;
              } else if (turf.imageUrl) {
                turfImageUrl = turf.imageUrl;
              }

              const hasTurfImage = turfImageUrl !== null;
              return (
                <div key={turf.id} className="turf-card-my">
                  <div className={getApprovalBadgeClass(statusLabel)}>
                    {getApprovalBadgeText(statusLabel)}
                  </div>

                  <div className="turf-image-my">
                    {hasTurfImage ? (
                      <>
                        <img 
                          src={turfImageUrl}
                          alt={turf.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="placeholder-image" style={{ display: 'none' }}><span>🏟️</span></div>
                      </>
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
                      <span className="stat stat-pending">⏳ {pendingCount} Pending</span>
                      <span className="stat stat-confirmed">✅ {confirmedCount} Confirmed</span>
                      <span className="stat stat-cancelled">❌ {cancelledCount} Cancelled</span>
                    </div>

                    <div className="turf-actions-my">
                      <button
                        onClick={function() { setSelectedTurf(turf); setViewingBookings(turf.id); }}
                        className="btn btn-view-bookings"
                      >
                        📅 View Bookings
                      </button>
                      <button
                        onClick={function() { handleToggleManageSlots(turf.id); }}
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
                        {loadingSlotsFor === turf.id ? (
                          <p style={{ color: '#999', marginBottom: '12px' }}>Loading slots...</p>
                        ) : turfSlots.length > 0 ? (
                          <div style={{ marginBottom: '12px' }}>
                            {turfSlots.map(function(slot) {
                              const isEditing = editingSlot && editingSlot.turfId === turf.id && editingSlot.slotId === slot.id;
                              return (
                                <div key={slot.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                  {isEditing ? (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.82em', marginBottom: '4px' }}>Start</label>
                                        <input type="time" value={editSlotForm.startTime} onChange={function(e) { setEditSlotForm({ ...editSlotForm, startTime: e.target.value }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                      </div>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.82em', marginBottom: '4px' }}>End</label>
                                        <input type="time" value={editSlotForm.endTime} onChange={function(e) { setEditSlotForm({ ...editSlotForm, endTime: e.target.value }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                      </div>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.82em', marginBottom: '4px' }}>Price</label>
                                        <input type="number" value={editSlotForm.price} onChange={function(e) { setEditSlotForm({ ...editSlotForm, price: e.target.value }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }} />
                                      </div>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.82em', marginBottom: '4px' }}>Availability</label>
                                        <select value={editSlotForm.status} onChange={function(e) { setEditSlotForm({ ...editSlotForm, status: e.target.value }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
                                          <option value="AVAILABLE">Available</option>
                                          <option value="BOOKED">Booked</option>
                                        </select>
                                      </div>
                                      <button onClick={function() { handleUpdateSlot(turf.id, slot.id); }} disabled={slotLoading} style={{ background: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>
                                        {getSaveSlotButtonLabel()}
                                      </button>
                                      <button onClick={handleEditSlotCancel} style={{ background: '#7f8c8d', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                      <span>{slot.startTime} - {slot.endTime}{getSlotPriceLabel(slot)} — <em>{slot.status}</em></span>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={function() { handleEditSlotStart(turf.id, slot); }} style={{ background: '#f39c12', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                                          Edit
                                        </button>
                                        <button onClick={function() { handleDeleteSlot(turf.id, slot.id); }} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}>
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
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
                            <input type="number" value={slotForm.price} onChange={function(e) { setSlotForm({ ...slotForm, price: e.target.value }); }} placeholder="Required" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '100px' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.82em', marginBottom: '4px' }}>Availability</label>
                            <select value={slotForm.status} onChange={function(e) { setSlotForm({ ...slotForm, status: e.target.value }); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
                              <option value="AVAILABLE">Available</option>
                              <option value="BOOKED">Booked</option>
                            </select>
                          </div>
                          <button onClick={function() { handleAddSlot(turf.id); }} disabled={slotLoading} style={{ background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer' }}>
                            {getAddSlotButtonLabel()}
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
        <div className="modal-overlay" onClick={closeBookingsModal}>
          <div className="modal-content-bookings" onClick={function(e) { e.stopPropagation(); }}>
            <div className="modal-header">
              <h2>📋 Bookings for {selectedTurf.name}</h2>
              <button className="modal-close" onClick={closeBookingsModal}>✕</button>
            </div>
            <div className="modal-body">
              {(turfBookings[selectedTurf.id] || []).length > 0 ? (
                <div className="bookings-list-modal">
                  {turfBookings[selectedTurf.id].map(function(booking) {
                    const bs = getBookingStatusLower(booking.status);
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
