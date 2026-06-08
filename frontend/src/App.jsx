import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in via token
    const token = localStorage.getItem('leetpath_token');
    const email = localStorage.getItem('leetpath_email');
    if (token && email) {
      setUser(email);
    }
    setLoading(false);
  }, []);

  const handleLogin = (email) => {
    setUser(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('leetpath_token');
    localStorage.removeItem('leetpath_email');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading LeetPath App...</p>
      </div>
    );
  }

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app-shell">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            
            <Route 
              path="/auth" 
              element={user ? <Navigate to="/dashboard" replace /> : <Auth onLogin={handleLogin} />} 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
