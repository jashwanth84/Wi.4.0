import React from 'react';
import { ArrowLeft, Target, Trophy, Clock, Skull, Crosshair, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MyStatistics() {
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] font-sans pb-20">
      <header className="flex items-center px-4 py-3 bg-[#12182F] sticky top-0 z-20 shadow-md border-b border-white/5">
        <div className="flex items-center space-x-3 w-full">
          <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold text-[17px] tracking-wide">My Statistics</h1>
        </div>
      </header>

      <div className="flex flex-col px-4 pt-6 w-full gap-5">
        
        {/* Profile Summary Header */}
        <div className="bg-gradient-to-br from-[#1C093B] to-[#120524] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-full border-[3px] border-blue-500 overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <img 
                src={dbUser?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${dbUser?.username || user?.uid || 'user'}`} 
                alt="Profile" 
                className="w-full h-full object-cover bg-black"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${dbUser?.username || user?.uid || 'user'}`;
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-blue-400 font-bold tracking-wider uppercase mb-0.5">Player Stats</span>
              <span className="text-xl font-black text-white">{dbUser?.username || 'Player'}</span>
            </div>
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1C093B]/60 border border-white/5 rounded-xl p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
               <Gamepad2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Matches</span>
              <span className="text-xl font-black text-white">{dbUser?.totalMatches || 0}</span>
            </div>
          </div>

          <div className="bg-[#1C093B]/60 border border-white/5 rounded-xl p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
               <Skull className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total Kills</span>
              <span className="text-xl font-black text-white">{dbUser?.totalKills || 0}</span>
            </div>
          </div>

          <div className="bg-[#1C093B]/60 border border-white/5 rounded-xl p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
               <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">Win Rate</span>
              <span className="text-xl font-black text-white">{dbUser?.winRate || 0}%</span>
            </div>
          </div>

          <div className="bg-[#1C093B]/60 border border-white/5 rounded-xl p-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
               <Target className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">K/D Ratio</span>
              <span className="text-xl font-black text-white">{dbUser?.kdRatio || '0.0'}</span>
            </div>
          </div>
        </div>

        {/* Additional details */}
        <div className="bg-[#1C093B]/40 rounded-xl border border-white/5 overflow-hidden">
           <div className="px-4 py-3 border-b border-white/5 bg-white/5">
             <h3 className="text-white font-bold text-sm tracking-wide">Performance Overview</h3>
           </div>
           <div className="p-4 flex flex-col gap-4">
             <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <Crosshair className="w-4 h-4 text-gray-400" />
                 <span className="text-gray-300 text-sm">Headshot Rate</span>
               </div>
               <span className="text-white font-bold">{dbUser?.headshotRate || 0}%</span>
             </div>
             <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
               <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${dbUser?.headshotRate || 0}%` }}></div>
             </div>

             <div className="flex justify-between items-center mt-2">
               <div className="flex items-center gap-2">
                 <Clock className="w-4 h-4 text-gray-400" />
                 <span className="text-gray-300 text-sm">Time Played</span>
               </div>
               <span className="text-white font-bold">{dbUser?.timePlayed || 0} hrs</span>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
