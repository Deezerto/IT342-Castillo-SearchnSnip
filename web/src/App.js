import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './css/App.css';
import LandingPage from './javascript/LandingPage';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Dashboard from './features/barbershop/Dashboard';
import Favorites from './features/barbershop/Favorites';
import Profile from './features/profile/Profile';
import MyBarbershop from './features/barbershop/MyBarbershop';
import BarbershopUpload from './javascript/BarbershopUpload';
import Booking from './features/booking/Booking';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PlaceholderPage = ({ title }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif', background: '#f5f7fb' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
        <p style={{ margin: 0, color: '#667085' }}>This page is coming soon.</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId="267431359144-re5kr186ca35igpul1rmva2i3f196d0i.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/my-barbershop" element={
            <ProtectedRoute>
              <MyBarbershop />
            </ProtectedRoute>
          } />
          <Route path="/barbershop-upload" element={
            <ProtectedRoute>
              <BarbershopUpload />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <PlaceholderPage title="Settings" />
            </ProtectedRoute>
          } />
          <Route path="/booking" element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
