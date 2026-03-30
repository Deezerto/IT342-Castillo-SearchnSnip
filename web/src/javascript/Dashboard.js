import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
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

const defaultCenter = {
    lat: 10.3157, // Example: Cebu City coordinates
    lng: 123.8854
};

const Dashboard = () => {
    const [activeFilter, setActiveFilter] = useState('Haircut');
    const [displayName, setDisplayName] = useState('Loading...');
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
    });

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

        loadCurrentUser();
    }, [navigate]);

    const barbers = [
        {
            id: 1,
            name: 'Classic Cuts Studio',
            distance: '1.2 miles away • Downtown',
            rating: 4.9,
            price: '$35+',
            image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            featured: true
        },
        {
            id: 2,
            name: 'The Blue Room Lounge',
            distance: '2.5 miles away • West Side',
            rating: 4.7,
            price: '$45+',
            image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            featured: false
        },
        {
            id: 3,
            name: 'The Sharp Blade',
            distance: '0.8 miles away • Uptown',
            rating: 4.8,
            price: '$40+',
            image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            featured: false
        }
    ];

    return (
        <div className="dashboard-container">
            <Navbar displayName={displayName} activePage='home' />

            <div className="dashboard-content">
                <div className="sidebar">
                    <div className="sidebar-header">
                        <h2>Nearby Barbers</h2>
                        <p>Showing 24 shops in your area</p>
                        <input
                            type="text"
                            placeholder="Search by name, style, or zip..."
                            className="search-bar"
                        />
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${activeFilter === 'Haircut' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('Haircut')}
                            >
                                &#x2702; Haircut
                            </button>
                            <button
                                className={`filter-btn ${activeFilter === 'Beard Trim' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('Beard Trim')}
                            >
                                Beard Trim
                            </button>
                            <button
                                className={`filter-btn ${activeFilter === 'Shave' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('Shave')}
                            >
                                Shave
                            </button>
                        </div>
                    </div>

                    <div className="barber-cards">
                        {barbers.map((barber) => (
                            <div key={barber.id} className="barber-card">
                                <div
                                    className="card-image"
                                    style={{ backgroundImage: `url(${barber.image})`, backgroundSize: 'cover' }}
                                >
                                    {barber.featured && (
                                        <span style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: '#e53935', color: 'white', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '3px' }}>
                                            FEATURED
                                        </span>
                                    )}
                                    <button className="heart-btn">&#x2661;</button>
                                </div>
                                <div className="card-info">
                                    <div className="card-header">
                                        <h3>{barber.name}</h3>
                                        <span className="rating">&#x2605; {barber.rating}</span>
                                    </div>
                                    <div className="location">{barber.distance}</div>
                                    <div className="card-footer">
                                        <span className="price">{barber.price}</span>
                                        <button className="book-btn">Book Now</button>
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
                            center={defaultCenter}
                            zoom={13}
                            options={{ disableDefaultUI: true }} // Disables default Google Maps buttons so your custom ones work
                        >
                            {/* You will add <Marker /> components here later */}
                        </GoogleMap>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', position: 'absolute', background: '#f0f0f0' }}>
                            Loading Map...
                        </div>
                    )}

                    <div className="map-card-popup" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                        <div className="popup-header">
                            <strong>Selected Location</strong>
                            <span style={{ cursor: 'pointer', color: '#777' }}>&#x2715;</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
                            <img src={barbers[2].image} alt="Sharp Blade" style={{ width: '50px', height: '50px', borderRadius: '5px' }} />
                            <div>
                                <strong>{barbers[2].name}</strong>
                                <br />
                                <span style={{ color: '#fbbc04', fontSize: '0.8rem' }}>&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</span>
                            </div>
                        </div>
                        <button className="popup-btn">View Full Details</button>
                    </div>

                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>+</button>
                        <button style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>-</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;


