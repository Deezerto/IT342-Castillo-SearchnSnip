import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../javascript/Navbar';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import './Profile.css';

const Profile = () => {
    const [displayName, setDisplayName] = useState('Loading...');
    const [userStats, setUserStats] = useState({
        totalHaircuts: 24,
        barbersVisited: 12,
        favoriteStyles: 4
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
                        <button className="edit-cover-btn">
                            <PhotoCameraOutlinedIcon fontSize="small" /> Edit Cover
                        </button>
                    </div>
                    <div className="profile-info-bar">
                        <div className="profile-avatar-wrapper">
                            <img src="/images/default_profile_picture.png" alt="Profile" className="profile-main-avatar" />
                        </div>
                        <div className="profile-details">
                            <h1>{displayName}</h1>
                            <div className="profile-meta">
                                <span><LocationOnOutlinedIcon fontSize="small" /> New York, NY</span>
                                <span><CalendarTodayOutlinedIcon fontSize="small" /> Joined Oct 2023</span>
                            </div>
                        </div>
                        <div className="profile-actions">
                            <button className="btn-primary">
                                <EditOutlinedIcon fontSize="small" /> Edit Profile
                            </button>
                            <button className="btn-secondary">
                                <ShareOutlinedIcon fontSize="small" /> Share
                            </button>
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
                </div>

                {/* Main Content Split */}
                <div className="profile-main-grid">
                    {/* Left Sidebar */}
                    <div className="profile-sidebar">
                        <div className="settings-menu">
                            <h3>Account Settings</h3>
                            <ul>
                                <li>
                                    <span className="menu-icon"><PaymentOutlinedIcon fontSize="small" /></span> 
                                    Payment Methods 
                                    <span className="arrow">&#10095;</span>
                                </li>
                                <li>
                                    <span className="menu-icon"><StarBorderOutlinedIcon fontSize="small" /></span> 
                                    Favorites 
                                    <span className="arrow">&#10095;</span>
                                </li>
                                <li>
                                    <span className="menu-icon"><HistoryOutlinedIcon fontSize="small" /></span> 
                                    Booking History 
                                    <span className="arrow">&#10095;</span>
                                </li>
                                <li>
                                    <span className="menu-icon"><SecurityOutlinedIcon fontSize="small" /></span> 
                                    Security & Privacy 
                                    <span className="arrow">&#10095;</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="profile-recent-visits">
                        <div className="recent-visits-header">
                            <h3>Recent Visits</h3>
                        </div>

                        <div className="visit-list empty-state">
                            <StorefrontOutlinedIcon style={{ fontSize: '60px', color: '#cbd5e1', marginBottom: '15px' }} />
                            <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>You have not visited any barbershops.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
