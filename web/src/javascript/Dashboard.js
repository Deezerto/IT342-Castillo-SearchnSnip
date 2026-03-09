import React, { useState } from 'react';
import '../css/Dashboard.css';

const Dashboard = () => {
    const [activeFilter, setActiveFilter] = useState('Haircut');

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
            <header className="dashboard-header">
                <div className="logo-section">
                    <span className="logo-icon">&#x2702;</span>
                    SNIPNSKETCH
                </div>
                <div className="nav-links">
                    <span className="active">Home</span>
                    <span>Favorites</span>
                    <span>Profile</span>
                </div>
                <div className="profile-section">
                    <div>
                        <strong>ALEX JOHNSON</strong>
                        <br />
                        <span style={{ fontSize: '0.7rem', color: '#777' }}>Premium Member</span>
                    </div>
                    <img src="https://via.placeholder.com/35" alt="Profile" className="profile-pic" />
                </div>
            </header>

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

                <div className="map-area">
                    <div className="map-card-popup">
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

                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>+</button>
                        <button style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>-</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;