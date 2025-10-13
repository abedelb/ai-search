import React from 'react';

export const Help: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 bg-gradient-to-br from-neutral-50 via-white to-primary-50/20">
      <div className="text-center glass-panel p-12 rounded-3xl shadow-soft max-w-md animate-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mx-auto mb-6 shadow-soft">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold gradient-text mb-3">Help & Support</h2>
        <p className="text-neutral-600 text-lg">Help documentation coming soon</p>
      </div>
    </div>
  );
};
