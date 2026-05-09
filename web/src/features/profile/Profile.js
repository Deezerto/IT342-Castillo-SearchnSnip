import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../javascript/Navbar';
import './Profile.css';

const Profile = () => {
    const [displayName, setDisplayName] = useState('Loading...');
    const [userStats, setUserStats] = useState({
        totalHaircuts: 24,
        barbersVisited: 12,
        favoriteStyles: 4,
        loyaltyPoints: 850
    });
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

        loadCurrentUser();
    }, [navigate]);

    return (
        <div className="profile-container">
            <Navbar displayName={displayName} activePage="profile" />

            <div className="profile-content-wrapper">
                {/* Header / Cover Section */}
                <div className="profile-cover-section">
                    <div className="cover-photo">
                        <button className="edit-cover-btn">&#128247; Edit Cover</button>
                    </div>
                    <div className="profile-info-bar">
                        <div className="profile-avatar-wrapper">
                            <img src="/images/default_profile_picture.png" alt="Profile" className="profile-main-avatar" />
                        </div>
                        <div className="profile-details">
                            <h1>{displayName}</h1>
                            <div className="profile-meta">
                                <span>&#128205; New York, NY</span>
                                <span>&#128197; Joined Oct 2023</span>
                            </div>
                        </div>
                        <div className="profile-actions">
                            <button className="btn-primary">&#9998; Edit Profile</button>
                            <button className="btn-secondary">&#128279; Share</button>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="profile-stats">
                    <div className="stat-card">
                        <h2>{userStats.totalHaircuts}</h2>
                        <p>TOTAL HAIRCUTS</p>
                    </div>
                    <div className="stat-card">
                        <h2>{userStats.barbersVisited}</h2>
                        <p>BARBERS VISITED</p>
                    </div>
                    <div className="stat-card">
                        <h2>{userStats.favoriteStyles}</h2>
                        <p>FAVORITE STYLES</p>
                    </div>
                    <div className="stat-card">
                        <h2>{userStats.loyaltyPoints}</h2>
                        <p>LOYALTY POINTS</p>
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="profile-main-grid">
                    {/* Left Sidebar */}
                    <div className="profile-sidebar">
                        <div className="settings-menu">
                            <h3>Account Settings</h3>
                            <ul>
                                <li><span>&#128179;</span> Payment Methods <span className="arrow">&#10095;</span></li>
                                <li><span>&#10084;</span> Favorite Styles <span className="arrow">&#10095;</span></li>
                                <li><span>&#128340;</span> Booking History <span className="arrow">&#10095;</span></li>
                                <li><span>&#128274;</span> Security & Privacy <span className="arrow">&#10095;</span></li>
                            </ul>
                        </div>
                        <div className="pro-member-card">
                            <div className="pro-header">
                                <h3>Pro Member</h3>
                                <span className="medal-icon">&#127894;</span>
                            </div>
                            <p>You're 2 haircuts away from a free beard trim!</p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '80%' }}></div>
                            </div>
                            <div className="progress-text">8/10 Completed</div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="profile-recent-visits">
                        <div className="recent-visits-header">
                            <h3>Recent Visits</h3>
                            <button className="view-all-btn">View All</button>
                        </div>

                        <div className="visit-list">
                            {[1, 2, 3].map((visit, index) => (
                                <div key={index} className="visit-card">
                                    <div className="visit-image">
                                        <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80" alt="Visit" />
                                    </div>
                                    <div className="visit-details">
                                        <h4>Classic Fade & Line Up</h4>
                                        <p>by <strong>Marcus V.</strong> at Elite Barber Studio</p>
                                        <div className="visit-tags">
                                            <span>FADE</span>
                                            <span>WASH</span>
                                        </div>
                                    </div>
                                    <div className="visit-price-date">
                                        <div className="visit-date">MAY 12, 2024</div>
                                        <div className="visit-price">$45.00</div>
                                        <button className="receipt-btn">&#9776;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
