import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        }),
      });

      if (response.ok) {
        setShowConfirmation(true);
      } else {
        setError('Failed to create account. Email might already be in use.');
      }
    } catch (err) {
      setError('An error occurred during registration. Is the backend running?');
    }
  };

  if (showConfirmation) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <CheckCircleOutlineIcon style={{ fontSize: 80, color: 'green', marginBottom: '20px' }} />
          <h2 style={{ color: 'black', marginBottom: '20px' }}>Account Created!</h2>
          <p style={{ color: 'gray', marginBottom: '30px' }}>Your account has been successfully created. Welcome to Searchn'Snip!</p>
          <button 
            className="auth-btn primary" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/login" className="back-arrow">&larr;</Link>
          <span className="brand">SEARCHN'SNIP</span>
        </div>
        <img src="/images/logo.png" alt="Barber Logo" className="auth-logo" />
        <h2 className="auth-title" style={{ color: 'black' }}>Create Account</h2>

        <form className="auth-form" onSubmit={handleRegister}>
          {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
          <label>Email</label>
          <input 
            type="email" 
            name="email"
            placeholder="Enter your email" 
            className="plain-input" 
            onChange={handleChange}
            maxLength={30}
            required 
          />

          <div className="auth-row split-inputs">
            <div className="half-width">
              <label>First Name</label>
              <input 
                type="text" 
                name="firstName"
                placeholder="First" 
                className="plain-input"
                onChange={handleChange}
                maxLength={35}
                required 
              />
            </div>
            <div className="half-width">
              <label>Last Name</label>
              <input 
                type="text" 
                name="lastName"
                placeholder="Last" 
                className="plain-input" 
                onChange={handleChange}
                maxLength={30}
                required 
              />
            </div>
          </div>

          <label>Password</label>
          <div className="input-group">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              placeholder="Create a password" 
              onChange={handleChange}
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

          <label>Confirm Password</label>
          <div className="input-group">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              name="confirmPassword"
              placeholder="Re-enter password" 
              onChange={handleChange}
              maxLength={30}
              required 
            />
            <span 
              className="input-icon eye" 
              style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </span>
          </div>

          <button className="auth-btn primary" type="submit">Submit</button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="login-link">Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
