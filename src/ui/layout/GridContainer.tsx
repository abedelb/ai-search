import React from 'react';

interface GridContainerProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
}

export const GridContainer: React.FC<GridContainerProps> = ({
  children,
  cols = 3,
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${colClasses[cols]} gap-6`}>
      {children}
    </div>
  );
};
