import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const { user, isAdmin, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'admin'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500">Initializing Birthday Notifier...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1">
        {currentView === 'admin' && isAdmin ? (
          <AdminDashboard />
        ) : (
          <UserDashboard />
        )}
      </main>
      <footer className="py-4 border-t border-slate-200 bg-white/50 text-center text-[11px] text-slate-400">
        Birthday Reminder Application &bull; 23:50 Midnight Eve Email Service &bull; Spring Boot &amp; React
      </footer>
    </div>
  );
}
