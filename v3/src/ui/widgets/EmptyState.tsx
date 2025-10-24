import React from 'react';
import { Video as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Icon className="w-16 h-16 mb-4 opacity-50" />
      <p className="text-lg">{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  );
};
