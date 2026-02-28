import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>

        <h1 className="text-3xl font-bold text-red-500 mb-2">
          Unauthorized Access
        </h1>

        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}