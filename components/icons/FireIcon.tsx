
import React from 'react';

const FireIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M13.4,2.69L15,5.5L13.5,8H10.5L9,5.5L10.6,2.69C11.08,1.75 12.19,1.3 13.13,1.78C13.31,1.86 13.4,2.04 13.4,2.25V2.25C13.4,2.46 13.31,2.64 13.13,2.72L13.4,2.69M14.75,10C16.86,10 18.25,12.75 17,15.25C15.75,17.75 14,17 14,19.5V22H10V19.5C10,17 8.25,17.75 7,15.25C5.75,12.75 7.14,10 9.25,10H14.75Z" />
  </svg>
);

export default FireIcon;