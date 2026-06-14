import React from 'react';
import Home from './pages/index';
import { Toaster } from './components/ui/Toaster';

const App = () => {
  return (
    <>
      <Home />
      <Toaster />
    </>
  );
};

export default App;