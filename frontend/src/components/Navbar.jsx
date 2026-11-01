import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Cake, Shield, User, LogOut, Clock } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, isAdmin, logout } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
                Birthday Notifier
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ml-2 border border-amber-200">
                <Clock className="w-3 h-3" /> 23:50 Eve Alert
              </span>
            </div>
          </div>

          {/* Navigation Links & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'dashboard'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              My Reminders
            </button>

            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  currentView === 'admin'
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-sm'
                    : 'text-amber-700 hover:bg-amber-50/70'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                Admin Portal
              </button>
            )}

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight">{user?.fullName}</p>
                <p className="text-slate-500 text-[11px] leading-tight">{user?.email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

