import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Navbar.css';

const Navbar = ({ displayName, activePage }) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    const navigateFromProfileMenu = (path) => {
        setIsProfileMenuOpen(false);
        navigate(path);
    };

    const handleLogout = () => {
        const confirmed = window.confirm('Are you sure you want to log out?');
        if (!confirmed) {
            return;
        }

        localStorage.removeItem('token');
        setIsProfileMenuOpen(false);
        navigate('/', { replace: true });
    };

    return (
        <header className="dashboard-header">
            <div className="logo-section" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                <span className="logo-icon">&#x2702;</span>
                SNIPNSKETCH
            </div>
            <div className="nav-links">
                <span className={activePage === 'home' ? 'active' : ''} onClick={() => navigate('/dashboard')}>Home</span>
                <span className={activePage === 'favorites' ? 'active' : ''}>Favorites</span>
                <span className={activePage === 'profile' ? 'active' : ''} onClick={() => navigate('/profile')}>Profile</span>
            </div>
            <div className="profile-wrapper" ref={profileMenuRef}>
                <button
                    type="button"
                    className="profile-trigger"
                    onClick={() => setIsProfileMenuOpen((previous) => !previous)}
                >
                    <div className="profile-section">
                        <div>
                            <strong>{displayName}</strong>
                            <br />
                            <span style={{ fontSize: '0.7rem', color: '#777' }}>Free Member</span>
                        </div>
                        <img src="/images/default_profile_picture.png" alt="Profile" className="profile-pic" />
                    </div>
                </button>

                {isProfileMenuOpen && (
                    <div className="profile-menu">
                        <div className="profile-menu-header" style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/images/default_profile_picture.png" alt="Profile" className="profile-pic" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                <strong style={{ fontSize: '0.9rem', color: '#333' }}>{displayName}</strong>
                                <span style={{ fontSize: '0.75rem', color: '#777' }}>Free Member</span>
                            </div>
                        </div>
                        <button type="button" className="profile-menu-item" onClick={() => navigateFromProfileMenu('/profile')}>
                            <span className="profile-menu-icon">&#128100;</span>
                            <span>See your Profile</span>
                        </button>
                        <button type="button" className="profile-menu-item" onClick={() => navigateFromProfileMenu('/settings')}>
                            <span className="profile-menu-icon">&#9881;</span>
                            <span>Settings</span>
                        </button>
                        <div style={{ borderTop: '1px solid #eee', margin: '5px 0' }}></div>
                        <button type="button" className="profile-menu-item logout" onClick={handleLogout}>
                            <span className="profile-menu-icon">&#10162;</span>
                            <span>Log Out</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;