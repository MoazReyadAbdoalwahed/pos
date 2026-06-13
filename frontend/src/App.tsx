import React from 'react';
import Home from './pages/index'; // تغيير الاسم البرمجي لتبدأ بحرف كبير لتجنب أخطاء React

const App = () => {
  return (
    <Home /> // رندرة المكون بشكل صحيح بعد تكبير الحرف الأول
  );
};

export default App;