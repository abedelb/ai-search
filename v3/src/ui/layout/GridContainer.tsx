import React from 'react';

interface GridContainerProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
}

export const GridContainer: React.FC<GridContainerProps> = ({
  children,
  cols = 3,
}) => {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 @xl:grid-cols-4 gap-6">
        {children}
      </div>
    </div>
  );
};
