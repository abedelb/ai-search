import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-gray-50">
      {children}
    </div>
  );
};
