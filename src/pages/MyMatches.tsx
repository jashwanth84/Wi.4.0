import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, PlayCircle, Clock, CheckCircle2, Search, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';

export default function MyMatches() {
  const { user, dbUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') as 'ongoing' | 'upcoming' | 'completed' | null;
  const [activeTab, setActiveTab] = useState<'ongoing' | 'upcoming' | 'completed'>(tabParam || 'upcoming');
  
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabParam && ['ongoing', 'upcoming', 'completed'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'tournaments'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid requiring a composite index
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setTournaments(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tournaments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getEmptyStateText = () => {
    switch (activeTab) {
      case 'ongoing': return 'No Live Match Found.';
      case 'upcoming': return 'No Upcoming Match Found.';
      case 'completed': return 'No Completed Match Found.';
      default: return 'No Match Found.';
    }
  };

  const currentBalance = (dbUser?.walletBalance || 0) + (dbUser?.bonusBalance || 0);

  // Map our app statuses to the tab expected statuses
  const filteredTournaments = tournaments.filter(t => {
    if (activeTab === 'ongoing') return t.status === 'live' || t.status === 'ongoing';
    if (activeTab === 'completed') return t.status === 'completed' || t.status === 'cancelled';
    return t.status === 'upcoming' || t.status === 'open' || !t.status || t.status === 'active';
  });

  return (
    <div className="flex flex-col min-h-screen bg-black w-full pb-20 font-sans">
      <div className="bg-black sticky top-0 z-20 w-full pt-4 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 mr-3 text-white hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-[18px] font-bold text-white tracking-wide">My Matches</h1>
          </div>
          <Link to="/wallet" className="flex items-center bg-white rounded flex-shrink-0 px-2.5 py-[3px] h-[30px]">
            <div className="w-[18px] h-[18px] rounded-full bg-yellow-400 flex items-center justify-center mr-1.5 shadow-sm overflow-hidden shrink-0">
               <span className="text-[10px] font-black text-white" style={{ WebkitTextStroke: '0.5px #B45309' }}>C</span>
            </div>
            <p className="text-[14px] font-bold text-black font-mono leading-none tracking-tight">{currentBalance.toFixed(2)}</p>
          </Link>
        </div>
        
        <div className="flex items-center justify-around w-full px-2 mt-4">
          {['ongoing', 'upcoming', 'results'].map((tab) => {
            const mappedTab = tab === 'results' ? 'completed' : tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(mappedTab as any)}
                className={`py-2 px-4 text-[13px] font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === mappedTab 
                    ? 'text-[#FF4A4A] border-[#FF4A4A] font-bold' 
                    : 'text-[#888888] border-transparent'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center">
         {loading ? (
             <div className="w-full h-[50vh] flex items-center justify-center">
                 <div className="w-6 h-6 rounded-full border-2 border-t-white animate-spin" style={{ borderColor: 'rgba(255,255,255,0.2)' }}></div>
             </div>
         ) : filteredTournaments.length === 0 ? (
             <div className="w-full h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-2xl">
                   🎮
                 </div>
                 <h2 className="text-[17px] font-bold text-white tracking-wide mb-2">{getEmptyStateText()}</h2>
                 <p className="text-zinc-500 text-xs max-w-xs mb-6">
                   You haven't joined any {activeTab} matches yet. Explore active lobbies and join to start competing!
                 </p>
                 <Link 
                   to="/tournaments"
                   className="bg-gradient-to-r from-[#FF4A4A] to-[#DC2626] text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition active:scale-95 flex items-center gap-2"
                 >
                   <span>EXPLORE MATCHES</span>
                   <ChevronRight className="w-4 h-4" />
                 </Link>
             </div>
         ) : (
            <div className="w-full p-2 space-y-3">
              {filteredTournaments.map((tournament, idx) => (
                 <div key={tournament.id || idx} className="bg-[#130E2E] rounded-xl flex flex-col overflow-hidden w-full border border-white/5 shadow-md">
                    {/* Event Banner */}
                    <div className="relative aspect-[16/9] w-full bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/adventurer/svg?seed=${tournament.id || 'arena'}&flip=true')`, backgroundColor: '#3B82F6' }}>
                      <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>JOINED</span>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="flex flex-col p-3">
                       {/* Badges / Announcement */}
                       <div className="flex items-center gap-2 mb-3">
                          <div className="bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm shrink-0 uppercase tracking-widest">{tournament.type || 'Solo'}</div>
                          <div className="bg-[#E56A15] text-white text-[11px] font-bold px-2 py-1 rounded w-full flex items-center justify-center shadow-inner tracking-wide">
                             Join Come - Get Fastest Withdrawal - 100% Safe
                          </div>
                       </div>
                       
                       {/* Title Area */}
                       <div className="flex items-center gap-3 mb-3 shrink-0">
                          <div className="w-12 h-12 rounded-full bg-black border-2 border-white overflow-hidden shrink-0">
                             <img src={`https://api.dicebear.com/7.x/initials/svg?seed=NE&backgroundColor=0e1111`} alt="img" className="w-full h-full object-cover" />
                          </div>
                          <h3 className="text-[15px] font-bold text-white capitalize leading-snug">{tournament.title || `FULL MAP ${tournament.type || 'SOLO'} PER KILL - Match #${idx + 1}`}</h3>
                       </div>
                       
                       {/* Stats Grid */}
                       <div className="grid grid-cols-3 border-t border-b border-white/20 py-2.5 mb-2 mt-1">
                          <div className="flex flex-col items-center justify-center border-r border-white/20 px-1">
                             <span className="text-white text-[12px] font-bold">{tournament.startTime ? format(new Date(tournament.startTime.toDate()), "dd/MM/yyyy") : (tournament.date?.split(',')[0] || 'TBA')}</span>
                             <span className="text-white text-[12px] font-bold">{tournament.startTime ? format(new Date(tournament.startTime.toDate()), "hh:mm a") : (tournament.date?.split(',')[1] || '')}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center border-r border-white/20 px-1">
                             <span className="text-white text-[11px] font-bold uppercase tracking-wider mb-1">PRIZE POOL</span>
                             <div className="flex items-center gap-1">
                               <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center border-[0.5px] border-yellow-500">
                                  <span className="text-[8px] font-black text-white" style={{ WebkitTextStroke: '0.5px #B45309' }}>C</span>
                               </div>
                               <span className="text-white text-[13px] font-bold">{tournament.prizePool}</span>
                               <ChevronDown className="w-4 h-4 text-gray-400" />
                             </div>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1">
                             <span className="text-white text-[11px] font-bold uppercase tracking-wider mb-1">PER KILL</span>
                             <div className="flex items-center gap-1">
                               <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center border-[0.5px] border-yellow-500">
                                  <span className="text-[8px] font-black text-white" style={{ WebkitTextStroke: '0.5px #B45309' }}>C</span>
                               </div>
                               <span className="text-white text-[13px] font-bold">{tournament.perKillReward || 0}</span>
                             </div>
                          </div>
                       </div>
                       
                       {/* Entry & Details link */}
                       <div className="flex items-center justify-between w-full pt-1.5 h-10">
                          <div className="flex flex-col w-[55%] justify-center h-full gap-1 pl-1">
                             <div className="flex items-center justify-between text-white text-[12px] font-bold leading-none">
                                <span>Slots: {tournament.slotsFilled || 1}/{tournament.slotsTotal || 100}</span>
                             </div>
                             <div className="w-full bg-[#521321] h-[5px] rounded-full overflow-hidden shrink-0">
                                <div className="bg-[#1C5EEB] h-full" style={{ width: `${Math.min(100, ((tournament.slotsFilled || 1) / (tournament.slotsTotal || 100)) * 100)}%` }}></div>
                             </div>
                          </div>
                          
                          {/* View Details Button */}
                          <Link to={`/tournaments/${tournament.id}`} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg flex items-center tracking-wide px-3 min-w-[110px] justify-center h-9 font-bold shadow transition-transform active:scale-95 shrink-0 ml-3">
                             <span className="text-[12px] uppercase font-bold mr-1">VIEW ROOM</span>
                             <ChevronRight className="w-[14px] h-[14px]" strokeWidth={3} />
                          </Link>
                       </div>
                       
                    </div>
                 </div>
              ))}
            </div>
         )}
      </div>
    </div>
  );
}
