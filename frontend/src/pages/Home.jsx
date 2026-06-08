import React from 'react';
import { Link } from 'react-router-dom';
import { FaBrain, FaChartLine, FaNetworkWired, FaCode, FaArrowRight } from 'react-icons/fa';
import './Home.css';

const Home = ({ user }) => {
  return (
    <div className="home-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">Next-Gen LeetCode Prep 🚀</span>
          <h1 className="hero-title">
            Master LeetCode, <span className="text-gradient">Intelligently.</span>
          </h1>
          <p className="hero-subtitle">
            LeetPath is a personalized recommendation system that uses Markov Random Fields, topic modeling, and belief propagation to analyze your coding history and target your exact weak areas.
          </p>
          <div className="hero-buttons">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Go to Dashboard <FaArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/auth" className="btn btn-primary btn-large">
                  Get Started Free <FaArrowRight />
                </Link>
                <a href="#features" className="btn btn-secondary btn-large">
                  Learn More
                </a>
              </>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="network-glow-container">
            {/* SVG Network Graph Visualization */}
            <svg viewBox="0 0 400 400" className="network-svg">
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                </radialGradient>
              </defs>
              {/* Glow circles */}
              <circle cx="200" cy="200" r="100" fill="url(#glow)" />
              <circle cx="90" cy="120" r="40" fill="url(#glow)" />
              <circle cx="310" cy="280" r="50" fill="url(#glow)" />
              
              {/* Edges */}
              <line x1="200" y1="200" x2="90" y2="120" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="200" y1="200" x2="310" y2="280" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <line x1="90" y1="120" x2="280" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="310" y1="280" x2="280" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="90" y1="120" x2="120" y2="300" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <line x1="200" y1="200" x2="120" y2="300" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="310" y1="280" x2="120" y2="300" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

              {/* Nodes */}
              <circle cx="200" cy="200" r="12" className="node central-node" />
              <circle cx="90" cy="120" r="8" className="node" />
              <circle cx="280" cy="100" r="6" className="node" />
              <circle cx="310" cy="280" r="9" className="node" />
              <circle cx="120" cy="300" r="7" className="node" />
              
              {/* Text labels */}
              <text x="200" y="175" textAnchor="middle" className="node-label font-title">DP</text>
              <text x="70" y="105" textAnchor="middle" className="node-label">Arrays</text>
              <text x="330" y="305" textAnchor="middle" className="node-label">Graphs</text>
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">Built with Advanced Algorithms</h2>
        <p className="section-subtitle">We don't just recommend popular questions. We model your exact knowledge state.</p>
        
        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper accent-color">
              <FaNetworkWired />
            </div>
            <h3>Graph-Based Mapping</h3>
            <p>Questions are modeled as interconnected nodes. Similarity weights are calculated via description semantics, cosine similarity, and topic overlaps.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper success-color">
              <FaBrain />
            </div>
            <h3>Markov Random Field</h3>
            <p>Our backend constructs a Markov Random Field modeling joint probability distributions between question difficulty, user engagement, and accuracy rates.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper info-color">
              <FaChartLine />
            </div>
            <h3>Belief Propagation</h3>
            <p>Refines potential values recursively across question edges using belief propagation message-passing algorithms to guarantee recommendation accuracy.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper danger-color">
              <FaCode />
            </div>
            <h3>Weak Area Boost</h3>
            <p>Our dynamic analyzer groups your solved history, tracks LeetCode topic frequencies, isolates your weak areas, and injects custom-boosted problems into your list.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
