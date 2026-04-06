import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../css/Booking.css';

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const fallbackServices = [
    {
        id: 'signature-haircut',
        name: 'Signature Haircut',
        description: 'Precision cut, relaxing scalp massage, and professional styling finish.',
        duration: '45 min',
        price: 45,
        image: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=1200&q=80'
    },
    {
        id: 'luxury-hot-shave',
        name: 'Luxury Hot Shave',
        description: 'Straight razor shave with hot towels, pre-shave oil, and soothing balm.',
        duration: '30 min',
        price: 35,
        image: 'https://images.unsplash.com/photo-1635273051938-8f6f4a9f6be5?auto=format&fit=crop&w=1200&q=80'
    },
    {
        id: 'beard-sculpting',
        name: 'Beard Sculpting',
        description: 'Detailed shaping, line-up, and beard oil treatment for a sharp look.',
        duration: '20 min',
        price: 25,
        image: 'https://images.unsplash.com/photo-1593702288056-f5931f06ad6d?auto=format&fit=crop&w=1200&q=80'
    },
    {
        id: 'junior-cut',
        name: 'The Junior Cut',
        description: 'Styling for little gents under 12. Fun and comfortable experience.',
        duration: '30 min',
        price: 30,
        image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=1200&q=80'
    }
];

const parsePriceValue = (rawPrice) => {
    if (typeof rawPrice === 'number' && Number.isFinite(rawPrice)) {
        return rawPrice;
    }

    if (typeof rawPrice === 'string') {
        const normalized = rawPrice.replace(/[^\d.]/g, '');
        const parsed = Number.parseFloat(normalized);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    return 0;
};

const formatCurrency = (value) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(safeValue);
};

const buildCalendarCells = (activeMonth) => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < firstDayIndex; i += 1) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
};

const isSameDay = (left, right) => {
    if (!left || !right) {
        return false;
    }

    return left.getFullYear() === right.getFullYear()
        && left.getMonth() === right.getMonth()
        && left.getDate() === right.getDate();
};

