import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaSyncAlt, FaEdit, FaSave, FaUniversity, FaUser, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import API from '../api';
import SubmissionCalendar from '../components/SubmissionCalendar';
import RatingHistoryChart from '../components/RatingHistoryChart';
import './Profile.css';

// Circular Gauge Helper Component
const CircularProgressGauge = ({ easy, medium, hard, total }) => {
  const totalAvailable = 3949;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (total / totalAvailable) * circumference;

  return (
    <div className="circular-progress-dashboard">
      <div className="circular-chart-wrapper">
        <svg viewBox="0 0 110 110" className="circular-svg">
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="7"
          />
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            className="gauge-circle-fill"
          />
        </svg>
        <div className="circular-chart-labels">
          <span className="total-solved-num">{total}</span>
          <span className="total-solved-denominator">/{totalAvailable}</span>
          <span className="total-solved-subtext">Solved</span>
        </div>
      </div>
      
      <div className="circular-breakdown-details">
        <div className="difficulty-row font-easy">
          <span className="difficulty-name-dot font-easy">Easy</span>
          <span className="difficulty-fraction"><strong>{easy}</strong>/947</span>
        </div>
        <div className="difficulty-row font-medium">
          <span className="difficulty-name-dot font-medium">Medium</span>
          <span className="difficulty-fraction"><strong>{medium}</strong>/2063</span>
        </div>
        <div className="difficulty-row font-hard">
          <span className="difficulty-name-dot font-hard">Hard</span>
          <span className="difficulty-fraction"><strong>{hard}</strong>/939</span>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [institution, setInstitution] = useState('');
  
  // Bulk import
  const [bulkSlugs, setBulkSlugs] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  
  // UI States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile');
      if (res.data.status) {
        setProfile(res.data.profile);
        setName(res.data.profile.name || '');
        setUsername(res.data.profile.username || '');
        setInstitution(res.data.profile.institution || '');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await API.patch('/profile/update', { name, username, institution });
      if (res.data.status) {
        setSuccessMsg('Profile updated successfully!');
        setIsEditing(false);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleSync = async () => {
    if (!username) {
      setError('Please add a LeetCode username to sync stats.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setSyncing(true);
    try {
      const res = await API.post('/leetcode/sync');
      if (res.data.status) {
        setSuccessMsg(res.data.message || 'LeetCode statistics synced successfully!');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to sync with LeetCode. Ensure the username is correct.');
    } finally {
      setSyncing(false);
    }
  };

  const handleImageUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError('');
    setSuccessMsg('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await API.post('/profile/image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status) {
        setSuccessMsg('Profile image uploaded!');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload image.');
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkSlugs.trim()) return;

    setBulkLoading(true);
    setError('');
    setSuccessMsg('');

    const slugsArray = bulkSlugs
      .split(/[\n,]+/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    try {
      const res = await API.post('/solved/bulk', { question_slugs: slugsArray });
      if (res.data.status) {
        setSuccessMsg(res.data.message);
        setBulkSlugs('');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to bulk import solved questions.');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Fetching user details...</p>
      </div>
    );
  }

  // Calculate difficulty numbers
  const easy = profile?.solved?.easy || 0;
  const medium = profile?.solved?.medium || 0;
  const hard = profile?.solved?.hard || 0;
  const totalSolved = easy + medium + hard;

  // Extract LeetCode stats JSON details
  const leetcodeStats = profile?.leetcode_stats || {};
  const ranking = leetcodeStats.ranking || null;
  const reputation = leetcodeStats.reputation || 0;
  const leetcodeAvatar = leetcodeStats.avatar || null;
  const languageProblemCount = leetcodeStats.language_problem_count || [];
  const badges = leetcodeStats.badges || [];
  const submissionCalendar = leetcodeStats.submission_calendar || null;
  const contestRanking = leetcodeStats.contest_ranking || null;
  const contestHistory = leetcodeStats.contest_history || [];

  // Sort weak areas alphabetically for layout consistency
  const sortedWeakAreas = [...(profile?.weak_areas || [])].sort((a, b) => 
    a.topic.localeCompare(b.topic)
  );

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-grid">
        {/* Left Side: Profile Information & User Metadata */}
        <div className="profile-card-left glass-card">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {leetcodeAvatar ? (
                <img 
                  src={leetcodeAvatar} 
                  alt="LeetCode Avatar" 
                  className="profile-avatar"
                />
              ) : profile?.imageUrl ? (
                <img 
                  src={`http://localhost:5000${profile.imageUrl}?t=${new Date().getTime()}`} 
                  alt="Profile" 
                  className="profile-avatar"
                />
              ) : (
                <FaUserCircle className="profile-avatar-fallback" />
              )}
              <label className="avatar-upload-overlay" htmlFor="avatar-file">
                Upload
                <input 
                  type="file" 
                  id="avatar-file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            <h3 className="profile-user-name">{profile?.name || 'Developer'}</h3>
            <p className="profile-user-email">{profile?.email}</p>
            
            {profile?.username ? (
              <span className="leetcode-username-badge">
                LeetCode: <strong>{profile.username}</strong>
              </span>
            ) : (
              <span className="leetcode-username-badge placeholder">
                No LeetCode linked
              </span>
            )}

            {ranking && (
              <span className="leetcode-username-badge" style={{ marginTop: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Global Rank: <strong>#{ranking.toLocaleString()}</strong>
              </span>
            )}
          </div>

          <hr className="divider" />

          {isEditing ? (
            <form onSubmit={handleUpdate} className="profile-edit-form">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-name">Display Name</label>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-username">LeetCode Username</label>
                <input
                  id="edit-username"
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="LeetCode username"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-institution">Institution / Company</label>
                <input
                  id="edit-institution"
                  type="text"
                  className="form-input"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>

              <div className="edit-actions">
                <button type="submit" className="btn btn-primary"><FaSave /> Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="profile-details-list">
              <div className="detail-item">
                <FaUser className="detail-icon" />
                <div>
                  <span className="detail-label">Full Name</span>
                  <p className="detail-value">{profile?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="detail-item">
                <FaUniversity className="detail-icon" />
                <div>
                  <span className="detail-label">Institution</span>
                  <p className="detail-value">{profile?.institution || 'N/A'}</p>
                </div>
              </div>

              <div className="edit-btn-container">
                <button className="btn btn-outline edit-btn" onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit Profile
                </button>
              </div>
            </div>
          )}

          {badges.length > 0 && (
            <>
              <hr className="divider" />
              <div className="badges-display-section">
                <span className="badges-count-title">{badges.length} Badges</span>
                <div className="badges-flex-list">
                  {badges.map((b, idx) => (
                    <div className="badge-item-icon" key={idx} title={b.name}>
                      <img src={b.icon} alt={b.name} className="leetcode-badge-img" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {languageProblemCount.length > 0 && (
            <>
              <hr className="divider" />
              <div className="languages-display-section">
                <h4>Languages Solved</h4>
                <div className="languages-bar-list">
                  {languageProblemCount.slice(0, 5).map((lang, idx) => (
                    <div key={idx} className="lang-bar-row">
                      <div className="lang-bar-meta">
                        <span className="lang-name">{lang.languageName}</span>
                        <span className="lang-count">{lang.problemsSolved} solved</span>
                      </div>
                      <div className="lang-bar-track">
                        <div 
                          className="lang-bar-fill" 
                          style={{ width: `${Math.min(100, (lang.problemsSolved / (totalSolved || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <div className="profile-msg error-msg"><FaInfoCircle /> {error}</div>}
          {successMsg && <div className="profile-msg success-msg"><FaCheckCircle /> {successMsg}</div>}
        </div>

        {/* Right Side: Analytics & Visual Dashboard widgets */}
        <div className="profile-card-right">
          
          {/* Dashboard Solved Metrics Circle */}
          <div className="stats-box glass-card">
            <div className="stats-box-header">
              <h3>LeetCode Solved Statistics</h3>
              <button 
                className="btn btn-secondary sync-btn" 
                onClick={handleSync} 
                disabled={syncing}
                title="Sync directly from LeetCode"
              >
                <FaSyncAlt className={syncing ? 'spinning' : ''} /> {syncing ? 'Syncing...' : 'Sync LeetCode'}
              </button>
            </div>
            
            <CircularProgressGauge 
              easy={easy} 
              medium={medium} 
              hard={hard} 
              total={totalSolved} 
            />
          </div>

          {/* Contest Performance Card */}
          {contestRanking ? (
            <div className="contest-rank-summary-card glass-card">
              <div className="contest-rank-header">
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Contest Performance</h3>
                <span className="rating-pill">Rating: {Math.round(contestRanking.rating)}</span>
              </div>
              <div className="contest-rank-metrics-grid">
                <div className="metric-box">
                  <span className="metric-title">Global Rank</span>
                  <span className="metric-value">{contestRanking.globalRanking ? contestRanking.globalRanking.toLocaleString() : 'N/A'}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-title">Attended</span>
                  <span className="metric-value">{contestRanking.attendedContestsCount}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-title">Top %</span>
                  <span className="metric-value">{contestRanking.topPercentage}%</span>
                </div>
              </div>
              
              {contestHistory.length > 0 && (
                <RatingHistoryChart history={contestHistory} />
              )}
            </div>
          ) : (
            <div className="contest-rank-summary-card glass-card empty">
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Contest Performance</h3>
              <p className="no-contest-text">No active contest participation found. Sync profile to import official ranking metrics.</p>
            </div>
          )}

          {/* Calendar Heatmap Section */}
          {submissionCalendar && (
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>Submission Activity</h3>
              <SubmissionCalendar calendarData={submissionCalendar} />
            </div>
          )}

          {/* Knowledge Graph Weak Areas Section */}
          <div className="weak-analysis-box glass-card">
            <h3>Knowledge Graph Analyzer</h3>
            <p className="weak-analysis-sub">Identified weak topics from your solved questions list ({profile?.solved_questions?.length || 0} solved):</p>
            
            <div className="weak-topics-list">
              {sortedWeakAreas.map((wa) => {
                const isCritical = wa.priority === 3 || wa.status === 'CRITICAL (UNSOLVED)';
                const isNeedPrac = wa.priority === 2 || wa.status === 'NEEDS PRACTICE';
                
                return (
                  <div key={wa.slug} className={`weak-topic-row ${isCritical ? 'critical' : isNeedPrac ? 'warning' : 'improving'}`}>
                    <div className="weak-topic-info">
                      <div className="weak-topic-title">
                        {isCritical ? (
                          <FaExclamationTriangle className="alert-icon critical-icon" />
                        ) : isNeedPrac ? (
                          <FaExclamationTriangle className="alert-icon warning-icon" />
                        ) : (
                          <FaCheckCircle className="alert-icon check-icon" />
                        )}
                        <span className="topic-name">{wa.topic}</span>
                      </div>
                      <span className={`status-badge ${wa.status.toLowerCase().replace(/[^a-z]/g, '')}`}>
                        {wa.status}
                      </span>
                    </div>

                    <div className="weak-topic-progress">
                      <div className="mini-bar-bg">
                        <div 
                          className="mini-bar-fill" 
                          style={{ 
                            width: `${Math.max(wa.ratio, 4)}%`,
                            backgroundColor: isCritical ? '#ef4444' : isNeedPrac ? '#f59e0b' : '#10b981'
                          }}
                        ></div>
                      </div>
                      <span className="percentage-caption">{wa.solved} solved ({wa.ratio}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Collapsible Solved Slugs Bulk Importer */}
          <div className="advanced-collapsible glass-card">
            <div className="collapsible-header" onClick={() => setShowBulk(!showBulk)} style={{ cursor: 'pointer' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Advanced Options</h3>
              {showBulk ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            {showBulk && (
              <div className="collapsible-content">
                <p className="weak-analysis-sub" style={{ marginTop: '10px' }}>
                  Paste LeetCode question slugs (e.g. <code>two-sum</code>, <code>add-two-numbers</code>) separated by commas or newlines to import them into your solved questions list.
                </p>
                <form onSubmit={handleBulkImport} className="bulk-import-form">
                  <textarea
                    className="form-input bulk-textarea"
                    placeholder="two-sum&#10;add-two-numbers&#10;longest-common-prefix"
                    rows="4"
                    value={bulkSlugs}
                    onChange={(e) => setBulkSlugs(e.target.value)}
                    style={{ 
                      resize: 'vertical', 
                      width: '100%', 
                      fontFamily: 'monospace', 
                      fontSize: '0.85rem', 
                      background: 'rgba(15,23,42,0.4)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '8px', 
                      padding: '12px', 
                      marginBottom: '12px' 
                    }}
                  ></textarea>
                  <button type="submit" className="btn btn-primary" disabled={bulkLoading} style={{ width: '100%' }}>
                    {bulkLoading ? 'Importing...' : 'Bulk Import Slugs'}
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
