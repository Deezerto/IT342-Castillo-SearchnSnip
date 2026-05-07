import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        navigate('/dashboard'); // redirect back to home page on success
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred while logging in. Is the backend running?');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('http://localhost:8080/api/users/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError('Google login failed on the server.');
      }
    } catch (err) {
      setError('An error occurred during Google login. Is the backend running?');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="back-arrow">&larr;</Link>
          <span className="brand">SEARCHN'SNIP</span>
        </div>
        <img src="/images/logo.png" alt="Barber Logo" className="auth-logo" />
        <h3 className="auth-title">Welcome Back</h3>
        <p className="auth-desc">Find the best cuts near you. Please sign in to continue.</p>

        <form className="auth-form" onSubmit={handleLogin}>
          {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
          <label>Email Address</label>
          <div className="input-group">
            <span className="input-icon" style={{ display: "flex", alignItems: "center" }}><EmailIcon fontSize="small" /></span>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={30}
              required 
            />
          </div>

          <div className="auth-row">
            <label>Password</label>
          </div>
          <div className="input-group">
            <span className="input-icon" style={{ display: "flex", alignItems: "center" }}><LockIcon fontSize="small" /></span>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={30}
              required 
            />
            <span 
              className="input-icon eye" 
              style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </span>
          </div>
          <div style={{ textAlign: "right", marginTop: "0.25rem", marginBottom: "1rem" }}>
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>

          <button className="auth-btn primary" type="submit">
            Log In
          </button>
        </form>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
          />
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register" className="register-link">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
