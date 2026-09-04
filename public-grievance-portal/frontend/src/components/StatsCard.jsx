import React from 'react';

const StatsCard = ({ title, count, icon: Icon, colorClass, subtitle }) => {
  return (
    <div className={`stats-card ${colorClass}`}>
      <div className="stats-icon-wrapper">
        <Icon size={24} />
      </div>
      <div className="stats-content">
        <span className="stats-title">{title}</span>
        <h2 className="stats-count">{count}</h2>
        {subtitle && <span className="stats-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};

export default StatsCard;
