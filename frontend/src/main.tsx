import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Provider } from 'react-redux';
import { store } from './store/store';
import { BrowserRouter } from 'react-router-dom'; // 1. استيراد الموجه هنا
createRoot(document.getElementById('root')!).render(
  <BrowserRouter> {/* 2. لف التطبيق بالموجه */}
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
)
