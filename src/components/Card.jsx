import React from 'react';

const Card = ({ children, className = '' }) => (
  <div className={`card shadow-sm ${className || ''}`}>
    <div className="card-body">
      {children}
    </div>
  </div>
);

export default Card;
