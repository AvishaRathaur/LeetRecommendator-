import React from 'react';
import { FaHeart } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} LeetPath. Built with <FaHeart className="heart-icon" /> for LeetCode Developers.
        </p>
        <div className="footer-links">
          <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer">LeetCode Official</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
