import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Tournaments from './pages/Tournaments';
import TournamentDetails from './pages/TournamentDetails';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';
import Admin from './pages/Admin';
import Earn from './pages/Earn';
import ReferEarn from './pages/ReferEarn';

import Leaderboard from './pages/Leaderboard';
import MyMatches from './pages/MyMatches';
import GenericContent from './pages/GenericContent';
import MyOrders from './pages/MyOrders';
import MyStatistics from './pages/MyStatistics';
import MyRewards from './pages/MyRewards';
import AddCoins from './pages/AddCoins';
import WithdrawCoins from './pages/WithdrawCoins';
import ExclusiveGames from './pages/ExclusiveGames';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#0B0B0F]"><div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Admin Panel Routes */}
      <Route path="/admin/*" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="tournaments" element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentDetails />} />
        <Route path="exclusive-games" element={<ExclusiveGames />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="add-coins" element={<AddCoins />} />
        <Route path="withdraw-coins" element={<WithdrawCoins />} />
        <Route path="profile" element={<Profile />} />
        <Route path="my-profile" element={<MyProfile />} />
        <Route path="my-orders" element={<MyOrders />} />
        <Route path="my-statistics" element={<MyStatistics />} />
        <Route path="my-rewards" element={<MyRewards />} />
        <Route path="earn" element={<Earn />} />
        <Route path="refer" element={<ReferEarn />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="my-matches" element={<MyMatches />} />
        <Route path="announcement" element={<GenericContent />} />
        <Route path="about" element={<GenericContent />} />
        <Route path="terms" element={<GenericContent />} />
        <Route path="tutorial" element={<GenericContent />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" toastOptions={{
          style: {
            background: '#1A0B2E',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
