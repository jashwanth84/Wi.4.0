import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, Gamepad2, Sparkles, Trophy } from 'lucide-react';

export default function ExclusiveGames() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'play_with_ads_coins';
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'games'), (snap) => {
      const allGames = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredGames = allGames.filter((g: any) => {
        const gType = g.gameType || 'play_with_ads_coins';
        return gType === type;
      });
      setGames(filteredGames);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, [type]);

  const isAdsMode = type === 'play_with_ads_coins';

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] font-sans pb-10">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0B0B0F] sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <button 
            aria-label="Back" 
            className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition" 
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-white font-black text-base tracking-wide uppercase flex items-center gap-1.5">
              {isAdsMode ? (
                <>
                  <span className="text-yellow-400">⚡</span> Ads Coins Options
                </>
              ) : (
                <>
                  <span className="text-emerald-400">🏆</span> Free Options
                </>
              )}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 px-4 py-6 flex flex-col gap-6">
        {/* Banner with Info */}
        <div className={`p-5 rounded-2xl border text-white relative overflow-hidden bg-gradient-to-br ${
          isAdsMode 
            ? 'from-[#1E1145] to-[#0A0515] border-yellow-500/10' 
            : 'from-[#061E14] to-[#0A0515] border-emerald-500/15'
        }`}>
          <div className="relative z-10">
            <h2 className="text-lg font-black tracking-wide uppercase flex items-center gap-2">
              {isAdsMode ? 'Play With Ads Coins' : 'Free Matches Section'}
              <Sparkles className={`w-4 h-4 ${isAdsMode ? 'text-yellow-400' : 'text-emerald-400'}`} />
            </h2>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-medium">
              {isAdsMode 
                ? 'Enjoy professional matches and exclusive tournaments backed by daily video ADS coins. Select your game below to view active lobbies!' 
                : 'Zero fees entry matches! Complete directly with other players to climb real rewards pools for free. Select your game to check results and upcoming rounds.'}
            </p>
          </div>
          <div className={`absolute -right-4 -bottom-4 text-8xl opacity-10 select-none`}>
            {isAdsMode ? '⚡' : '🏆'}
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex flex-col gap-1">
          <h3 className="text-zinc-200 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-violet-400" />
            Select Available Game
          </h3>
          <p className="text-zinc-500 text-[11px] font-medium leading-none">
            Games created by the administrator under this option category
          </p>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-violet-500 animate-spin"></div>
          </div>
        ) : games.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {games.map(game => (
              <div 
                key={game.id}
                onClick={() => navigate(`/tournaments?game=${encodeURIComponent(game.title)}`)}
                className="rounded-[18px] overflow-hidden bg-gradient-to-br from-[#120B24] to-[#1D0C3A] border border-white/5 hover:border-violet-500/30 flex flex-col relative aspect-[4/5] cursor-pointer group active:scale-[0.98] transition-all duration-300 shadow-xl"
              >
                <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden bg-[#0A0615]">
                  {game.image ? (
                    <img 
                      src={game.image} 
                      alt={game.title} 
                      className="w-full h-full object-cover absolute inset-0 z-0 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 z-0 bg-[#0F172A] flex flex-col items-center justify-center pt-2" />
                  )}
                </div>
                {/* Bottom title pill */}
                <div className="absolute bottom-2.5 left-2 z-10 w-[calc(100%-16px)]">
                  <div className="bg-white/95 backdrop-blur-md text-black px-2 py-1.5 rounded-xl truncate text-[11px] text-center font-black shadow-lg pointer-events-none uppercase">
                    {game.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-[#120B24]/40 rounded-2xl border border-white/5 text-zinc-500 text-xs font-medium">
            No games added in this category yet. Please check back later!
          </div>
        )}
      </div>
    </div>
  );
}
