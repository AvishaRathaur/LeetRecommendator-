import React, { useMemo } from 'react';
import './SubmissionCalendar.css';

const SubmissionCalendar = ({ calendarData }) => {
  // Parse calendarData (could be a string or object)
  const parsedCalendar = useMemo(() => {
    if (!calendarData) return {};
    if (typeof calendarData === 'string') {
      try {
        return JSON.parse(calendarData);
      } catch (e) {
        console.error("Failed to parse calendar string", e);
        return {};
      }
    }
    return calendarData;
  }, [calendarData]);

  // Generate date cells for the last 365 days, ending on today
  const { cells, months, totalSubmissions, activeDays, maxStreak } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells = [];
    const months = [];
    let currentMonth = -1;
    let totalSubmissions = 0;
    let activeDays = 0;
    
    // We want to align the calendar grid to start on a Sunday
    // So we find the date 365 days ago, and go back to its Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    const dayOfWeek = startDate.getDay(); // 0 is Sunday, 6 is Saturday
    startDate.setDate(startDate.getDate() - dayOfWeek); // go back to Sunday

    // Loop through all days from startDate to today
    const tempDate = new Date(startDate);
    
    // Track streak
    let currentStreak = 0;
    let maxStreak = 0;
    
    while (tempDate <= today) {
      const timeSecs = Math.floor(tempDate.getTime() / 1000);
      
      // Look for activity in the calendar map (+/- 12 hours range)
      let count = 0;
      const dateKey = Object.keys(parsedCalendar).find(k => {
        const diff = Math.abs(parseInt(k) - timeSecs);
        return diff < 43200; // within 12 hours
      });
      
      if (dateKey) {
        count = parsedCalendar[dateKey];
      }
      
      totalSubmissions += count;
      if (count > 0) {
        activeDays++;
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }

      // Add label for month at the beginning of each month
      const m = tempDate.getMonth();
      const mName = tempDate.toLocaleString('default', { month: 'short' });
      if (m !== currentMonth && tempDate.getDate() <= 7) {
        months.push({ name: mName, index: cells.length });
        currentMonth = m;
      }

      cells.push({
        date: new Date(tempDate),
        count,
        level: count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4
      });

      tempDate.setDate(tempDate.getDate() + 1);
    }

    return { cells, months, totalSubmissions, activeDays, maxStreak };
  }, [parsedCalendar]);

  // Group cells by week (columns of 7 days)
  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < cells.length; i += 7) {
      w.push(cells.slice(i, i + 7));
    }
    return w;
  }, [cells]);

  const weekdays = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

  return (
    <div className="submission-calendar-wrapper">
      <div className="heatmap-stats">
        <div className="heatmap-stat-item">
          <span className="stat-value">{totalSubmissions}</span>
          <span className="stat-label">submissions in the past year</span>
        </div>
        <div className="heatmap-stat-item">
          <span className="stat-value">{activeDays}</span>
          <span className="stat-label">total active days</span>
        </div>
        <div className="heatmap-stat-item">
          <span className="stat-value">{maxStreak} days</span>
          <span className="stat-label">max streak</span>
        </div>
      </div>

      <div className="heatmap-container">
        {/* Month Names Header */}
        <div className="months-row">
          <div className="empty-day-label"></div>
          <div className="months-labels" style={{ position: 'relative', height: '20px', width: '100%' }}>
            {months.map((m, idx) => (
              <span 
                key={idx} 
                style={{ 
                  left: `${(m.index / 7) * 14}px`, 
                  position: 'absolute' 
                }}
                className="month-label-text"
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>

        <div className="heatmap-grid-layout">
          {/* Weekday Names on Left */}
          <div className="weekdays-col">
            {weekdays.map((d, idx) => (
              <span key={idx} className="weekday-label-text">{d}</span>
            ))}
          </div>

          {/* Grid Blocks */}
          <div className="heatmap-scrollable">
            <div className="weeks-grid">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="calendar-week-column">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className={`calendar-day-cell level-${day.level}`}
                      title={`${day.date.toDateString()}: ${day.count} submissions`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span>Less</span>
          <div className="legend-cell level-0"></div>
          <div className="legend-cell level-1"></div>
          <div className="legend-cell level-2"></div>
          <div className="legend-cell level-3"></div>
          <div className="legend-cell level-4"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default SubmissionCalendar;
