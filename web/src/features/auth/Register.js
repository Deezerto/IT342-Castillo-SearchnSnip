import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { GoogleLogin } from '@react-oauth/google';
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

    const passwordVal = formData.password;
    const hasMinLength = passwordVal.length >= 8;
    const hasNumber = /\d/.test(passwordVal);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordVal);
    
    if (!hasMinLength || !hasNumber || !hasSpecialChar) {
      setError('Please ensure your password meets all strength requirements.');
      return;
    }

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
        // Auto-login after successful registration
        try {
          const loginResponse = await fetch('http://localhost:8080/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, password: formData.password }),
          });
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            localStorage.setItem('token', loginData.token);
          }
        } catch (loginErr) {
          // Silently fail — user can still log in manually from the confirmation screen
        }
        setShowConfirmation(true);
      } else {
        setError('Failed to create account. Email might already be in use.');
      }
    } catch (err) {
      setError('An error occurred during registration. Is the backend running?');
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
        setError('Google registration failed on the server.');
      }
    } catch (err) {
      setError('An error occurred during Google registration. Is the backend running?');
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

  const passwordVal = formData.password;
  const hasMinLength = passwordVal.length >= 8;
  const hasNumber = /\d/.test(passwordVal);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordVal);

  const strengthScore = [hasMinLength, hasNumber, hasSpecialChar].filter(Boolean).length;
  const progressPercent = passwordVal.length > 0 ? (strengthScore / 3) * 100 : 0;
  
  const getProgressColor = () => {
    if (strengthScore <= 2) return '#ffa500'; // orange
    return '#4caf50'; // green
  };

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

          <div style={{ marginTop: '5px', marginBottom: '15px' }}>
            <div style={{ height: '8px', width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: getProgressColor(), transition: 'width 0.3s ease, background-color 0.3s ease' }}></div>
            </div>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '0.85rem', textAlign: 'left' }}>
              <li style={{ color: hasMinLength ? '#008000' : 'red', marginBottom: '5px', transition: 'color 0.3s' }}>At least 8 characters</li>
              <li style={{ color: hasNumber ? '#008000' : 'red', marginBottom: '5px', transition: 'color 0.3s' }}>Contains a number</li>
              <li style={{ color: hasSpecialChar ? '#008000' : 'red', transition: 'color 0.3s' }}>Contains a special character</li>
            </ul>
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

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Registration Failed')}
          />
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="login-link">Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
