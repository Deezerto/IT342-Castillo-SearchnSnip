import React, { useEffect, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../css/Dashboard.css';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0
};

const libraries = ['places'];

const defaultCenter = {
    lat: 10.3157, // Example: Cebu City coordinates
    lng: 123.8854
};

const fallbackShopImage = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

const Dashboard = () => {
    const [displayName, setDisplayName] = useState('Loading...');
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [barbers, setBarbers] = useState([]);
    const [shopsLoading, setShopsLoading] = useState(true);
    const [shopsError, setShopsError] = useState(null);
    const [selectedBarberId, setSelectedBarberId] = useState(null);
    const [detailsModalShop, setDetailsModalShop] = useState(null);
    const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);
    const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const detectedLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    setUserLocation(detectedLocation);
                    setMapCenter(detectedLocation);
                },
                (error) => {
                    console.error("Error detecting location", error);
                    setLocationError("Could not retrieve your location. Make sure location services are enabled.");
                }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
        }
    }, []);

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

        const loadBarbershops = async () => {
            setShopsLoading(true);
            setShopsError(null);

            try {
                const response = await fetch('http://localhost:8080/api/shops', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    setBarbers([]);
                    setShopsError('Could not load barbershops. Please try again later.');
                    return;
                }

                if (!response.ok) {
                    setBarbers([]);
                    setShopsError('Could not load barbershops. Please try again later.');
                    return;
                }

                const shops = await response.json();

                const normalizedShops = (Array.isArray(shops) ? shops : []).map((shop) => ({
                    showcaseImages: Array.isArray(shop.showcaseImages) && shop.showcaseImages.length > 0
                        ? shop.showcaseImages
                        : [fallbackShopImage],
                    id: shop.shopId,
                    name: shop.name || 'Unnamed Barbershop',
                    description: shop.description || 'No description provided for this barbershop yet.',
                    address: shop.address || 'No address provided',
                    latitude: typeof shop.latitude === 'number' ? shop.latitude : null,
                    longitude: typeof shop.longitude === 'number' ? shop.longitude : null,
                    contactInfo: shop.contactInfo || '',
                    image: Array.isArray(shop.showcaseImages) && shop.showcaseImages.length > 0
                        ? shop.showcaseImages[0]
                        : fallbackShopImage
                }));

                setBarbers(normalizedShops);
            } catch (error) {
                setBarbers([]);
                setShopsError('Could not load barbershops. Please try again later.');
            } finally {
                setShopsLoading(false);
            }
        };

        loadCurrentUser();
        loadBarbershops();
    }, [navigate]);

    const filteredBarbers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        if (!keyword) {
            return barbers;
        }

        return barbers.filter((barber) => {
            const searchableText = `${barber.name} ${barber.address}`.toLowerCase();
            return searchableText.includes(keyword);
        });
    }, [barbers, searchTerm]);

    const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId) || null;

    const handleSelectBarber = (barber) => {
        setSelectedBarberId(barber.id);

        if (typeof barber.latitude === 'number' && typeof barber.longitude === 'number') {
            setMapCenter({
                lat: barber.latitude,
                lng: barber.longitude
            });
        }
    };

    const openDetailsModal = (barber) => {
        setDetailsModalShop(barber);
        setActiveDetailImageIndex(0);
    };

    const closeDetailsModal = () => {
        setDetailsModalShop(null);
        setActiveDetailImageIndex(0);
    };

    const showPreviousDetailImage = () => {
        if (!detailsModalShop) {
            return;
        }

        const imageCount = detailsModalShop.showcaseImages.length;
        setActiveDetailImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
    };

    const showNextDetailImage = () => {
        if (!detailsModalShop) {
            return;
        }

        const imageCount = detailsModalShop.showcaseImages.length;
        setActiveDetailImageIndex((prev) => (prev + 1) % imageCount);
    };

    const proceedToBooking = (shop) => {
        if (!shop) {
            return;
        }

        navigate('/booking', {
            state: {
                shop
            }
        });
    };

    return (
        <div className="dashboard-container">
            <Navbar 
                displayName={displayName} 
                activePage='home' 
                searchTerm={searchTerm} 
                onSearchChange={setSearchTerm} 
            />

            <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex' }}>
                {/* List View */}
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column',
                    transition: 'transform 0.4s ease-in-out',
                    transform: viewMode === 'list' ? 'translateX(0)' : 'translateX(-100%)',
                    zIndex: viewMode === 'list' ? 2 : 1
                }}>
                    <div style={{ background: '#fff', borderBottom: '1px solid #eaeaea', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontWeight: 600, fontSize: '1.4rem' }}>Available Barbershops</h2>
                        <span 
                            style={{ color: '#2b52ff', cursor: 'pointer', fontWeight: 500 }}
                            onClick={() => setViewMode('map')}
                        >
                            &lt;&lt; View map
                        </span>
                    </div>
                    
                    <div style={{ padding: '30px 40px', flex: 1, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Near you:</h3>
                            <span style={{ color: '#2b52ff', cursor: 'pointer', fontSize: '0.9rem' }}>View more &gt;&gt;</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                            {filteredBarbers.slice(0, 3).map(barber => (
                                <div key={barber.id} className="barber-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }} onClick={() => openDetailsModal(barber)}>
                                    <div style={{ height: '180px', backgroundImage: `url(${barber.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>♡</div>
                                        {barber.name.includes("Classic") && <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: '#ff3b5c', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>FEATURED</div>}
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{barber.name}</h4>
                                            <span style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '0.9rem' }}>&#9733; 4.8</span>
                                        </div>
                                        <div style={{ color: '#777', fontSize: '0.85rem', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                            <span style={{ marginRight: '5px' }}>&#9582; 1.2 miles away •</span> {barber.address.substring(0, 15)}...
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', color: '#2b52ff' }}>$35+</span>
                                            <button style={{ background: '#eef2ff', color: '#2b52ff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Book Now</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Barbershops you've previously visited:</h3>
                            <span style={{ color: '#2b52ff', cursor: 'pointer', fontSize: '0.9rem' }}>View your history &gt;&gt;</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                            {[1, 2, 3].map(item => (
                                <div key={`visited-${item}`} className="barber-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                                    <div style={{ height: '180px', background: '#e0e0e0', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>♡</div>
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Previously Visited {item}</h4>
                                            <span style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '0.9rem' }}>&#9733; 4.7</span>
                                        </div>
                                        <div style={{ color: '#777', fontSize: '0.85rem', marginBottom: '15px' }}>
                                            Placeholder details...
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', color: '#2b52ff' }}>$25+</span>
                                            <button style={{ background: '#eef2ff', color: '#2b52ff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Book Now</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map View */}
                <div 
                    className="dashboard-content"
                    style={{ 
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        transition: 'transform 0.4s ease-in-out',
                        transform: viewMode === 'map' ? 'translateX(0)' : 'translateX(100%)',
                        zIndex: viewMode === 'map' ? 2 : 1
                    }}
                >
                    <div className="sidebar" style={{ minWidth: '420px', maxWidth: '420px' }}>
                        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Nearby Barbers</h2>
                            <span 
                                style={{ color: '#2b52ff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                                onClick={() => setViewMode('list')}
                            >
                                View More Barbershops&gt;&gt;
                            </span>
                        </div>

                    <div className="barber-cards">
                        {shopsError && <div className="empty-state">{shopsError}</div>}

                        {!shopsError && shopsLoading && <div className="empty-state">Loading barbershops...</div>}

                        {!shopsError && !shopsLoading && filteredBarbers.length === 0 && (
                            <div className="empty-state">No barbershops found for your search.</div>
                        )}

                        {!shopsError && !shopsLoading && filteredBarbers.map((barber) => (
                            <div
                                key={barber.id}
                                className={`barber-card ${selectedBarberId === barber.id ? 'selected' : ''}`}
                                onClick={() => handleSelectBarber(barber)}
                            >
                                <div
                                    className="card-image"
                                    style={{ backgroundImage: `url(${barber.image})`, backgroundSize: 'cover' }}
                                />
                                <div className="card-info">
                                    <div className="card-header">
                                        <h3>{barber.name}</h3>
                                    </div>
                                    <div className="location">{barber.address}</div>
                                    <div className="card-footer">
                                        <span className="price">{barber.contactInfo || 'Contact info unavailable'}</span>
                                        <button
                                            className="book-btn"
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openDetailsModal(barber);
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="map-area" style={{ position: 'relative' }}>
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={mapCenter}
                            zoom={14}
                            options={{ disableDefaultUI: true }} // Disables default Google Maps buttons so your custom ones work
                        >
                            {userLocation && (
                                <Marker 
                                    position={userLocation} 
                                    icon={{
                                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#4285F4" fill-opacity="0.3"/><circle cx="18" cy="18" r="9" fill="white"/><circle cx="18" cy="18" r="7" fill="#4285F4"/></svg>'),
                                        anchor: new window.google.maps.Point(18, 18),
                                    }}
                                    zIndex={1000}
                                />
                            )}

                            {barbers
                                .filter((barber) => typeof barber.latitude === 'number' && typeof barber.longitude === 'number')
                                .map((barber) => (
                                    <Marker
                                        key={`shop-marker-${barber.id}`}
                                        position={{ lat: barber.latitude, lng: barber.longitude }}
                                        onClick={() => handleSelectBarber(barber)}
                                    />
                                ))}
                        </GoogleMap>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', position: 'absolute', background: '#f0f0f0' }}>
                            Loading Map...
                        </div>
                    )}

                    {selectedBarber && (
                        <div className="map-card-popup" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                            <div className="popup-header">
                                <strong>Selected Location</strong>
                                <span
                                    style={{ cursor: 'pointer', color: '#777' }}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedBarberId(null)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            setSelectedBarberId(null);
                                        }
                                    }}
                                >
                                    &#x2715;
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
                                <img src={selectedBarber.image} alt={selectedBarber.name} style={{ width: '50px', height: '50px', borderRadius: '5px' }} />
                                <div>
                                    <strong>{selectedBarber.name}</strong>
                                    <br />
                                    <span style={{ color: '#777', fontSize: '0.8rem' }}>{selectedBarber.address}</span>
                                </div>
                            </div>
                            <button className="popup-btn" type="button" onClick={() => openDetailsModal(selectedBarber)}>
                                View Full Details
                            </button>
                        </div>
                    )}

                    {locationError && (
                        <div className="location-error-banner">{locationError}</div>
                    )}

                        <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <button 
                                onClick={() => {
                                    if (userLocation) {
                                        setMapCenter(userLocation);
                                    }
                                }}
                                style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                                title="Go to my location"
                            >
                                📍
                            </button>
                            <button style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>+</button>
                            <button style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>-</button>
                        </div>
                    </div>
                </div>
            </div>

            {detailsModalShop && (
                <div className="details-modal-overlay" onClick={closeDetailsModal}>
                    <div className="details-modal" onClick={(event) => event.stopPropagation()}>
                        <button className="details-close-btn" type="button" onClick={closeDetailsModal}>
                            &#x2715;
                        </button>

                        <div className="details-image-stage">
                            <img
                                src={detailsModalShop.showcaseImages[activeDetailImageIndex]}
                                alt={`${detailsModalShop.name} showcase ${activeDetailImageIndex + 1}`}
                                className="details-image"
                            />

                            <button
                                type="button"
                                className="details-image-hotspot details-image-hotspot-left"
                                aria-label="Show previous image"
                                onClick={showPreviousDetailImage}
                            />
                            <button
                                type="button"
                                className="details-image-hotspot details-image-hotspot-right"
                                aria-label="Show next image"
                                onClick={showNextDetailImage}
                            />
                        </div>

                        <div className="details-content">
                            <h2>{detailsModalShop.name}</h2>
                            <p>{detailsModalShop.description}</p>
                            <div className="details-actions">
                                <button
                                    type="button"
                                    className="details-book-btn"
                                    onClick={() => proceedToBooking(detailsModalShop)}
                                >
                                    Proceed to Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;


