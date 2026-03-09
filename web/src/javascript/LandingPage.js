import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <main className="landing-page">
      <header className="top-nav">
        <div className="brand-lockup">
          <span className="brand-mark">✂</span>
          <span className="brand-text">SNIPNSKETCH</span>
        </div>
        <nav className="top-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#app">App</a>
          <a href="#reviews">Reviews</a>
          <button type="button" onClick={handleGoToLogin}>SIGN IN</button>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="hero-badge">NOW AVAILABLE IN NEW YORK</p>
          <h1>
            Elevate Your <span>Grooming</span>
            <br />
            Experience
          </h1>
          <p className="hero-subtext">
            The modern way to find professional barbers, book appointments in seconds,
            and ensure you always look your absolute best.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-btn" onClick={handleGoToLogin}>Book Your Cut</button>
            <button type="button" className="secondary-btn">Learn More</button>
          </div>
        </div>
        <div className="hero-visual" aria-label="Barber shop showcase image" role="img">
          <div className="hero-photo-card">
            <div className="chair-scene" />
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <p className="section-kicker">OUR FEATURES</p>
        <h2>Everything You Need for the Perfect Cut</h2>
        <p className="section-subtext">
          BarberLink simplifies your grooming routine with powerful features designed for the modern gentleman.
        </p>

        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon">⌖</div>
            <h3>Find Nearby Shops</h3>
            <p>Discover top-rated barbershops in your local area with integrated GPS search and real-time availability.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">✂</div>
            <h3>Book Services</h3>
            <p>Schedule your next haircut, beard trim, or hot towel shave in seconds. No more waiting on hold.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">♡</div>
            <h3>Manage Favorites</h3>
            <p>Save your preferred barbers and styles for quick one-tap rebooking and personalized recommendations.</p>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="how-section">
        <div className="how-steps">
          <h2>How It Works</h2>
          <div className="step-item">
            <span>1</span>
            <div>
              <h4>Discover</h4>
              <p>Search for the best local barbers based on your style preferences and exact location.</p>
            </div>
          </div>
          <div className="step-item">
            <span>2</span>
            <div>
              <h4>Schedule</h4>
              <p>Select your service and pick a time slot that fits your busy lifestyle from the barber&apos;s live calendar.</p>
            </div>
          </div>
          <div className="step-item">
            <span>3</span>
            <div>
              <h4>Enjoy</h4>
              <p>Arrive at the shop and get a premium grooming experience. Pay and tip securely through the app.</p>
            </div>
          </div>
        </div>

        <div className="how-art" aria-label="How it works card preview" role="img">
          <div className="how-glow" />
        </div>
      </section>

      <section id="app" className="app-section">
        <div className="phones-showcase" aria-label="Mobile app previews" role="img">
          <div className="phone-card phone-left" />
          <div className="phone-card phone-right" />
        </div>
        <div className="app-copy">
          <h2>
            Your Barber Shop
            <br />
            <span>In Your Pocket</span>
          </h2>
          <p>
            Experience seamless grooming management. From finding the right artisan to hassle-free payments,
            the BarberLink app is designed for the modern user.
          </p>
          <ul>
            <li>Instant booking confirmations</li>
            <li>Secure in-app digital payments</li>
            <li>Appointment reminders and history</li>
          </ul>
          <div className="store-buttons">
            <button type="button" className="store-btn">Google Play</button>
            <button type="button" className="store-btn">App Store</button>
          </div>
        </div>
      </section>

      <section id="reviews" className="reviews-section">
        <h2>Loved by Thousands</h2>
        <p className="rating">4.9 / 5 Average Rating</p>

        <div className="review-grid">
          <article className="review-card">
            <p>&quot;Finally an app that works! I found my current barber through BarberLink and I haven&apos;t looked back.&quot;</p>
            <h4>James Dalton</h4>
            <span>Monthly User</span>
          </article>
          <article className="review-card">
            <p>&quot;As someone with a busy schedule, the ability to see live availability and book instantly is a lifesaver.&quot;</p>
            <h4>Marcus Wright</h4>
            <span>Business Professional</span>
          </article>
          <article className="review-card">
            <p>&quot;The app interface is beautiful and intuitive. I love being able to save my favorite styles and show them to my barber.&quot;</p>
            <h4>Sarah Lewis</h4>
            <span>App Enthusiast</span>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Look Your Best?</h2>
        <p>Join over 50,000+ users who have simplified their grooming routine with BarberLink.</p>
        <button type="button">Start Booking Now</button>
      </section>

      <footer className="site-footer">
        <div>
          <h3>BARBERLINK</h3>
          <p>Providing a premium platform for grooming professionals and clients to connect, schedule, and celebrate the art of the haircut.</p>
        </div>
        <div>
          <h4>PLATFORM</h4>
          <p>Find a Barber</p>
          <p>Join as a Shop</p>
          <p>Services</p>
          <p>Mobile App</p>
        </div>
        <div>
          <h4>SUPPORT</h4>
          <p>Help Center</p>
          <p>Privacy Policy</p>
          <p>Terms of Service</p>
          <p>Cookie Policy</p>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
