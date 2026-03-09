import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Register.css';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
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
        navigate('/login'); // Successfully registered, take them to login
      } else {
        setError('Failed to create account. Email might already be in use.');
      }
    } catch (err) {
      setError('An error occurred during registration. Is the backend running?');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/login" className="back-arrow">&larr;</Link>
          <span className="brand">Register</span>
        </div>

        <h2 className="auth-title blue">Create Account</h2>

        <form className="auth-form" onSubmit={handleRegister}>
          {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
          <label>Email</label>
          <input 
            type="email" 
            name="email"
            placeholder="Enter your email" 
            className="plain-input" 
            onChange={handleChange}
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
                required 
              />
            </div>
          </div>

          <label>Password</label>
          <div className="input-group">
            <input 
              type="password" 
              name="password"
              placeholder="Create a password" 
              onChange={handleChange}
              required 
            />
            <span className="input-icon eye">&#128065;</span>
          </div>

          <label>Confirm Password</label>
          <div className="input-group">
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="Re-enter password" 
              onChange={handleChange}
              required 
            />
            <span className="input-icon eye">&#128065;</span>
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
