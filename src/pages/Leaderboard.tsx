import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Star } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kills' | 'winnings'>('winnings');

  useEffect(() => {
    // If you add a "kills" field to users, you could order by 'kills'.
    // For now, we'll order by 'totalEarnings' for winnings, and maybe just show same for both or fallback.
    const q = query(
      collection(db, 'users'),
      orderBy(activeTab === 'winnings' ? 'totalEarnings' : 'walletBalance', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const players = snapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.data().username || doc.data().displayName || 'Player',
        kills: doc.data().totalEarnings || 0, // Fallback if no kills
        winnings: doc.data().totalEarnings || 0,
        avatar: doc.data().username || doc.id,
        ...doc.data()
      }));
      setTopPlayers(players);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  return (
    <div className="flex flex-col min-h-screen bg-black w-full pb-20">
      <div className="bg-[#1C093B] sticky top-0 z-20 w-full px-4 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-white hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex bg-[#2D1B54] rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('kills')}
              className={`px-4 py-1.5 text-sm font-bold rounded ${activeTab === 'kills' ? 'bg-[#4A2CA0] text-white shadow-sm' : 'text-gray-400'}`}
            >
              KILLS
            </button>
            <button 
              onClick={() => setActiveTab('winnings')}
              className={`px-4 py-1.5 text-sm font-bold rounded ${activeTab === 'winnings' ? 'bg-[#4A2CA0] text-white shadow-sm' : 'text-gray-400'}`}
            >
              WINNINGS
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 pt-6 relative items-center justify-center min-h-[300px]">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#1C093B] to-black -z-10" />
        
        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : topPlayers.length === 0 ? (
          <div className="mt-20 text-center text-gray-500">No players found.</div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-2 mb-8 mt-4 px-2">
              {/* Rank 2 */}
              {topPlayers.length > 1 && (
                <div className="flex flex-col items-center w-[30%] relative z-10">
                  <div className="w-14 h-14 rounded-full border-[3px] border-[#C0C0C0] bg-black overflow-hidden mb-2 shadow-[0_0_15px_rgba(192,192,192,0.4)]">
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${topPlayers[1].avatar}`} alt="Avatar" className="w-full h-full object-cover bg-gradient-to-b from-gray-700 to-black" />
                  </div>
                  <div className="absolute -top-3 w-6 h-6 bg-[#C0C0C0] rounded-full flex items-center justify-center text-xs font-black text-black z-10">2</div>
                  <div className="bg-gradient-to-t from-[rgba(192,192,192,0.2)] to-transparent w-full pt-4 pb-2 rounded-t-lg flex flex-col items-center border-t border-[#C0C0C0]/30">
                    <span className="text-[11px] font-bold text-white max-w-[90%] truncate">{topPlayers[1].username}</span>
                    <span className="text-[14px] font-black text-[#C0C0C0]">{activeTab === 'kills' ? topPlayers[1].kills : topPlayers[1].winnings}</span>
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {topPlayers.length > 0 && (
                <div className="flex flex-col items-center w-[35%] relative z-20">
                  <Trophy className="w-8 h-8 text-yellow-400 fill-yellow-400 mb-1 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] absolute -top-10" />
                  <div className="w-20 h-20 rounded-full border-[4px] border-yellow-400 bg-black overflow-hidden mb-2 shadow-[0_0_25px_rgba(250,204,21,0.5)]">
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${topPlayers[0].avatar}`} alt="Avatar" className="w-full h-full object-cover bg-gradient-to-b from-yellow-900 to-black" />
                  </div>
                  <div className="absolute -top-3 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-black text-black z-10 border-2 border-black">1</div>
                  <div className="bg-gradient-to-t from-[rgba(250,204,21,0.3)] to-[rgba(250,204,21,0.05)] w-full pt-4 pb-3 rounded-t-lg flex flex-col items-center border-t-2 border-yellow-400/50 shadow-[0_-5px_15px_rgba(250,204,21,0.15)]">
                    <span className="text-[12px] font-bold text-white max-w-[90%] truncate text-center">{topPlayers[0].username}</span>
                    <span className="text-[18px] font-black text-yellow-400 drop-shadow-md">{activeTab === 'kills' ? topPlayers[0].kills : topPlayers[0].winnings}</span>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {topPlayers.length > 2 && (
                <div className="flex flex-col items-center w-[30%] relative z-10">
                  <div className="w-14 h-14 rounded-full border-[3px] border-[#CD7F32] bg-black overflow-hidden mb-2 shadow-[0_0_15px_rgba(205,127,50,0.4)]">
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${topPlayers[2].avatar}`} alt="Avatar" className="w-full h-full object-cover bg-gradient-to-b from-orange-900 to-black" />
                  </div>
                  <div className="absolute -top-3 w-6 h-6 bg-[#CD7F32] rounded-full flex items-center justify-center text-xs font-black text-black z-10">3</div>
                  <div className="bg-gradient-to-t from-[rgba(205,127,50,0.2)] to-transparent w-full pt-4 pb-1 rounded-t-lg flex flex-col items-center border-t border-[#CD7F32]/30">
                    <span className="text-[11px] font-bold text-white max-w-[90%] truncate">{topPlayers[2].username}</span>
                    <span className="text-[14px] font-black text-[#CD7F32]">{activeTab === 'kills' ? topPlayers[2].kills : topPlayers[2].winnings}</span>
                  </div>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex flex-col gap-2.5">
              {topPlayers.slice(3).map((player, index) => (
                <div key={player.id} className="bg-[#1A0B2E] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 flex justify-center text-lg font-black text-gray-500 italic">
                    #{index + 4}
                  </div>
                  <div className="w-10 h-10 rounded-full border border-gray-600 bg-black overflow-hidden shrink-0">
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${player.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-sm font-bold text-white truncate">{player.username}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] text-gray-400">Pro Player</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[16px] font-black text-white leading-none mb-1">{activeTab === 'kills' ? player.kills : player.winnings}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{activeTab === 'kills' ? 'Kills' : 'Winnings'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
