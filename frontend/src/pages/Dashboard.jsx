import React, { useState, useEffect } from 'react';
import { FaBrain, FaSearch, FaRedo, FaLink, FaCheckCircle, FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaListUl, FaChartPie } from 'react-icons/fa';
import API from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [problems, setProblems] = useState([]);
  const [solvedSlugs, setSolvedSlugs] = useState([]);
  
  // Recommender settings
  const [mode, setMode] = useState('balanced'); // balanced, weak_areas, similar
  const [count, setCount] = useState(10);
  const [recLoading, setRecLoading] = useState(false);

  // Problem list state
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const limit = 15;

  // UI state
  const [expandedRecId, setExpandedRecId] = useState(null);
  const [expandedProbId, setExpandedProbId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Fetch data
  const fetchData = async () => {
    try {
      // Get profile for solved list
      const profRes = await API.get('/profile');
      if (profRes.data.status) {
        setSolvedSlugs(profRes.data.profile.solved_questions || []);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const fetchRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await API.post('/recommend', { mode, count });
      if (res.data.status) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      showNotification('Failed to load recommendations. Make sure backend is running.', 'error');
    } finally {
      setRecLoading(false);
    }
  };

  const fetchProblems = async () => {
    setProblemsLoading(true);
    try {
      const res = await API.get('/problems', {
        params: { page, limit, search, difficulty, topic }
      });
      if (res.data.status) {
        setProblems(res.data.problems);
        setTotalProblems(res.data.total);
      }
    } catch (err) {
      console.error("Error fetching problems:", err);
    } finally {
      setProblemsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [mode, count, solvedSlugs]);

  useEffect(() => {
    fetchProblems();
  }, [page, search, difficulty, topic]);

  // Actions
  const toggleSolved = async (slug) => {
    const isSolved = solvedSlugs.includes(slug);
    const endpoint = isSolved ? '/solved/remove' : '/solved/add';
    
    try {
      const res = await API.post(endpoint, { question_slug: slug });
      if (res.data.status) {
        // Toggle solved in state
        if (isSolved) {
          setSolvedSlugs(prev => prev.filter(s => s !== slug));
          showNotification('Question marked as unsolved.', 'success');
        } else {
          setSolvedSlugs(prev => [...prev, slug]);
          showNotification('Question marked as solved!', 'success');
        }
      }
    } catch (err) {
      console.error("Error toggling solved status:", err);
      showNotification('Failed to update solved status.', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset page to 1
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setPage(1);
  };

  const handleTopicChange = (e) => {
    setTopic(e.target.value);
    setPage(1);
  };

  const totalPages = Math.ceil(totalProblems / limit);

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Top Banner / Notification */}
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* SECTION 1: RECOMMENDATIONS */}
      <section className="recommendations-section">
        <div className="section-header">
          <div className="header-title">
            <FaBrain className="header-icon" />
            <h2>Your Smart Recommendations</h2>
          </div>
          <div className="recommender-controls">
            <div className="control-group">
              <label htmlFor="mode">Recommendation Mode</label>
              <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="balanced">Balanced (Mixed)</option>
                <option value="weak_areas">Target Weak Areas</option>
                <option value="similar">Similar to Solved</option>
              </select>
            </div>
            
            <div className="control-group">
              <label htmlFor="count">Count</label>
              <select id="count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>

            <button className="btn btn-secondary refresh-btn" onClick={fetchRecommendations} title="Reload Recommendations">
              <FaRedo />
            </button>
          </div>
        </div>

        {recLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Running Belief Propagation & MRF potentials...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="empty-state glass-card">
            <p>No recommendations yet. Start by syncing your LeetCode username or marking problems as solved below!</p>
          </div>
        ) : (
          <div className="problems-list">
            {recommendations.map((prob, index) => {
              const isSolved = solvedSlugs.includes(prob.titleSlug);
              const isExpanded = expandedRecId === prob.questionId;
              
              return (
                <div key={prob.questionId} className={`problem-card glass-card ${isSolved ? 'solved' : ''}`}>
                  <div className="problem-summary">
                    <div className="problem-title-section" onClick={() => setExpandedRecId(isExpanded ? null : prob.questionId)}>
                      <span className="problem-index">{index + 1}.</span>
                      <h3 className="problem-title">{prob.title}</h3>
                      <span className={`badge badge-${prob.difficulty}`}>{prob.difficulty}</span>
                      {isExpanded ? <FaChevronUp className="expand-chevron" /> : <FaChevronDown className="expand-chevron" />}
                    </div>

                    <div className="problem-actions">
                      <button 
                        className={`btn ${isSolved ? 'btn-secondary' : 'btn-outline'} solve-toggle-btn`}
                        onClick={() => toggleSolved(prob.titleSlug)}
                      >
                        {isSolved ? <><FaCheckCircle /> Solved</> : 'Mark Solved'}
                      </button>
                      <a 
                        href={prob.link || `https://leetcode.com/problems/${prob.titleSlug}/`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-secondary leetcode-link"
                      >
                        Solve <FaExternalLinkAlt className="inline-icon" />
                      </a>
                    </div>
                  </div>

                  <div className="problem-meta">
                    <div className="problem-topics">
                      {prob.topics.slice(0, 4).map(t => (
                        <span key={t} className="topic-tag">{t}</span>
                      ))}
                      {prob.topics.length > 4 && (
                        <span className="topic-tag-more">+{prob.topics.length - 4} more</span>
                      )}
                    </div>
                    <div className="problem-stats">
                      <span>Likability: <strong>{Math.round(prob.likability)}%</strong></span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="problem-details">
                      <hr className="divider" />
                      <h4>Problem Description:</h4>
                      <p className="problem-desc" dangerouslySetInnerHTML={{ __html: prob.question }}></p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: ALL PROBLEMS EXPLORER */}
      <section className="explorer-section">
        <div className="section-header">
          <div className="header-title">
            <FaListUl className="header-icon" />
            <h2>Explore LeetCode Problem Set</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="explorer-filters glass-card">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search problems by title..." 
              value={search} 
              onChange={handleSearchChange} 
            />
          </div>

          <div className="filters-group">
            <select value={difficulty} onChange={handleDifficultyChange}>
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select value={topic} onChange={handleTopicChange}>
              <option value="">All Topics</option>
              <option value="array">Array</option>
              <option value="string">String</option>
              <option value="dynamic-programming">Dynamic Programming</option>
              <option value="hash-table">Hash Table</option>
              <option value="sorting">Sorting</option>
              <option value="greedy">Greedy</option>
              <option value="binary-search">Binary Search</option>
              <option value="tree">Tree</option>
              <option value="graph">Graph</option>
              <option value="matrix">Matrix</option>
              <option value="stack">Stack</option>
            </select>
          </div>
        </div>

        {problemsLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading problem set...</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="empty-state glass-card">
            <p>No problems match your filters.</p>
          </div>
        ) : (
          <>
            <div className="problems-list">
              {problems.map((prob) => {
                const isSolved = solvedSlugs.includes(prob.titleSlug);
                const isExpanded = expandedProbId === prob.questionId;
                
                return (
                  <div key={prob.questionId} className={`problem-card glass-card ${isSolved ? 'solved' : ''}`}>
                    <div className="problem-summary">
                      <div className="problem-title-section" onClick={() => setExpandedProbId(isExpanded ? null : prob.questionId)}>
                        <span className="problem-index">#{prob.questionFrontendId}</span>
                        <h3 className="problem-title">{prob.title}</h3>
                        <span className={`badge badge-${prob.difficulty}`}>{prob.difficulty}</span>
                        {isExpanded ? <FaChevronUp className="expand-chevron" /> : <FaChevronDown className="expand-chevron" />}
                      </div>

                      <div className="problem-actions">
                        <button 
                          className={`btn ${isSolved ? 'btn-secondary' : 'btn-outline'} solve-toggle-btn`}
                          onClick={() => toggleSolved(prob.titleSlug)}
                        >
                          {isSolved ? <FaCheckCircle /> : 'Mark Solved'}
                        </button>
                        <a 
                          href={prob.link || `https://leetcode.com/problems/${prob.titleSlug}/`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary leetcode-link"
                        >
                          <FaExternalLinkAlt />
                        </a>
                      </div>
                    </div>

                    <div className="problem-meta">
                      <div className="problem-topics">
                        {prob.topics.map(t => (
                          <span key={t} className="topic-tag">{t}</span>
                        ))}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="problem-details">
                        <hr className="divider" />
                        <h4>Problem Description:</h4>
                        <p className="problem-desc" dangerouslySetInnerHTML={{ __html: prob.question }}></p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-secondary pagination-btn"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalProblems} total problems)
                </span>
                <button 
                  className="btn btn-secondary pagination-btn"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
