import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import Navbar from './Navbar';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import '../css/BarbershopUpload.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const libraries = ['places'];

const mapContainerStyle = {
    width: '100%',
    height: '400px'
};

const defaultCenter = {
    lat: 10.3157,
    lng: 123.8854
};

const BarbershopUpload = () => {
    const [displayName, setDisplayName] = useState('Loading...');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState(null);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [newService, setNewService] = useState({ name: '', description: '', price: '', photoPreview: null, category: 'HAIRCUT' });
    const [showcaseImages, setShowcaseImages] = useState([]);
    
    const [categories, setCategories] = useState(['HAIRCUT']);
    const [activeCategory, setActiveCategory] = useState('HAIRCUT');
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    const [discardModalOpen, setDiscardModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const showToast = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const navigate = useNavigate();
    const location = useLocation();
    const shopData = location.state?.shopData;
    const isEditMode = !!shopData;

    const autocompleteRef = useRef(null);
    const showcaseInputRef = useRef(null);
    const servicePhotoInputRef = useRef(null);

    const [services, setServices] = useState([]);

    useEffect(() => {
        if (shopData) {
            setName(shopData.name || '');
            setAddress(shopData.location || '');
            if (shopData.latitude && shopData.longitude) {
                setCoordinates({ lat: shopData.latitude, lng: shopData.longitude });
            }
            if (shopData.showcaseImages) {
                setShowcaseImages(shopData.showcaseImages);
            }

            const fetchServices = async () => {
                const token = localStorage.getItem('token');
                if (!token) return;
                try {
                    const response = await fetch(`http://localhost:8080/api/shops/${shopData.shopId}/services`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const mappedServices = data.map(s => ({
                            id: s.serviceId || Date.now() + Math.random(),
                            name: s.name,
                            price: s.price,
                            description: s.description,
                            photo: s.photo,
                            category: 'HAIRCUT'
                        }));
                        setServices(mappedServices);
                    }
                } catch (err) {
                    console.error("Error fetching services", err);
                }
            };

            fetchServices();
        }
    }, [shopData]);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: libraries
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

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                setAddress(place.formatted_address || place.name);
                setCoordinates({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            }
        }
    };

    const onMapClick = (e) => {
        setCoordinates({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        });

        // Reverse geocoding could be added here to update the 'address' text field
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                setAddress(results[0].formatted_address);
            }
        });
    };

    const handleShowcaseUpload = async (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            showToast('Uploading images to bucket...', 'success');
            
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `showcases/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('barbershop-images')
                    .upload(filePath, file);

                if (uploadError) {
                    showToast('Error uploading image to bucket', 'error');
                    console.error("Upload error:", uploadError);
                    continue;
                }

                const { data } = supabase.storage
                    .from('barbershop-images')
                    .getPublicUrl(filePath);

                setShowcaseImages(prev => {
                    const combined = [...prev, data.publicUrl];
                    return combined.slice(0, 4); // Keep maximum 4 images
                });
            }
        }
    };

    const handleServicePhotoUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            showToast('Uploading service photo...', 'success');
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `services/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('barbershop-images')
                .upload(filePath, file);

            if (uploadError) {
                showToast('Error uploading service image', 'error');
                console.error("Upload error:", uploadError);
                return;
            }

            const { data } = supabase.storage
                .from('barbershop-images')
                .getPublicUrl(filePath);

            setNewService({ ...newService, photoPreview: data.publicUrl });
        }
    };

    const addService = () => {
        if (!newService.name || !newService.price) return;

        setServices([
            ...services,
            {
                id: Date.now(),
                name: newService.name.toUpperCase(),
                price: `₱ ${newService.price}`,
                description: newService.description,
                photo: newService.photoPreview,
                category: activeCategory
            }
        ]);

        setNewService({ name: '', description: '', price: '', photoPreview: null, category: activeCategory });
        setServiceModalOpen(false);
    };

    const addCategory = () => {
        if (newCategoryName.trim() && !categories.includes(newCategoryName.toUpperCase())) {
            setCategories([...categories, newCategoryName.toUpperCase()]);
            setActiveCategory(newCategoryName.toUpperCase());
        }
        setNewCategoryName('');
        setCategoryModalOpen(false);
    };

    const handleDiscardServices = () => {
        setServices([]);
        setDiscardModalOpen(false);
    };

    const handleSaveServices = () => {
        showToast('System successfully saved these batch of services.', 'success');
    };

    const removeService = (id) => {
        setServices(services.filter(s => s.id !== id));
    };

    const handleEstablishBarbershop = async () => {
        if (!name || !address || !coordinates) {
            showToast('Please provide a name, address, and select a location on the map.', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const payload = {
            name: name,
            address: address,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            showcaseImages: showcaseImages,
            services: services.map(s => ({
                serviceId: (typeof s.id === 'number' && s.id < 1000000000000) ? s.id : null,
                name: s.name,
                description: s.description,
                price: s.price,
                photo: s.photo,
                category: s.category
            }))
        };

        try {
            const url = isEditMode ? `http://localhost:8080/api/shops/${shopData.shopId}` : 'http://localhost:8080/api/shops';
            const method = isEditMode ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast(`Barbershop successfully ${isEditMode ? 'updated' : 'established'}!`, 'success');
                setTimeout(() => navigate('/dashboard'), 3000);
            } else {
                console.error(`Failed to ${isEditMode ? 'update' : 'establish'} barbershop`, await response.text());
                showToast(`Failed to ${isEditMode ? 'update' : 'establish'} barbershop. Please try again.`, 'error');
            }
        } catch (error) {
            console.error("Error connecting to server:", error);
            showToast('Error connecting to server. Please try again later.', 'error');
        }
    };

    return (
        <div className="upload-container">
            <Navbar displayName={displayName} activePage="" />
            <div className="upload-content">
                <div className="establish-container">
                    <div className="establish-header">
                        <h1 style={{ color: '#000b2b', fontSize: '32px', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '900' }}>{isEditMode ? 'UPDATE BARBERSHOP' : 'ESTABLISH NEW BARBERSHOP'}</h1>
                        <p style={{ color: '#6fa0b0', margin: 0, fontSize: '16px' }}>{isEditMode ? 'Manage the identity and services of your premium grooming destination.' : 'Define the identity and services of your premium grooming destination.'}</p>
                    </div>
                    <div className="establish-grid">
                        <div className="establish-main">
                            <div className="setup-card">
                                <h3 className="card-title" style={{ color: '#000b2b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '800' }}>
                                    <ContentCutIcon style={{ color: '#e53935', fontSize: '20px' }} /> IDENTITY
                                </h3>
                                <div className="form-group">
                                    <label>BARBERSHOP NAME</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. THE GILDED BLADE"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isEditMode}
                                        style={isEditMode ? { backgroundColor: '#f0f0f0', color: '#888', cursor: 'not-allowed' } : {}}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>LOCATION</label>
                                    <input
                                        type="text"
                                        placeholder="CHOOSE LOCATION ON MAP"
                                        value={address}
                                        readOnly
                                        onClick={() => setMapModalOpen(true)}
                                        style={{ cursor: 'pointer', backgroundColor: '#f0f4f8', color: '#555' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                        <button type="button" className="choose-map-btn" onClick={() => setMapModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <LocationOnOutlinedIcon style={{ color: '#007bff', fontSize: '18px' }} /> Choose on Map
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="setup-card" style={{ padding: '40px', backgroundColor: '#fafbfc' }}>
                                <h1 style={{ color: '#000b2b', fontWeight: '900', fontSize: '28px', marginTop: 0, marginBottom: '30px', textTransform: 'uppercase' }}>MANAGE SERVICES</h1>
                                
                                <h4 style={{ color: '#888', fontSize: '10px', letterSpacing: '1px', fontWeight: '800', marginBottom: '15px' }}>CATEGORIES</h4>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat} 
                                            onClick={() => setActiveCategory(cat)}
                                            style={{ 
                                                padding: '12px 25px', 
                                                backgroundColor: activeCategory === cat ? '#000b2b' : '#fff', 
                                                color: activeCategory === cat ? '#fff' : '#000b2b',
                                                border: `1px solid ${activeCategory === cat ? '#000b2b' : '#e0e0e0'}`,
                                                fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
                                            }}>
                                            {cat}
                                            {activeCategory === cat && <span style={{ backgroundColor: '#2196F3', color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '10px' }}>{services.filter(s => s.category === cat).length}</span>}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => setCategoryModalOpen(true)}
                                        style={{ 
                                            padding: '12px 25px', backgroundColor: 'transparent', color: '#e53935', 
                                            border: '1px dashed #e53935', fontWeight: '800', fontSize: '12px', cursor: 'pointer' 
                                        }}>
                                        + ADD CATEGORY
                                    </button>
                                </div>

                                <h2 style={{ color: '#000b2b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: '900', marginBottom: '20px' }}>
                                    <ContentCutIcon style={{ color: '#e53935' }} /> {activeCategory} SERVICES
                                </h2>

                                <div className="services-list">
                                    {services.filter(s => s.category === activeCategory).map(service => (
                                        <div key={service.id} className="service-item" style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderLeft: '4px solid #000b2b', padding: '15px', display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                                            <div style={{ width: '60px', height: '60px', backgroundColor: '#f0f0f0', backgroundImage: service.photo ? `url(${service.photo})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', marginRight: '20px' }}></div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#000b2b', fontWeight: '900', textTransform: 'uppercase' }}>{service.name}</h4>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{service.description}</p>
                                            </div>
                                            <div style={{ textAlign: 'right', marginRight: '20px' }}>
                                                <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#888', fontWeight: '800' }}>PRICE</p>
                                                <p style={{ margin: 0, fontSize: '16px', color: '#000b2b', fontWeight: '900' }}>{service.price}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '10px', cursor: 'pointer' }}>✎</button>
                                                <button onClick={() => removeService(service.id)} style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', padding: '10px', cursor: 'pointer' }}>🗑</button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => setServiceModalOpen(true)}
                                        style={{ width: '100%', padding: '20px', background: 'transparent', border: '1px dashed #ccc', color: '#555', fontWeight: '800', fontSize: '12px', cursor: 'pointer', marginTop: '10px', letterSpacing: '1px' }}>
                                        + ADD {activeCategory} SERVICE
                                    </button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                                    <button onClick={() => setDiscardModalOpen(true)} style={{ background: 'transparent', color: '#555', border: '1px solid #ccc', padding: '12px 25px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}>Discard Service</button>
                                    <button onClick={handleSaveServices} style={{ background: '#2196F3', color: 'white', border: 'none', padding: '12px 25px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}>Save Service</button>
                                </div>
                            </div>
                        </div>

                        <div className="establish-sidebar">
                            <div className="setup-card showcase-card">
                                <h3 className="card-title" style={{ color: '#000b2b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '800' }}>
                                    <AddPhotoAlternateOutlinedIcon style={{ color: '#e53935', fontSize: '20px' }} /> SHOWCASE
                                </h3>
                                <div className="upload-box" onClick={() => showcaseInputRef.current.click()}>
                                    <AddIcon style={{ fontSize: '28px', color: '#90add3' }} />
                                    <h4 style={{ margin: '10px 0 5px 0', color: '#000b2b', fontSize: '12px', fontWeight: '800' }}>UPLOAD PICTURES</h4>
                                    <p style={{ margin: 0, fontSize: '9px', color: '#777', fontWeight: 'bold' }}>HIGH-RES INTERIOR (JPG, PNG)</p>
                                    <input type="file" multiple accept="image/png, image/jpeg" style={{ display: 'none' }} ref={showcaseInputRef} onChange={handleShowcaseUpload} />
                                </div>
                                <div className="image-grid">
                                    {[0, 1, 2, 3].map(index => (
                                        <div key={index} className={`image-cell ${!showcaseImages[index] ? 'empty' : ''}`}>
                                            {showcaseImages[index] ? <img src={showcaseImages[index]} alt={`Shop ${index + 1}`} /> : '+'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="button" className="action-btn primary-action" onClick={handleEstablishBarbershop}>{isEditMode ? 'UPDATE BARBERSHOP' : 'ESTABLISH BARBERSHOP'}</button>
                            <button type="button" className="action-btn secondary-action">SAVE AS DRAFT</button>

                            <div className="disclaimer-box" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <InfoOutlinedIcon style={{ color: '#e53935', fontSize: '20px' }} />
                                <p style={{ margin: 0 }}>ENSURE THAT THE BARBERSHOP YOU UPLOAD IS ACCURATE. FAKE BARBERSHOPS WILL BE SUBJECT TO BANS.</p>
                            </div>
                        </div>
                    </div>

                    {serviceModalOpen && (
                        <div className="map-modal-overlay" onClick={() => setServiceModalOpen(false)}>
                            <div className="service-modal" onClick={e => e.stopPropagation()}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div>
                                            <span style={{ fontSize: '10px', color: '#e53935', fontWeight: '800', letterSpacing: '1px' }}>NEW LISTING</span>
                                            <h2 style={{ margin: 0, color: '#000b2b', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>ADD NEW SERVICE</h2>
                                        </div>
                                        <ContentCutIcon style={{ fontSize: '70px', color: '#f5f5f5', marginRight: '-20px', marginTop: '-10px' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        <div>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label>SERVICE NAME</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Luxury Shave"
                                                    value={newService.name}
                                                    onChange={e => setNewService({ ...newService, name: e.target.value })}
                                                    style={{ border: 'none', backgroundColor: '#f0f4f8', borderRadius: '0' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>DESCRIPTION</label>
                                                <textarea
                                                    placeholder="A deep cleansing facial with a hot towel shave..."
                                                    value={newService.description}
                                                    onChange={e => setNewService({ ...newService, description: e.target.value })}
                                                    style={{ width: '100%', padding: '15px', border: 'none', backgroundColor: '#f0f4f8', borderRadius: '0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', height: '120px', resize: 'none', fontFamily: 'inherit' }}
                                                ></textarea>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label>SERVICE PHOTO</label>
                                                <div
                                                    style={{ height: '120px', backgroundColor: '#f0f4f8', border: '2px dashed #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundImage: newService.photoPreview ? `url(${newService.photoPreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                                                    onClick={() => servicePhotoInputRef.current.click()}
                                                >
                                                    {!newService.photoPreview && (
                                                        <>
                                                            <AddPhotoAlternateOutlinedIcon style={{ fontSize: '28px', color: '#000b2b', marginBottom: '5px' }} />
                                                            <span style={{ fontSize: '10px', color: '#777', fontWeight: 'bold' }}>DRAG PHOTO OR CLICK TO UPLOAD</span>
                                                        </>
                                                    )}
                                                    <input type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} ref={servicePhotoInputRef} onChange={handleServicePhotoUpload} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>PRICE</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f4f8', padding: '0 15px' }}>
                                                        <span style={{ fontWeight: 'bold', color: '#000b2b' }}>₱</span>
                                                        <input
                                                            type="text"
                                                            placeholder="0.00"
                                                            value={newService.price}
                                                            onChange={e => setNewService({ ...newService, price: e.target.value })}
                                                            style={{ border: 'none', backgroundColor: 'transparent', padding: '15px 5px' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                                        <button onClick={() => setServiceModalOpen(false)} style={{ background: 'none', border: 'none', color: '#e53935', fontWeight: '800', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', padding: '10px 0' }}>CANCEL</button>
                                        <button onClick={addService} style={{ background: '#2196F3', color: 'white', border: 'none', padding: '15px 30px', fontWeight: '800', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>ADD SERVICE</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mapModalOpen && (
                        <div className="map-modal-overlay" onClick={() => setMapModalOpen(false)}>
                            <div className="map-modal" onClick={e => e.stopPropagation()}>
                                <div className="map-modal-header" style={{ padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0 }}>Select Location</h3>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>Click on the map to drop a pin.</p>
                                </div>
                                {isLoaded && (
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={coordinates || defaultCenter}
                                        zoom={13}
                                        onClick={onMapClick}
                                    >
                                        {coordinates && <Marker position={coordinates} />}
                                    </GoogleMap>
                                )}
                                <div className="map-modal-footer" style={{ padding: '15px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', background: '#f9f9f9', gap: '10px' }}>
                                    <button onClick={() => setMapModalOpen(false)} style={{ padding: '10px 20px', background: 'white', color: '#333', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                                    <button onClick={() => setMapModalOpen(false)} style={{ padding: '10px 20px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>Confirm Location</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {categoryModalOpen && (
                        <div className="map-modal-overlay" onClick={() => setCategoryModalOpen(false)}>
                            <div className="map-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '30px' }}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#000b2b' }}>Add New Category</h3>
                                <input 
                                    type="text" 
                                    placeholder="e.g. SHAVE" 
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ccc', marginBottom: '20px', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button onClick={() => setCategoryModalOpen(false)} style={{ padding: '10px 20px', background: 'white', border: '1px solid #ccc', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                                    <button onClick={addCategory} style={{ padding: '10px 20px', background: '#2196F3', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Add Category</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {discardModalOpen && (
                        <div className="map-modal-overlay" onClick={() => setDiscardModalOpen(false)}>
                            <div className="map-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '30px', textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#e53935' }}>Discard Changes?</h3>
                                <p style={{ color: '#555', marginBottom: '25px' }}>Are you sure you want to discard these services? All unsaved services will be lost.</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                    <button onClick={() => setDiscardModalOpen(false)} style={{ padding: '10px 25px', background: 'white', border: '1px solid #ccc', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                                    <button onClick={handleDiscardServices} style={{ padding: '10px 25px', background: '#e53935', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Discard</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {toastMessage && (
                        <div style={{ position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', background: toastType === 'error' ? '#e53935' : '#4caf50', color: 'white', padding: '15px 30px', borderRadius: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 9999, fontWeight: 'bold' }}>
                            {toastMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarbershopUpload;
