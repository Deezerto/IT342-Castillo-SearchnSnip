import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import StarIcon from '@mui/icons-material/Star';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import '../css/Navbar.css';

const Navbar = ({ displayName, activePage, searchTerm, onSearchChange }) => {
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
            <div className="header-left">
                <div className="logo-section" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <img src="/images/logo.png" alt="SearchN'Snip Logo" style={{ height: '30px', marginRight: '10px', borderRadius: '5px' }} />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1a1a1a', letterSpacing: '1px' }}>SEARCHN'SNIP</span>
                </div>

                {onSearchChange && (
                    <div className="nav-search-container" style={{ display: 'flex', alignItems: 'center', background: '#f5f6f8', borderRadius: '8px', padding: '8px 15px', width: '300px', margin: '0 0 0 20px', border: '1px solid #eaeaea' }}>
                        <SearchIcon style={{ color: '#888', marginRight: '8px', fontSize: '20px' }} />
                        <input
                            type="text"
                            placeholder="Search for barbershops"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#333' }}
                        />
                    </div>
                )}
            </div>

            <div className="nav-links">
                <span className={`nav-icon-btn${activePage === 'home' ? ' active' : ''}`} onClick={() => navigate('/dashboard')}>
                    <HomeIcon style={{ fontSize: '30px' }} />
                    <span className="nav-tooltip">Home</span>
                </span>
                <span className={`nav-icon-btn${activePage === 'favorites' ? ' active' : ''}`}>
                    <StarIcon style={{ fontSize: '30px' }} />
                    <span className="nav-tooltip">Favorites</span>
                </span>
                <span className={`nav-icon-btn${activePage === 'bookings' ? ' active' : ''}`} onClick={() => { }}>
                    <CalendarTodayIcon style={{ fontSize: '30px' }} />
                    <span className="nav-tooltip">Bookings</span>
                </span>
            </div>
            <div className="profile-wrapper" ref={profileMenuRef}>
                <button
                    type="button"
                    className="profile-trigger"
                    onClick={() => setIsProfileMenuOpen((previous) => !previous)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px', borderLeft: '1px solid #eee' }}
                >
                    <div className="profile-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/images/default_profile_picture.png" alt="Profile" className="profile-pic" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#333', lineHeight: '1.2' }}>{displayName}</strong>
                            <span style={{ fontSize: '0.7rem', color: '#888', lineHeight: '1.2' }}>Premium Member</span>
                        </div>
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
                            <span className="profile-menu-icon" style={{ display: 'flex', alignItems: 'center' }}><PersonIcon fontSize="small" /></span>
                            <span>See your Profile</span>
                        </button>
                        <button type="button" className="profile-menu-item" onClick={() => navigateFromProfileMenu('/my-barbershop')}>
                            <span className="profile-menu-icon" style={{ display: 'flex', alignItems: 'center' }}><StorefrontIcon fontSize="small" /></span>
                            <span>My Barbershop</span>
                        </button>
                        <button type="button" className="profile-menu-item" onClick={() => navigateFromProfileMenu('/settings')}>
                            <span className="profile-menu-icon" style={{ display: 'flex', alignItems: 'center' }}><SettingsIcon fontSize="small" /></span>
                            <span>Settings</span>
                        </button>
                        <div style={{ borderTop: '1px solid #eee', margin: '5px 0' }}></div>
                        <button type="button" className="profile-menu-item logout" onClick={handleLogout}>
                            <span className="profile-menu-icon" style={{ display: 'flex', alignItems: 'center' }}><LogoutIcon fontSize="small" /></span>
                            <span>Log Out</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;