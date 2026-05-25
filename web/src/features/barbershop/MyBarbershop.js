import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
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
    const [firstName, setFirstName] = useState('Master');
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
                setFirstName(user.firstName || 'Master');
            } catch (error) {
                setDisplayName('User');
                setFirstName('Master');
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
                        <header className="myb-title-wrap" style={{ alignItems: 'center', gap: '16px' }}>
                            <h1 style={{ margin: 0 }}>{shopDisplayName}</h1>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <IconButton 
                                    color="primary" 
                                    onClick={() => navigate('/barbershop-upload', { state: { shopData: overview } })} 
                                    title="Edit Barbershop & Services"
                                    sx={{ border: '1px solid #e0e0e0', backgroundColor: '#fff' }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton 
                                    color="primary" 
                                    onClick={() => navigate('/barbershop-upload', { state: { shopData: overview } })} 
                                    title="Add New Service"
                                    sx={{ border: '1px solid #e0e0e0', backgroundColor: '#fff' }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </div>
                        </header>

                        <section className="myb-welcome-wrap">
                            <p>My Barbershop</p>
                            <h2>Welcome back, {firstName}.</h2>
                        </section>

                        <section className="myb-kpi-dashboard">
                            <div className="myb-kpi-column-left">
                                <div className="myb-kpi-card">
                                    <div className="myb-kpi-header">Total revenue</div>
                                    <div className="myb-kpi-body">
                                        <span className="myb-kpi-value">₱24,961</span>
                                    </div>
                                </div>
                                <div className="myb-kpi-card">
                                    <div className="myb-kpi-header">Total sales</div>
                                    <div className="myb-kpi-body">
                                        <span className="myb-kpi-value">23</span>
                                    </div>
                                </div>
                            </div>
                            <div className="myb-kpi-column-right">
                                <div className="myb-kpi-card myb-kpi-chart-card">
                                    <div className="myb-kpi-header">Most picked service</div>
                                    <div className="myb-kpi-body myb-kpi-chart-body">
                                        <div className="myb-bar-chart">
                                            <div className="myb-bar-row">
                                                <div className="myb-bar-label">Signature Haircut</div>
                                                <div className="myb-bar-track">
                                                    <div className="myb-bar-fill" style={{ width: '85%' }}></div>
                                                </div>
                                            </div>
                                            <div className="myb-bar-row">
                                                <div className="myb-bar-label">Luxury Hot Shave</div>
                                                <div className="myb-bar-track">
                                                    <div className="myb-bar-fill" style={{ width: '65%' }}></div>
                                                </div>
                                            </div>
                                            <div className="myb-bar-row">
                                                <div className="myb-bar-label">Beard Sculpting</div>
                                                <div className="myb-bar-track">
                                                    <div className="myb-bar-fill" style={{ width: '40%' }}></div>
                                                </div>
                                            </div>
                                            <div className="myb-bar-row">
                                                <div className="myb-bar-label">Junior Cut</div>
                                                <div className="myb-bar-track">
                                                    <div className="myb-bar-fill" style={{ width: '25%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="myb-kpi-card" style={{ marginBottom: '30px' }}>
                            <div className="myb-kpi-header">Total Client Base</div>
                            <div className="myb-kpi-body" style={{ flexDirection: 'column' }}>
                                <span className="myb-kpi-value">{formatWholeNumber(overview.totalClientBase || 0)}</span>
                                <span style={{ color: '#4a5568', marginTop: '10px', fontSize: '0.95rem', fontWeight: 'normal' }}>
                                    +{formatWholeNumber(overview.newClientsThisWeek || 0)} New This Week &bull; {activeReservationItems.length} Active Reservations
                                </span>
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
