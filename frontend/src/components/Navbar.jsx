import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaTerminal, FaBars, FaTimes, FaSignOutAlt, FaUser } from 'react-icons/fa';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <FaTerminal className="logo-icon" />
          <span>LeetPath</span>
        </Link>

        <div className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link 
              to="/" 
              className={`nav-links ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          
          {user && (
            <>
              <li className="nav-item">
                <Link 
                  to="/dashboard" 
                  className={`nav-links ${isActive('/dashboard') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/profile" 
                  className={`nav-links ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
              </li>
            </>
          )}



          {user ? (
            <li className="nav-item auth-btn-container">
              <button className="btn btn-secondary nav-btn logout-btn" onClick={handleLogoutClick}>
                <FaSignOutAlt /> Log Out
              </button>
            </li>
          ) : (
            <li className="nav-item auth-btn-container">
              <Link to="/auth" onClick={() => setMenuOpen(false)}>
                <button className="btn btn-primary nav-btn login-btn">
                  <FaUser /> Sign In
                </button>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
