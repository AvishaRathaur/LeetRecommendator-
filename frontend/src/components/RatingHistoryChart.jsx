import React, { useState } from 'react';
import './RatingHistoryChart.css';

const RatingHistoryChart = ({ history }) => {
  const [activeContest, setActiveContest] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="empty-chart-state">
        <p>No contest history found. Attend contest challenges on LeetCode to populate rating analytics.</p>
      </div>
    );
  }

  // Width and Height of the SVG coordinate space
  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Extract ratings
  const ratings = history.map(h => Math.round(h.rating));
  const minRating = Math.max(0, Math.min(...ratings) - 50);
  const maxRating = Math.max(...ratings) + 50;
  const ratingRange = maxRating - minRating;

  // Points mapping
  const points = history.map((h, index) => {
    const x = paddingLeft + (index / (history.length - 1 || 1)) * (width - paddingLeft - paddingRight);
    // Invert Y because SVG coordinates start from top-left (0,0)
    const y = height - paddingBottom - ((h.rating - minRating) / ratingRange) * (height - paddingTop - paddingBottom);
    return { x, y, rating: h.rating, title: h.contestTitle, date: h.startTime };
  });

  // SVG Line path definition (e.g. M x0 y0 L x1 y1 L x2 y2 ...)
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // SVG Area path definition (define line and close path at the bottom to fill gradient)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z` 
    : '';

  // Generate vertical grid lines and horizontal reference lines
  const horizontalGridCount = 4;
  const horizontalGridLines = Array.from({ length: horizontalGridCount }).map((_, idx) => {
    const val = minRating + (idx / (horizontalGridCount - 1)) * ratingRange;
    const y = height - paddingBottom - (idx / (horizontalGridCount - 1)) * (height - paddingTop - paddingBottom);
    return { y, value: Math.round(val) };
  });

  return (
    <div className="contest-rating-chart-container">
      <div className="chart-header">
        <div className="contest-trend-info">
          {activeContest ? (
            <>
              <span className="trend-contest-title">{activeContest.title}</span>
              <span className="trend-contest-rating">Rating: <strong>{Math.round(activeContest.rating)}</strong></span>
            </>
          ) : (
            <>
              <span className="trend-contest-title">Contest Rating Progress</span>
              <span className="trend-contest-rating">Latest: <strong>{Math.round(ratings[ratings.length - 1])}</strong></span>
            </>
          )}
        </div>
      </div>

      <div className="chart-svg-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} className="rating-svg">
          {/* Gradients */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e0a96d" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Labels */}
          {horizontalGridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.y} 
                x2={width - paddingRight} 
                y2={line.y} 
                className="grid-line" 
              />
              <text 
                x={paddingLeft - 8} 
                y={line.y + 4} 
                textAnchor="end" 
                className="grid-label-text"
              >
                {line.value}
              </text>
            </g>
          ))}

          {/* Fill Area Path */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartGradient)" />
          )}

          {/* Draw Line Path */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Hover interactive areas */}
          {points.map((p, idx) => (
            <g key={idx}>
              {/* Dot marker */}
              <circle
                cx={p.x}
                cy={p.y}
                r={activeContest && activeContest.title === p.title ? "5.5" : "3"}
                fill={activeContest && activeContest.title === p.title ? "#ffffff" : "#f59e0b"}
                stroke="#1e293b"
                strokeWidth="1.5"
                className="chart-point-marker"
              />
              {/* Hidden larger hover listener */}
              <circle
                cx={p.x}
                cy={p.y}
                r="12"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveContest(p)}
                onMouseLeave={() => setActiveContest(null)}
              />
            </g>
          ))}

          {/* X Axis line */}
          <line 
            x1={paddingLeft} 
            y1={height - paddingBottom} 
            x2={width - paddingRight} 
            y2={height - paddingBottom} 
            className="axis-line" 
          />
        </svg>
      </div>
      <div className="contest-history-timeline-caption">
        <span>{history.length} attended contests</span>
      </div>
    </div>
  );
};

export default RatingHistoryChart;
