import React, { useState } from 'react';
import { ArrowLeft, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function WithdrawCoins() {
  const navigate = useNavigate();
  const { user, dbUser } = useAuth();
  
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [loading, setLoading] = useState(false);

  const winningBalance = dbUser?.winningBalance || 0;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > winningBalance) {
      toast.error('Insufficient winning balance');
      return;
    }

    if (method === 'upi' && !upiId) {
      toast.error('Please enter UPI ID');
      return;
    }

    if (method === 'bank' && (!accountName || !accountNumber || !ifscCode)) {
      toast.error('Please fill all bank details');
      return;
    }

    setLoading(true);
    try {
      const withdrawalData = {
        userId: user.uid,
        userEmail: user.email,
        username: dbUser?.username || 'Unknown',
        amount: withdrawAmount,
        type: 'withdrawal',
        status: 'pending',
        method,
        details: method === 'upi' 
          ? { upiId } 
          : { accountName, accountNumber, ifscCode },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'wallet_transactions'), withdrawalData);
      
      toast.success('Withdrawal request submitted successfully');
      navigate('/wallet');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] font-sans pb-20">
      <header className="flex items-center px-4 py-4 bg-[#0B0B0F] sticky top-0 z-20">
        <div className="flex items-center space-x-3 w-full">
          <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-[20px] tracking-wide">Withdraw Coins</h1>
        </div>
      </header>

      <main className="p-4 flex-1">
        <div className="bg-[#170a29] rounded-[1.8rem] p-6 shadow-lg mb-6 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-[#847894] font-black uppercase tracking-wider text-xs">WINNING BALANCE</p>
              <p className="text-white font-bold text-xl">{winningBalance.toFixed(2)} Coins</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Note: You can only withdraw from your winning balance.
          </p>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300">Amount to Withdraw</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#1A1A24] border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter amount"
                min="1"
                max={winningBalance}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-300">Withdrawal Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`py-3 rounded-xl border font-bold transition-colors ${
                  method === 'upi' 
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                    : 'bg-[#1A1A24] border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                UPI Transfer
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`py-3 rounded-xl border font-bold transition-colors ${
                  method === 'bank' 
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                    : 'bg-[#1A1A24] border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                Bank Transfer
              </button>
            </div>
          </div>

          {method === 'upi' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="text-sm font-bold text-gray-300">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="e.g. username@upi"
              />
            </div>
          )}

          {method === 'bank' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-300">Account Holder Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter name on bank account"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-300">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter account number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-300">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#1A1A24] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="e.g. SBIN0001234"
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !amount || Number(amount) <= 0}
              className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Withdraw Now'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
