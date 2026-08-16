import React, { useState } from 'react';
import { ArrowLeft, Copy, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function AddCoins() {
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();
  
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const order_id = `${user.uid}_${Date.now()}`;
      const returnUrl = `${window.location.origin}/wallet?verify_order=${order_id}`;
      
      const payload = {
        order_id,
        amount: parseFloat(amount),
        customer_mobile: "0000000000",
        remark: "Add Coins Wallet",
        success_url: returnUrl,
        failed_url: returnUrl
      };

      // Call our express server backend
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.status === 'success' && data.payment_url) {
        // Also create a pending record in firestore
        const depositRef = collection(db, 'deposit_requests');
        await addDoc(depositRef, {
          userId: user.uid,
          username: dbUser?.username || user.displayName || 'Unknown',
          amount: parseFloat(amount),
          order_id,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
        
        window.location.href = data.payment_url;
      } else {
        toast.error(data.message || 'Payment initiation failed');
        setLoading(false);
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error('Failed to submit request');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black font-sans pb-20">
      <header className="flex items-center px-4 py-4 bg-black sticky top-0 z-20 shadow-md">
        <div className="flex items-center space-x-3 w-full">
          <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-[20px] tracking-wide">Add Coins</h1>
        </div>
      </header>

      <div className="px-4 mt-6 max-w-md mx-auto w-full">
        <div className="bg-[#170a29] rounded-[1.8rem] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col items-center border border-white/5">
          <p className="text-[#847894] font-medium text-sm text-center mb-6">Enter Amount to Add</p>

          <form onSubmit={handleDepositRequest} className="w-full space-y-6">
            <div>
              <label className="text-[#847894] text-xs uppercase font-bold tracking-wider block mb-1.5 ml-1">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="1"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-9 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors font-bold text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full bg-brand-purple hover:bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg transform transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'PROCEED TO PAY'
              )}
            </button>
            <p className="text-center text-[#847894] text-xs pt-2">Powered by ZapUPI Secure Gateway</p>
          </form>
        </div>
      </div>
    </div>
  );
}
