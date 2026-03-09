import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        window.alert('Logged in successfully');
        navigate('/dashboard'); // redirect back to home page on success
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred while logging in. Is the backend running?');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="back-arrow">&larr;</Link>
          <span className="brand">SNIP'N SKETCH</span>
        </div>
        <img src="/barber-logo.png" alt="Barber Logo" className="auth-logo" />
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-desc">Find the best cuts near you. Please sign in to continue.</p>

        <form className="auth-form" onSubmit={handleLogin}>
          {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
          <label>Email Address</label>
          <div className="input-group">
            <span className="input-icon">&#9993;</span>
            <input 
              type="email" 
              placeholder="john@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="auth-row">
            <label>Password</label>
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>
          <div className="input-group">
            <span className="input-icon">&#128274;</span>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <span className="input-icon eye">&#128065;</span>
          </div>

          <button className="auth-btn primary" type="submit">
            Log In <span className="login-arrow">&#8627;</span>
          </button>
        </form>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button className="auth-btn google" type="button">
          <img src="/google-logo.png" alt="Google" className="google-icon" />
          Sign in with Google
        </button>

        <div className="auth-footer">
          Don't have an account? <Link to="/register" className="register-link">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
