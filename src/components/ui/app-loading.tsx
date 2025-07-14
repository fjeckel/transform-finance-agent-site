import React from 'react';

const AppLoading = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-cooper text-foreground">Finance Transformers lädt...</h2>
        <p className="text-muted-foreground mt-2">Einen Moment bitte...</p>
      </div>
    </div>
  );
};

export default AppLoading;