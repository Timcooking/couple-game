import React from 'react';

const ThumbDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
     <path d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755z" opacity="0"/>
    <path d="M12.75 13.5V18a2.25 2.25 0 0 1-4.5 0v-4.5H5.458a1.69 1.69 0 0 1-1.584-1.126L2.52 8.608A2.25 2.25 0 0 1 4.634 5.625h3.617a2.25 2.25 0 0 1 2.25-2.25v-.375h3v.375a2.25 2.25 0 0 1 2.25 2.25h3.616a1.69 1.69 0 0 1 1.583 1.126l1.354 3.766a2.25 2.25 0 0 1-2.113 2.984h-2.791V18a2.25 2.25 0 0 1-3 2.122V13.5h-1.5z" />
</svg>
);
export default ThumbDownIcon;