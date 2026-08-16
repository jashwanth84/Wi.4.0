import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Ticket, Gem, Coins, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function MyRewards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const filtered = data
        .filter(tx => tx.type === 'bonus')
        .sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
          return tB - tA;
        });
      setRewards(filtered);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] font-sans pb-20">
      <header className="flex items-center px-4 py-3 bg-[#12182F] sticky top-0 z-20 shadow-md border-b border-white/5">
        <div className="flex items-center space-x-3 w-full">
          <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold text-[17px] tracking-wide">My Rewards</h1>
        </div>
      </header>

      <div className="flex flex-col px-4 pt-6 w-full gap-4">
        {loading ? (
           <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : rewards.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-[#1C093B]/20 rounded-2xl border border-white/5 mx-2">
              <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                 <Gift className="w-10 h-10 text-yellow-400 opacity-60" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Rewards Yet</h3>
              <p className="text-gray-400 text-sm max-w-[250px]">You haven't earned any bonus rewards yet. Participate in matches or use referrals to earn.</p>
           </div>
        ) : (
          rewards.map((reward) => (
            <div key={reward.id} className="bg-[#1C093B]/60 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-[#1C093B] transition-colors cursor-pointer shadow-sm">
              <div className={`w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0`}>
                 <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-white font-bold text-[15px]">{reward.description || 'Bonus Reward'}</span>
                <span className="text-gray-400 text-[12px] mt-0.5">{reward.createdAt?.toDate ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(reward.createdAt.toDate()) : 'Recent'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-black text-[16px] text-yellow-500">+₹{reward.amount}</span>
                <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded mt-1 capitalize">{reward.status || 'Success'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
