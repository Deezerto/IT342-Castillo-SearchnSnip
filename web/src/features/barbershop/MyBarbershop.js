import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../javascript/Navbar';
import './MyBarbershop.css';

const reservationImageFallback = [
    'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?auto=format&fit=crop&w=1000&q=80'
];

const placeholderMetrics = {
    monthlyRevenue: 42850,
    projectedRevenue: 50000,
    lastMonthRevenue: 38200,
    growthPercent: 12,
    totalClientBase: 3248,
    newClientsThisWeek: 156
};

const formatWholeCurrency = (value) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0
    }).format(safeValue);
};

const formatWholeNumber = (value) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat('en-US').format(safeValue);
};

const formatReservationDate = (rawDate) => {
    if (!rawDate) {
        return null;
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const MyBarbershop = () => {
    const [displayName, setDisplayName] = useState('Loading...');
    const [overview, setOverview] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [overviewError, setOverviewError] = useState(null);
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
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login', { replace: true });
                    return;
                }

                if (!response.ok) {
                    setDisplayName('User');
                    return;
                }

                const user = await response.json();
                const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
                setDisplayName(fullName || user.email || 'User');
            } catch (error) {
                setDisplayName('User');
            }
        };

        const loadOverview = async () => {
            setOverviewLoading(true);
            setOverviewError(null);

            try {
                const response = await fetch('http://localhost:8080/api/shops/mine/overview', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login', { replace: true });
                    return;
                }

                if (!response.ok) {
                    setOverview(null);
                    setOverviewError('Could not load your barbershop data. Please try again.');
                    return;
                }

                const data = await response.json();
                setOverview(data);
            } catch (error) {
                setOverview(null);
                setOverviewError('Could not load your barbershop data. Please try again.');
            } finally {
                setOverviewLoading(false);
            }
        };

        loadCurrentUser();
        loadOverview();
    }, [navigate]);

    const hasBarbershop = overview?.shopId != null;
    const shopDisplayName = (overview?.name || 'My Barbershop').toUpperCase();
    const activeReservationItems = Array.isArray(overview?.activeReservationsList)
        ? overview.activeReservationsList
        : [];

    return (
        <div className="myb-page">
            <Navbar displayName={displayName} activePage="" />

            <main className="myb-main">
                {overviewLoading && (
                    <div className="myb-feedback-card">Loading your barbershop overview...</div>
                )}

                {!overviewLoading && overviewError && (
                    <div className="myb-feedback-card error">{overviewError}</div>
                )}

                {!overviewLoading && !overviewError && !hasBarbershop && (
                    <section className="myb-empty-state">
                        <div className="myb-empty-icon">
                            <img
                                src="/images/barbershop-store-icon.png"
                                alt="Barbershop"
                                onError={(event) => {
                                    event.target.style.display = 'none';
                                    event.target.nextSibling.style.display = 'block';
                                }}
                                style={{ width: '88px', height: '88px' }}
                            />
                            <span style={{ fontSize: '72px', display: 'none' }}>SHOP</span>
                        </div>
                        <h2>You don't own any barbershops yet.</h2>
                        <button className="myb-add-btn" onClick={() => navigate('/barbershop-upload')}>
                            Add your barbershop
                        </button>
                    </section>
                )}

                {!overviewLoading && !overviewError && hasBarbershop && (
                    <>
                        <header className="myb-title-wrap">
                            <h1>{shopDisplayName}</h1>
                        </header>

                        <section className="myb-welcome-wrap">
                            <p>My Barbershop</p>
                            <h2>Welcome back, Master.</h2>
                        </section>

                        <section className="myb-revenue-panel">
                            <div className="myb-revenue-main">
                                <span className="myb-label">Monthly Revenue</span>
                                <div className="myb-revenue-total-row">
                                    <strong>{formatWholeCurrency(overview.totalEarnings || 0)}</strong>
                                    <span className="myb-growth-pill">+{overview.growthPercent || 0}%</span>
                                </div>
                            </div>

                            <div className="myb-revenue-splits">
                                <div>
                                    <span className="myb-sub-label">Projected</span>
                                    <strong>{formatWholeCurrency(overview.projectedRevenue || 0)}</strong>
                                </div>
                                <div>
                                    <span className="myb-sub-label">Last Month</span>
                                    <strong>{formatWholeCurrency(overview.lastMonthRevenue || 0)}</strong>
                                </div>
                            </div>
                        </section>

                        <section className="myb-client-panel">
                            <div>
                                <span className="myb-label">Total Client Base</span>
                                <div className="myb-client-row">
                                    <strong>{formatWholeNumber(overview.totalClientBase || 0)}</strong>
                                    <span className="myb-client-week">+{formatWholeNumber(overview.newClientsThisWeek || 0)} New This Week</span>
                                </div>
                            </div>
                            <div className="myb-avatars">
                                <span>{activeReservationItems.length} Active</span>
                            </div>
                        </section>

                        <section className="myb-reservations-wrap">
                            <div className="myb-reservations-head">
                                <h3>Active Reservations</h3>
                                <button type="button">View All Reservations -&gt;</button>
                            </div>

                            {activeReservationItems.length === 0 ? (
                                <p className="myb-no-active-reservations">No active reservations</p>
                            ) : (
                                <div className="myb-reservations-grid">
                                    {activeReservationItems.slice(0, 6).map((item, index) => (
                                        <article key={item.bookingId ?? `reservation-${index}`} className="myb-reservation-card">
                                            <img
                                                src={item.image || reservationImageFallback[index % reservationImageFallback.length]}
                                                alt={item.title || `Reservation ${index + 1}`}
                                            />

                                            <div className="myb-reservation-content">
                                                <div className="myb-reservation-title-row">
                                                    <h4>{(item.title || `Reservation ${index + 1}`).toUpperCase()}</h4>
                                                    <span className="myb-active-chip">{(item.status || 'Active').toUpperCase()}</span>
                                                </div>

                                                <p>{formatReservationDate(item.appointmentDate) || overview.location || 'Address unavailable'}</p>

                                                <div className="myb-reservation-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/booking', { state: { shop: { id: overview.shopId, name: overview.name } } })}
                                                    >
                                                        See Details
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default MyBarbershop;
