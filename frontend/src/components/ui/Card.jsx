import React from 'react';

export const Card = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`card-premium ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
};
