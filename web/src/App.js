import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './css/App.css';
import LandingPage from './javascript/LandingPage';
import Login from './javascript/Login';
import Register from './javascript/Register';
import Dashboard from './javascript/Dashboard';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
