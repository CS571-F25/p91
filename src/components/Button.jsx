import React from 'react';
import { Button as BSButton } from 'react-bootstrap';

const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
  return (
    <BSButton 
      onClick={onClick} 
      variant={variant}
      className={className}
    >
      {children}
    </BSButton>
  );
};

export default Button;