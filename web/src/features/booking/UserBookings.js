import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../javascript/Navbar';
import './UserBookings.css';

const UserBookings = () => {
    const [displayName, setDisplayName] = useState('Loading...');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Active');
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        const loadCurrentUser = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const user = await response.json();
                    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
                    setDisplayName(fullName || user.email || 'User');
                } else {
                    setDisplayName('User');
                }
            } catch {
                setDisplayName('User');
            }
        };

        const loadBookings = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:8080/api/bookings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setBookings(data);
                } else {
                    setError('Failed to load bookings.');
                }
            } catch {
                setError('Failed to connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        loadCurrentUser();
        loadBookings();
    }, [navigate]);

    const handleCancelClick = (booking) => {
        setBookingToCancel(booking);
        setCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!bookingToCancel) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:8080/api/bookings/${bookingToCancel.bookingId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setBookings(prev => prev.map(b => b.bookingId === bookingToCancel.bookingId ? { ...b, status: 'Cancelled' } : b));
            } else {
                alert('Failed to cancel booking.');
            }
        } catch {
            alert('Error connecting to the server.');
        } finally {
            setCancelModalOpen(false);
            setBookingToCancel(null);
        }
    };

    const closeCancelModal = () => {
        setCancelModalOpen(false);
        setBookingToCancel(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'TBA';
        const date = new Date(dateString);
        return date.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
    };

    const filteredBookings = bookings.filter(b => b.status === activeTab);

    return (
        <div className="ub-page">
            <Navbar displayName={displayName} activePage="bookings" />

            <main className="ub-main">
                <div className="ub-header">
                    <h1>My Bookings</h1>
                    <p>Manage and view your upcoming and past appointments.</p>
                </div>

                <div className="ub-tabs">
                    {['Active', 'Completed', 'Cancelled'].map(tab => (
                        <button
                            key={tab}
                            className={`ub-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'Completed' ? 'Finished' : tab}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="ub-feedback">Loading your bookings...</div>
                ) : error ? (
                    <div className="ub-feedback error">{error}</div>
                ) : filteredBookings.length === 0 ? (
                    <div className="ub-empty">
                        <h3>No {activeTab.toLowerCase()} bookings found.</h3>
                        <p>When you book a service, it will appear here.</p>
                        {activeTab === 'Active' && (
                            <button className="ub-browse-btn" onClick={() => navigate('/dashboard')}>Browse Barbershops</button>
                        )}
                    </div>
                ) : (
                    <div className="ub-grid">
                        {filteredBookings.map(booking => (
                            <div key={booking.bookingId} className="ub-card">
                                <div className="ub-card-image">
                                    <img src={booking.shopImage || '/images/barbershop-store-icon.png'} alt={booking.shopName} />
                                    <span className={`ub-status-badge ${booking.status.toLowerCase()}`}>
                                        {booking.status === 'Completed' ? 'Finished' : booking.status}
                                    </span>
                                </div>
                                <div className="ub-card-content">
                                    <h3>{booking.shopName}</h3>
                                    <p className="ub-services">{booking.servicesTitle}</p>
                                    <div className="ub-meta">
                                        <span><strong>Date:</strong> {formatDate(booking.appointmentDate)}</span>
                                        <span><strong>Total:</strong> {formatCurrency(booking.totalPrice)}</span>
                                    </div>
                                    {booking.status === 'Active' && (
                                        <button className="ub-cancel-btn" onClick={() => handleCancelClick(booking)}>
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {cancelModalOpen && (
                <div className="ub-modal-overlay">
                    <div className="ub-modal">
                        <h3>Cancel Booking</h3>
                        <p>Are you sure you want to cancel your booking at <strong>{bookingToCancel?.shopName}</strong>?</p>
                        <p className="ub-modal-sub">This action cannot be undone.</p>
                        <div className="ub-modal-actions">
                            <button className="ub-modal-btn cancel" onClick={closeCancelModal}>Keep Booking</button>
                            <button className="ub-modal-btn confirm" onClick={confirmCancel}>Yes, Cancel It</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserBookings;
