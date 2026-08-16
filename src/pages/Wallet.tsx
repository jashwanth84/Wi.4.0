import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Wallet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, dbUser, loading: authLoading } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Convert wallet values to string with fallbacks
  const totalBalance = (dbUser?.totalBalance || 0).toFixed(2);
  const deposited = (dbUser?.depositBalance || 0).toFixed(2);
  const winning = (dbUser?.winningBalance || 0).toFixed(2);
  const earnings = (dbUser?.earnings || 0); // Assuming integer for earnings/payouts in UI like the image
  const payouts = (dbUser?.payouts || 0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const sorted = data.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return tB - tA;
      });
      setTransactions(sorted);
      setLoadingHistory(false);
    }, (err) => {
      console.error(err);
      setLoadingHistory(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const checkOrder = async () => {
      const orderId = searchParams.get('verify_order');
      if (orderId && user) {
        setVerifying(true);
        try {
          // Remove the parameter from URL without reloading
          window.history.replaceState({}, '', '/wallet');
          
          const res = await fetch('/api/verify-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
          });
          
          const data = await res.json();
          if (data.status === 'success' && data.data?.status === 'Success') {
            toast.success('Payment successful! Coins added to your wallet.');
          } else if (data.data?.status === 'Pending') {
            toast.success('Payment is pending. It will be added once confirmed.');
          } else {
            toast.error('Payment failed or cancelled.');
          }
        } catch (error) {
           console.error("Verification failed:", error);
        } finally {
          setVerifying(false);
        }
      }
    };
    if (!authLoading) {
      checkOrder();
    }
  }, [searchParams, user, authLoading]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0515] font-sans pb-20">
      {/* TOP SECTION */}
      <div className="bg-[#0A0515] pb-6">
        <header className="flex items-center px-4 py-3 bg-[#0A0515] sticky top-0 z-20">
          <div className="flex items-center space-x-3 w-full">
            <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-6 h-6 stroke-[3px]" />
            </button>
            <h1 className="text-white font-black text-[20px] tracking-wide">My Wallet</h1>
          </div>
        </header>

        {verifying && (
          <div className="bg-[#170a29] border border-[#7C3AED]/50 m-4 rounded-xl p-4 flex items-center justify-center space-x-2 text-white animate-pulse">
             <div className="w-4 h-4 rounded-full border-2 border-[#7C3AED] border-t-white animate-spin"></div>
             <span className="font-bold text-sm">Verifying your payment...</span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center mt-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#fbbc04] flex items-center justify-center shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]">
               <span className="text-[#a47a00] font-serif font-black text-lg pb-0.5">C</span>
            </div>
            <span className="text-white text-[32px] font-black">{totalBalance}</span>
          </div>
        </div>

        <div className="flex px-4 gap-3 mt-8 justify-center max-w-sm mx-auto">
          {/* Deposited block */}
          <div className="bg-[#1D0C3A] border border-[#7C3AED]/30 rounded-xl p-3 flex-1 flex flex-col items-center justify-center shadow-lg">
             <div className="flex items-center gap-1">
               <div className="w-3.5 h-3.5 rounded-full bg-[#fbbc04] flex items-center justify-center">
                 <span className="text-[7.5px] text-[#a47a00] font-serif font-black">C</span>
               </div>
               <span className="text-white font-black text-[14px]">{deposited}</span>
             </div>
             <span className="text-zinc-400 text-[11px] font-bold mt-1 uppercase tracking-wide">Deposited</span>
          </div>
          {/* Winning block */}
          <div className="bg-[#1D0C3A] border border-[#7C3AED]/30 rounded-xl p-3 flex-1 flex flex-col items-center justify-center shadow-lg">
             <div className="flex items-center gap-1">
               <div className="w-3.5 h-3.5 rounded-full bg-[#fbbc04] flex items-center justify-center">
                 <span className="text-[7.5px] text-[#a47a00] font-serif font-black">C</span>
               </div>
               <span className="text-white font-black text-[14px]">{winning}</span>
             </div>
             <span className="text-zinc-400 text-[11px] font-bold mt-1 uppercase tracking-wide">Winning</span>
          </div>
          {/* Bonus block */}
          <div className="bg-[#1D0C3A] border border-[#7C3AED]/30 rounded-xl p-3 flex-1 flex flex-col items-center justify-center shadow-lg">
             <div className="flex items-center gap-1">
               <div className="w-3.5 h-3.5 rounded-full bg-[#fbbc04] flex items-center justify-center">
                 <span className="text-[7.5px] text-[#a47a00] font-serif font-black">C</span>
               </div>
               <span className="text-white font-black text-[14px]">{dbUser?.bonusBalance || '0.00'}</span>
             </div>
             <span className="text-zinc-400 text-[11px] font-bold mt-1 uppercase tracking-wide">Bonus</span>
          </div>
        </div>
      </div>

      {/* SEPARATOR GAP */}
      <div className="h-2 bg-[#120B24] w-full border-y border-white/5"></div>

      {/* BOTTOM SECTION */}
      <div className="flex-1 bg-[#0A0515] pt-6 px-4">
        <h2 className="text-white font-extrabold text-[16px] mb-6 tracking-wide uppercase">Actions</h2>

        <div className="grid grid-cols-3 gap-3">
           {/* Add Coins */}
           <div onClick={() => navigate('/add-coins')} className="bg-[#120B24] hover:bg-[#1E1135] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col items-center justify-center p-3 py-5 aspect-[4/4.5] cursor-pointer active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/50 flex items-center justify-center mb-3">
                 <ArrowDownLeft className="w-6 h-6 text-[#60A5FA]" strokeWidth={2.5} />
              </div>
              <span className="text-white text-[11.5px] font-bold whitespace-nowrap tracking-wide">Add Coins</span>
           </div>
           {/* Withdraw Coins */}
           <div onClick={() => navigate('/withdraw-coins')} className="bg-[#120B24] hover:bg-[#1E1135] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col items-center justify-center p-3 py-5 aspect-[4/4.5] cursor-pointer active:scale-95 transition-transform">
               <div className="w-12 h-12 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/50 flex items-center justify-center mb-3">
                 <ArrowUpRight className="w-6 h-6 text-[#F87171]" strokeWidth={2.5} />
              </div>
              <span className="text-white text-[11.5px] font-bold whitespace-nowrap tracking-wide">Withdraw</span>
           </div>
           {/* Transactions */}
           <div onClick={() => window.scrollTo({top: 400, behavior:'smooth'})} className="bg-[#120B24] hover:bg-[#1E1135] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col items-center justify-center p-3 py-5 aspect-[4/4.5] cursor-pointer active:scale-95 transition-transform">
               <div className="w-12 h-12 rounded-full bg-[#10B981]/20 border border-[#10B981]/50 flex items-center justify-center mb-3">
                 <svg className="w-6 h-6 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
              </div>
              <span className="text-white text-[11.5px] font-bold whitespace-nowrap tracking-wide">History</span>
           </div>
        </div>

        <div className="mt-8 flex justify-center">
           <button onClick={() => navigate('/my-profile')} className="bg-[#35108b] text-white font-extrabold text-[12px] px-8 py-3.5 rounded-full flex items-center gap-3 shadow-[0_4px_20px_rgba(53,16,139,0.5)] active:scale-95 transition-transform uppercase tracking-wider">
             Update Withdrawal Details
             <ArrowRight className="w-4 h-4 stroke-[3px]" />
           </button>
        </div>

        <div className="mt-12 mb-8">
          <h2 className="text-white font-extrabold text-[15px] mb-4 uppercase tracking-widest">Transactions List</h2>
          
          <div className="flex flex-col gap-3">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-zinc-500 py-8 text-sm bg-[#120B24] rounded-xl border border-white/5">No transactions yet</div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-[#120B24] border border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.3)] rounded-xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'winning' ? 'bg-[#10B981]/15 text-[#34D399]' : 'bg-[#EF4444]/15 text-[#F87171]'}`}>
                         {tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'winning' ? <ArrowDownLeft className="w-5 h-5 stroke-[2.5px]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.5px]" />}
                      </div>
                      <div>
                         <div className="text-white font-bold text-sm capitalize tracking-wide">{tx.type.replace('_', ' ')}</div>
                         <div className="text-zinc-500 text-[11px] font-medium mt-0.5">
                           {tx.createdAt?.toDate ? new Date(tx.createdAt.toDate()).toLocaleDateString() : 'Pending'} • {tx.status || 'Completed'}
                         </div>
                      </div>
                   </div>
                   <div className={`font-black tracking-wider text-[15px] ${tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'winning' ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                      {tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'winning' ? '+' : '-'}{tx.amount}
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
