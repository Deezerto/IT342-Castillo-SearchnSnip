import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../javascript/Navbar';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const fallbackShopImage = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

const Favorites = () => {
    const [displayName, setDisplayName] = useState('Loading...');
    const [barbers, setBarbers] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        const loadData = async () => {
            try {
                // Load User
                const userRes = await fetch('http://localhost:8080/api/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const user = await userRes.json();
                    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
                    setDisplayName(fullName || user.email || 'User');
                } else {
                    setDisplayName('User');
                }

                // Load Shops
                const shopsRes = await fetch('http://localhost:8080/api/shops', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let allShops = [];
                if (shopsRes.ok) {
                    allShops = await shopsRes.json();
                }

                // Load Favorites
                const favRes = await fetch('http://localhost:8080/api/shops/favorites', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                let favIds = [];
                if (favRes.ok) {
                    favIds = await favRes.json();
                    setFavorites(favIds);
                }

                const normalizedShops = (Array.isArray(allShops) ? allShops : [])
                    .map((shop) => ({
                    id: shop.shopId,
                    name: shop.name || 'Unnamed Barbershop',
                    address: shop.address || 'No address provided',
                    image: Array.isArray(shop.showcaseImages) && shop.showcaseImages.length > 0
                        ? shop.showcaseImages[0]
                        : fallbackShopImage,
                    originalShop: shop
                }));

                setBarbers(normalizedShops.filter(shop => favIds.includes(shop.id)));
                setLoading(false);
            } catch (error) {
                console.error("Error loading favorites", error);
                setLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const toggleFavorite = async (e, barberId) => {
        e.stopPropagation();
        
        // Optimistic update
        setFavorites(prev => prev.filter(id => id !== barberId));
        setBarbers(prev => prev.filter(shop => shop.id !== barberId));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/shops/favorites/${barberId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to toggle favorite');
            }
        } catch (error) {
            console.error("Error toggling favorite", error);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fb', fontFamily: 'Arial, sans-serif' }}>
            <Navbar displayName={displayName} activePage="favorites" />
            
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ color: '#1a1a1a', marginBottom: '10px', fontSize: '2rem' }}>Your Favorites</h1>
                <p style={{ color: '#666', marginBottom: '30px' }}>Barbershops you've saved for easy access.</p>

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Loading favorites...</div>
                ) : barbers.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <StarBorderIcon style={{ fontSize: '60px', color: '#ccc', marginBottom: '20px' }} />
                        <h3 style={{ margin: '0 0 10px', color: '#333' }}>No favorites yet</h3>
                        <p style={{ color: '#777', margin: 0 }}>Click the star icon on any barbershop to add it here.</p>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            style={{ marginTop: '20px', background: '#2b52ff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Explore Barbershops
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {barbers.map(barber => (
                            <div 
                                key={barber.id} 
                                style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                                onClick={() => navigate('/booking', { state: { shop: barber.originalShop } })}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                            >
                                <div style={{ height: '200px', backgroundImage: `url(${barber.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                                    <div 
                                        style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.95)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', color: '#fbbc04' }}
                                        onClick={(e) => toggleFavorite(e, barber.id)}
                                        title="Remove from favorites"
                                    >
                                        <StarIcon fontSize="small" />
                                    </div>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#1a1a1a' }}>{barber.name}</h4>
                                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', lineHeight: '1.4' }}>
                                        <span style={{ marginRight: '6px', color: '#888' }}>📍</span> 
                                        {barber.address}
                                    </div>
                                    <button style={{ width: '100%', background: '#eef2ff', color: '#2b52ff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s ease' }}
                                        onMouseOver={(e) => e.target.style.background = '#e0e7ff'}
                                        onMouseOut={(e) => e.target.style.background = '#eef2ff'}
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
