import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

import AboutPage from './AboutPage'; // ✅ Correct
import TutorialPage from './TutorialPage'; // ✅ Correct
import DashboardPage from './Dashboard'; // ✅ Correct
import AnalyticsPage from './Analytics'; // ✅ Correct
import MainLayout from './layouts/MainLayout';
import Login from './LoginPage';
import SignupPage from './SignupPage';
import './index.css';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<AboutPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tutorial" element={<TutorialPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


export default App;