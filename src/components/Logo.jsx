import React from 'react';
import newLogo from '../assets/logo.png';

export default function Logo({ size = 32, className = '', ...props }) {
  return (
    <div 
      className={`logo-wrapper ${className}`}
      style={{ 
        width: size, 
        height: 'auto', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        ...props.style 
      }}
    >
      <img 
        src={newLogo}
        alt="Where it Went Logo"
        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
        {...props}
      />
    </div>
  );
}