const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Booking = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const selectedShop = location.state?.shop ?? null;
    const selectedShopId = selectedShop?.id ?? selectedShop?.shopId ?? null;

    const [displayName, setDisplayName] = useState('Loading...');
    const [services, setServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState(null);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('shop');
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [activeMonth, setActiveMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState(() => new Date());

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
                        Authorization: `Bearer ${token}`,
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

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        if (!selectedShopId) {
            setServices([]);
            setServicesLoading(false);
            setServicesError('No barbershop selected. Please return to Dashboard and choose a barbershop.');
            return;
        }

        const loadServices = async () => {
            setServicesLoading(true);
            setServicesError(null);

            try {
                const response = await fetch(`http://localhost:8080/api/shops/${selectedShopId}/services`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login', { replace: true });
                    return;
                }

                if (response.status === 404) {
                    setServices([]);
                    setServicesError('Selected barbershop was not found.');
                    return;
                }

                if (!response.ok) {
                    setServices([]);
                    setServicesError('Could not load services. Please try again.');
                    return;
                }

                const rawServices = await response.json();
                const normalizedServices = (Array.isArray(rawServices) ? rawServices : []).map((service, index) => ({
                    id: service.serviceId ?? `${selectedShopId}-service-${index}`,
                    name: service.name || `Service ${index + 1}`,
                    description: service.description || 'No description available.',
                    duration: service.duration || '30 min',
                    price: parsePriceValue(service.price),
                    image: service.photo || fallbackServices[index % fallbackServices.length].image
                }));

                setServices(normalizedServices);
            } catch (error) {
                setServices([]);
                setServicesError('Could not load services. Please try again.');
            } finally {
                setServicesLoading(false);
            }
        };

        loadServices();
    }, [navigate, selectedShopId]);

    useEffect(() => {
        setSelectedServiceIds((currentIds) => currentIds.filter((id) => services.some((service) => service.id === id)));
    }, [services]);

    const selectedServices = useMemo(
        () => services.filter((service) => selectedServiceIds.includes(service.id)),
        [services, selectedServiceIds]
    );

    const totalPrice = useMemo(
        () => selectedServices.reduce((sum, service) => sum + service.price, 0),
        [selectedServices]
    );

    const calendarCells = useMemo(() => buildCalendarCells(activeMonth), [activeMonth]);

    const activeMonthLabel = useMemo(
        () => activeMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        [activeMonth]
    );

    const toggleService = (serviceId) => {
        setSelectedServiceIds((currentIds) => {
            if (currentIds.includes(serviceId)) {
                return currentIds.filter((id) => id !== serviceId);
            }

            return [...currentIds, serviceId];
        });
    };

    const goToPreviousMonth = () => {
        setActiveMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setActiveMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const confirmBooking = async () => {
        if (selectedServices.length === 0) {
            return;
        }

        if (bookingSubmitting) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        if (!selectedShopId) {
            window.alert('No barbershop selected. Please return to Dashboard and choose a barbershop.');
            return;
        }

        const serviceIds = selectedServices
            .map((service) => Number(service.id))
            .filter((id) => Number.isFinite(id));

        if (serviceIds.length !== selectedServices.length) {
            window.alert('Some selected services are invalid. Please reselect services and try again.');
            return;
        }

        const selectedServiceNames = selectedServices.map((service) => service.name).join(', ');
        const dateLabel = selectedDate.toLocaleDateString('en-PH', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        setBookingSubmitting(true);

        try {
            const response = await fetch('http://localhost:8080/api/bookings', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shopId: Number(selectedShopId),
                    serviceIds,
                    appointmentDate: formatDateForApi(selectedDate)
                })
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                navigate('/login', { replace: true });
                return;
            }

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || 'Booking failed. Please try again.');
            }

            const booking = await response.json();
            const confirmedStatus = booking?.status || 'Active';
            const confirmedTotalPrice = Number.isFinite(booking?.totalPrice) ? booking.totalPrice : totalPrice;

            window.alert(
                `Booking confirmed (${confirmedStatus}) for ${selectedServiceNames} on ${dateLabel}. Total: ${formatCurrency(confirmedTotalPrice)}.`
            );

            navigate('/dashboard');
        } catch (error) {
            window.alert(error?.message || 'Booking failed. Please try again.');
        } finally {
            setBookingSubmitting(false);
        }
    };

    return (
        <div className="booking-page">
            <Navbar displayName={displayName} activePage="" />

            <main className="booking-main">
                <section className="booking-services-panel">
                    <header className="booking-services-header">
                        <h1>Choose Your Service</h1>
                        <p>Select one or more treatments for your visit.</p>
                        <h2>{selectedShop?.name || 'Your Selected Barbershop'}</h2>
                    </header>

                    <div className="booking-services-grid">
                        {servicesLoading && <p className="booking-services-feedback">Loading services...</p>}

                        {!servicesLoading && servicesError && (
                            <p className="booking-services-feedback error">{servicesError}</p>
                        )}

                        {!servicesLoading && !servicesError && services.length === 0 && (
                            <p className="booking-services-feedback">This shop has no services yet.</p>
                        )}

                        {!servicesLoading && !servicesError && services.map((service) => {
                            const isSelected = selectedServiceIds.includes(service.id);

                            return (
                                <article
                                    key={service.id}
                                    className={`booking-service-card ${isSelected ? 'selected' : ''}`}
                                >
                                    <div className="booking-service-image-wrap">
                                        <img src={service.image} alt={service.name} className="booking-service-image" />
                                        {isSelected && (
                                            <span className="booking-service-selected-badge">Selected</span>
                                        )}
                                    </div>

                                    <div className="booking-service-content">
                                        <div className="booking-service-title-row">
                                            <h3>{service.name}</h3>
                                            <span className="booking-service-price">{formatCurrency(service.price)}</span>
                                        </div>

                                        <p>{service.description}</p>
                                        <small>{service.duration}</small>

                                        <button
                                            type="button"
                                            className={`booking-service-btn ${isSelected ? 'added' : ''}`}
                                            onClick={() => toggleService(service.id)}
                                        >
                                            {isSelected ? 'Added' : 'Select Service'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <aside className="booking-summary-card">
                    <h3>Booking Summary</h3>

                    <div className="booking-summary-section">
                        <h4>Select Date</h4>

                        <div className="booking-month-nav">
                            <button type="button" onClick={goToPreviousMonth} aria-label="Go to previous month">
                                {'<'}
                            </button>
                            <span>{activeMonthLabel}</span>
                            <button type="button" onClick={goToNextMonth} aria-label="Go to next month">
                                {'>'}
                            </button>
                        </div>

                        <div className="booking-weekdays-row">
                            {weekdayLabels.map((weekday) => (
                                <span key={weekday}>{weekday}</span>
                            ))}
                        </div>

                        <div className="booking-days-grid">
                            {calendarCells.map((dateCell, index) => {
                                if (!dateCell) {
                                    return <span key={`empty-${index}`} className="empty-day" />;
                                }

                                const selected = isSameDay(dateCell, selectedDate);

                                return (
                                    <button
                                        type="button"
                                        key={dateCell.toISOString()}
                                        className={`booking-day-btn ${selected ? 'selected' : ''}`}
                                        onClick={() => setSelectedDate(dateCell)}
                                    >
                                        {dateCell.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="booking-summary-section">
                        {selectedServices.length === 0 ? (
                            <p className="booking-empty-summary">No services selected yet.</p>
                        ) : (
                            <div className="booking-selected-services">
                                {selectedServices.map((service) => (
                                    <div key={`summary-${service.id}`} className="booking-summary-row">
                                        <span>{service.name}</span>
                                        <strong>{formatCurrency(service.price)}</strong>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="booking-total-row">
                            <span>Total</span>
                            <strong>{formatCurrency(totalPrice)}</strong>
                        </div>
                    </div>

                    <div className="booking-summary-section">
                        <h4>Payment Method</h4>

                        <div className="booking-payment-methods">
                            <button
                                type="button"
                                className={paymentMethod === 'shop' ? 'active' : ''}
                                onClick={() => setPaymentMethod('shop')}
                            >
                                Pay at Shop
                            </button>
                            <button
                                type="button"
                                className={paymentMethod === 'now' ? 'active' : ''}
                                onClick={() => setPaymentMethod('now')}
                            >
                                Pay Now
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="booking-confirm-btn"
                        onClick={confirmBooking}
                        disabled={selectedServices.length === 0 || servicesLoading || !!servicesError || bookingSubmitting}
                    >
                        {bookingSubmitting ? 'Confirming Booking...' : 'Confirm Booking ->'}
                    </button>
                </aside>
            </main>
        </div>
    );
};

export default Booking;
