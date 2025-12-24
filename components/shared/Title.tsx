'use client';

import React from 'react';

interface TitleProps {
  children: React.ReactNode;
  className?: string;
}

const Title: React.FC<TitleProps> = ({ children, className }) => {
  return (
    <h2 className={`text-2xl font-semibold text-gray-800 ${className || ''}`.trim()}>
      {children}
    </h2>
  );
};

export default Title;
