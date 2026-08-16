import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Users, Map as MapIcon, Clock, Trophy, Target, Coins, Gamepad2, PlaySquare } from 'lucide-react';
import { format } from 'date-fns';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'completed'>('upcoming');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedGame = searchParams.get('game');
  const { dbUser } = useAuth();
  
  const currentBalance = (dbUser?.walletBalance || 0) + (dbUser?.bonusBalance || 0);

  useEffect(() => {
    const q = query(
      collection(db, 'tournaments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTournaments(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tournaments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTournaments = tournaments.filter(t => {
    if (selectedGame && t.game !== selectedGame) return false;
    if (activeTab === 'ongoing') return t.status === 'live' || t.status === 'ongoing';
    if (activeTab === 'completed') return t.status === 'completed' || t.status === 'cancelled';
    return t.status === 'upcoming';
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] font-sans">
      <header className="flex items-center justify-between px-4 py-3 bg-[#0B0B0F] sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold text-lg tracking-wide">{selectedGame ? `${selectedGame} Matches` : 'All Matches'}</h1>
        </div>
        <Link to="/wallet" className="flex items-center bg-white rounded flex-shrink-0 px-2.5 py-[3px] h-[30px]">
          <div className="w-[18px] h-[18px] rounded-full bg-yellow-400 flex items-center justify-center mr-1.5 shadow-sm overflow-hidden shrink-0">
             <span className="text-[10px] font-black text-white" style={{ WebkitTextStroke: '0.5px #B45309' }}>C</span>
          </div>
          <p className="text-[14px] font-bold text-black font-mono leading-none tracking-tight">{currentBalance.toFixed(2)}</p>
        </Link>
      </header>

      <div className="bg-[#0B0B0F] flex flex-col border-b border-white/5">
        <nav className="flex justify-center space-x-10 py-3 text-sm">
          {['ongoing', 'upcoming', 'results'].map((tab) => {
            const mappedTab = tab === 'results' ? 'completed' : tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(mappedTab as any)}
                className={`py-1 transition-colors uppercase ${
                  activeTab === mappedTab
                    ? 'text-[#FF4A4A] font-bold border-b-2 border-[#FF4A4A]'
                    : 'text-gray-500 font-normal hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-grow flex flex-col gap-4 p-4">
        {loading ? (
          <div className="w-full h-[50vh] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="w-full flex-1 flex items-center justify-center mt-20">
            <p className="text-white font-semibold text-base text-center">
              No {activeTab === 'completed' ? 'Result' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Match Found.
            </p>
          </div>
        ) : (
          filteredTournaments.map(tournament => (
            <div key={tournament.id} className="w-full rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-[#1C1C28] border border-white/5 mx-auto overflow-hidden group hover:border-[#FF4A4A]/50 transition-colors duration-300">
              <div className="w-full h-[140px] flex justify-center items-center bg-[#0B0B0F] text-gray-600 font-semibold text-lg select-none relative overflow-hidden">
                 <img 
                   src={tournament.imageUrl || tournament.image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${tournament.id || 'arena'}&flip=true`}
                   alt="Match Banner" 
                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                   style={{ backgroundColor: (tournament.imageUrl || tournament.image) ? 'transparent' : '#1e1147' }} 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0B1221] to-transparent"></div>
                 <div className="absolute top-2 left-2 bg-black/60 backdrop-blur border border-white/10 px-2 py-1 rounded text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                   {tournament.game || 'FREE FIRE'}
                 </div>
                 {tournament.type && (
                   <div className="absolute top-2 right-2 bg-blue-600/80 backdrop-blur px-2 py-1 rounded text-white text-[10px] font-bold uppercase tracking-wider">
                     {tournament.type}
                   </div>
                 )}
              </div>
              <div className="p-4 flex flex-col relative z-10 -mt-8">
                <Link to={`/tournaments/${tournament.id}`} className="block flex-grow cursor-pointer">
                  <div className="flex items-end space-x-3 mb-4">
                    <div className="p-1 bg-[#1C1C28] rounded-xl border border-white/10 shadow-lg">
                      <img 
                        className="w-14 h-14 object-cover rounded-lg border border-white/5 bg-[#0B0B0F]" 
                        src={tournament.logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${tournament.title}&backgroundColor=0e1111`} 
                        width="60" height="60" alt="Game logo"
                      />
                    </div>
                    <div className="pb-1">
                      <h2 className="text-white font-black text-lg leading-tight truncate">{tournament.title}</h2>
                      <div className="flex items-center gap-1.5 text-[#FF4A4A] text-xs font-bold mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{tournament.startTime ? format(new Date(tournament.startTime.toDate()), "dd MMM yyyy, hh:mm a") : tournament.date || 'TBA'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-[#0B0B0F] rounded-xl p-2 border border-white/5 flex flex-col items-center justify-center text-center group-hover:bg-[#1C1C28] transition-colors">
                      <p className="text-gray-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-yellow-500"/> PRIZE</p>
                      <div className="text-yellow-400 font-black text-base flex items-center justify-center space-x-1">
                        <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                          <span className="text-[8px] font-black text-[#0B1221]" style={{ WebkitTextStroke: '0.2px #0B1221' }}>C</span>
                        </div>
                        <span>{tournament.prizePool}</span>
                      </div>
                    </div>
                    <div className="bg-[#0B0B0F] rounded-xl p-2 border border-white/5 flex flex-col items-center justify-center text-center group-hover:bg-[#1C1C28] transition-colors">
                      <p className="text-gray-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1"><Target className="w-3.5 h-3.5 text-red-500"/> PER KILL</p>
                      <div className="text-white font-bold text-base flex items-center justify-center space-x-1">
                        <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                          <span className="text-[8px] font-black text-[#0B1221]" style={{ WebkitTextStroke: '0.2px #0B1221' }}>C</span>
                        </div>
                        <span>{tournament.perKillReward || 0}</span>
                      </div>
                    </div>
                    <div className="bg-[#0B0B0F] rounded-xl p-2 border border-white/5 flex flex-col items-center justify-center text-center group-hover:bg-[#1C1C28] transition-colors relative overflow-hidden">
                      {tournament.entryFee === 0 && <div className="absolute inset-0 bg-green-500/5"></div>}
                      <p className="text-gray-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-blue-400"/> ENTRY</p>
                      <div className={`font-bold text-base flex items-center justify-center space-x-1 ${tournament.entryFee === 0 ? 'text-green-400' : 'text-white'}`}>
                        {tournament.entryFee > 0 ? (
                          <>
                            <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                              <span className="text-[8px] font-black text-[#0B1221]" style={{ WebkitTextStroke: '0.2px #0B1221' }}>C</span>
                            </div>
                            <span>{tournament.entryFee}</span>
                          </>
                        ) : (
                          <span>FREE</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-300 font-medium bg-black/20 p-2 rounded-lg border border-white/5 mb-4">
                    <div className="flex items-center gap-1.5"><MapIcon className="w-3.5 h-3.5 text-gray-400" /> {tournament.map || 'Bermuda'}</div>
                    <div className="w-px h-3 bg-white/20"></div>
                    <div className="flex items-center gap-1.5"><Gamepad2 className="w-3.5 h-3.5 text-gray-400" /> {tournament.version || 'TPP'}</div>
                    <div className="w-px h-3 bg-white/20"></div>
                    <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /> {tournament.type || 'Solo'}</div>
                  </div>
                </Link>
                
                {activeTab === 'upcoming' && (
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex-1 bg-[#0B0B0F] border border-white/5 rounded-xl p-2.5 shadow-inner">
                       <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-2 uppercase">
                          <span>Slots Filled</span>
                          <span className="text-white">{tournament.slotsFilled || 0}/{tournament.slotsTotal}</span>
                       </div>
                      <div className="h-2 w-full rounded-full bg-[#1C1C28] relative overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-[#FF4A4A] to-[#DC2626] absolute top-0 left-0 transition-all duration-500 shadow-[0_0_10px_rgba(255,74,74,0.8)]" 
                          style={{ width: `${Math.min(((tournament.slotsFilled || 0) / (tournament.slotsTotal || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <Link 
                      to={`/tournaments/${tournament.id}`} 
                      className={`font-black tracking-wider px-6 py-3.5 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] border border-white/10 transition uppercase text-[13px] flex items-center justify-center text-white ${
                        (tournament.slotsFilled || 0) >= tournament.slotsTotal 
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700 shadow-none' 
                          : 'bg-gradient-to-r from-[#FF4A4A] to-[#DC2626] hover:from-[#ef4444] hover:to-[#b91c1c] shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                      }`}
                    >
                      {(tournament.slotsFilled || 0) >= tournament.slotsTotal ? 'FULL' : 'JOIN'}
                    </Link>
                  </div>
                )}
                {activeTab === 'ongoing' && (
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black tracking-wider uppercase px-6 py-3 rounded-lg shadow-lg border border-white/10 hover:from-blue-500 hover:to-indigo-500 transition w-full mt-2 flex items-center justify-center gap-2">
                    <PlaySquare className="w-4 h-4" /> SPECTATE MATCH
                  </button>
                )}
                {activeTab === 'completed' && (
                  <div className="flex justify-between gap-3 mt-2">
                    <button className="flex-1 bg-[#1A223E] border border-white/10 text-white font-black tracking-wider uppercase py-3 px-4 rounded-lg shadow-md hover:bg-[#232F52] transition flex items-center justify-center gap-2 text-sm">
                      <PlaySquare className="w-4 h-4 text-gray-400" /> WATCH
                    </button>
                    <button className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black tracking-wider uppercase py-3 px-4 rounded-lg shadow-md hover:from-emerald-500 hover:to-teal-500 transition flex items-center justify-center gap-2 text-sm">
                      <Trophy className="w-4 h-4" /> RESULTS
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
