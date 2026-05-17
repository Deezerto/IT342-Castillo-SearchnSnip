import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import Navbar from './Navbar';
import '../css/BarbershopUpload.css';

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
    const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: '', photoPreview: null });
    const [showcaseImages, setShowcaseImages] = useState([]);
    
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
                            duration: s.duration,
                            price: s.price,
                            description: s.description,
                            photo: s.photo
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

    const handleShowcaseUpload = (e) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    setShowcaseImages(prev => {
                        const combined = [...prev, reader.result];
                        return combined.slice(0, 4); // Keep maximum 4 images
                    });
                };
            });
        }
    };

    const handleServicePhotoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.readAsDataURL(e.target.files[0]);
            reader.onload = () => {
                setNewService({ ...newService, photoPreview: reader.result });
            };
        }
    };

    const addService = () => {
        if (!newService.name || !newService.price || !newService.duration) return;
        
        setServices([
            ...services, 
            { 
                id: Date.now(), 
                name: newService.name.toUpperCase(), 
                duration: newService.duration.toUpperCase(), 
                price: `₱ ${newService.price}`,
                description: newService.description,
                photo: newService.photoPreview
            }
        ]);
        
        setNewService({ name: '', description: '', price: '', duration: '', photoPreview: null });
        setServiceModalOpen(false);
    };

    const removeService = (id) => {
        setServices(services.filter(s => s.id !== id));
    };

    const handleEstablishBarbershop = async () => {
        if (!name || !address || !coordinates) {
            alert('Please provide a name, address, and select a location on the map.');
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
                duration: s.duration,
                photo: s.photo
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
                alert(`Barbershop successfully ${isEditMode ? 'updated' : 'established'}!`);
                navigate('/dashboard'); // or to another management page if you build one
            } else {
                console.error(`Failed to ${isEditMode ? 'update' : 'establish'} barbershop`, await response.text());
                alert(`Failed to ${isEditMode ? 'update' : 'establish'} barbershop. Please try again.`);
            }
        } catch (error) {
            console.error("Error connecting to server:", error);
            alert('Error connecting to server. Please try again later.');
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
                                    <span style={{ color: '#e53935' }}>✂</span> IDENTITY
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
                                    <label>PRIMARY LOCATION</label>
                                    {isLoaded ? (
                                        <Autocomplete
                                            onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                                            onPlaceChanged={onPlaceChanged}
                                        >
                                            <input 
                                                type="text" 
                                                placeholder="STREET ADDRESS, CITY, STATE" 
                                                value={address} 
                                                onChange={(e) => setAddress(e.target.value)} 
                                            />
                                        </Autocomplete>
                                    ) : (
                                        <input 
                                            type="text" 
                                            placeholder="STREET ADDRESS, CITY, STATE" 
                                            value={address} 
                                            onChange={(e) => setAddress(e.target.value)} 
                                        />
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                        <button type="button" className="choose-map-btn" onClick={() => setMapModalOpen(true)}>
                                            <span style={{ color: '#007bff' }}>📍</span> Choose on Map
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="setup-card">
                                <div className="card-header-flex">
                                    <h3 className="card-title" style={{ color: '#000b2b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '800' }}>
                                        <span style={{ color: '#e53935' }}>💈</span> GROOMING SERVICES
                                    </h3>
                                    <button type="button" className="add-service-btn" onClick={() => setServiceModalOpen(true)}>+ ADD NEW SERVICE</button>
                                </div>
                                <div className="services-list">
                                    {services.map(service => (
                                        <div key={service.id} className="service-item">
                                            <div className="service-icon" style={{ backgroundImage: service.photo ? `url(${service.photo})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', fontSize: service.photo ? '0' : '20px' }}>⏱</div>
                                            <div className="service-details">
                                                <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#000b2b', fontWeight: '800' }}>{service.name}</h4>
                                                <p style={{ margin: 0, fontSize: '11px', color: '#777', textTransform: 'uppercase', fontWeight: '600' }}>{service.duration} • {service.price}</p>
                                            </div>
                                            <button type="button" className="delete-btn" onClick={() => removeService(service.id)}>🗑</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="establish-sidebar">
                            <div className="setup-card showcase-card">
                                <h3 className="card-title" style={{ color: '#000b2b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '800' }}>
                                    <span style={{ color: '#e53935' }}>🖼</span> SHOWCASE
                                </h3>
                                <div className="upload-box" onClick={() => showcaseInputRef.current.click()}>
                                    <span className="upload-icon" style={{ fontSize: '24px', color: '#90add3' }}>☁</span>
                                    <h4 style={{ margin: '10px 0 5px 0', color: '#000b2b', fontSize: '12px', fontWeight: '800' }}>UPLOAD PICTURES</h4>
                                    <p style={{ margin: 0, fontSize: '9px', color: '#777', fontWeight: 'bold' }}>HIGH-RES INTERIOR (JPG, PNG)</p>
                                    <input type="file" multiple accept="image/png, image/jpeg" style={{ display: 'none' }} ref={showcaseInputRef} onChange={handleShowcaseUpload} />
                                </div>
                                <div className="image-grid">
                                    {[0, 1, 2, 3].map(index => (
                                        <div key={index} className={`image-cell ${!showcaseImages[index] ? 'empty' : ''}`}>
                                            {showcaseImages[index] ? <img src={showcaseImages[index]} alt={`Shop ${index+1}`} /> : '+'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="button" className="action-btn primary-action" onClick={handleEstablishBarbershop}>{isEditMode ? 'UPDATE BARBERSHOP' : 'ESTABLISH BARBERSHOP'}</button>
                            <button type="button" className="action-btn secondary-action">SAVE AS DRAFT</button>
                            
                            <div className="disclaimer-box">
                                <span className="info-icon" style={{ color: '#e53935' }}>ⓘ</span>
                                <p>ENSURE THAT THE BARBERSHOP YOU UPLOAD IS ACCURATE. FAKE BARBERSHOPS WILL BE SUBJECT TO BANS.</p>
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
                                        <div style={{ fontSize: '70px', color: '#f5f5f5', lineHeight: '0.8', marginRight: '-20px', marginTop: '-10px' }}>✂</div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        <div>
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label>SERVICE NAME</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g., Luxury Shave" 
                                                    value={newService.name}
                                                    onChange={e => setNewService({...newService, name: e.target.value})}
                                                    style={{ border: 'none', backgroundColor: '#f0f4f8', borderRadius: '0' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>DESCRIPTION</label>
                                                <textarea 
                                                    placeholder="A deep cleansing facial with a hot towel shave..." 
                                                    value={newService.description}
                                                    onChange={e => setNewService({...newService, description: e.target.value})}
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
                                                            <span style={{ fontSize: '24px', color: '#000b2b', marginBottom: '5px' }}>📷</span>
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
                                                            onChange={e => setNewService({...newService, price: e.target.value})}
                                                            style={{ border: 'none', backgroundColor: 'transparent', padding: '15px 5px' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>DURATION</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="30 mins" 
                                                        value={newService.duration}
                                                        onChange={e => setNewService({...newService, duration: e.target.value})}
                                                        style={{ border: 'none', backgroundColor: '#f0f4f8', borderRadius: '0' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                                        <button onClick={() => setServiceModalOpen(false)} style={{ background: 'none', border: 'none', color: '#e53935', fontWeight: '800', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer', padding: '10px 0' }}>CANCEL</button>
                                        <button onClick={addService} style={{ background: '#000b2b', color: 'white', border: 'none', padding: '15px 30px', fontWeight: '800', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' }}>ADD SERVICE</button>
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
                                    <button onClick={() => setMapModalOpen(false)} style={{ padding: '10px 20px', background: '#000b2b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>Confirm Location</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarbershopUpload;
