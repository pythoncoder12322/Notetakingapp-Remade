import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/sidebar';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className={`flex h-screen`}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}