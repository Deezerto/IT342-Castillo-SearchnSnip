import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './css/App.css';
import LandingPage from './javascript/LandingPage';
import Login from './javascript/Login';
import Register from './javascript/Register';
import Dashboard from './javascript/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
