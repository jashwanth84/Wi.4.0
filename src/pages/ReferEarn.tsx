import React from 'react';
import { 
  Users,
  Copy,
  Share2,
  Gift,
  Coins,
  Ticket,
  Gem,
  CheckCircle2,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ReferEarn() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const referralCode = `NG-${user?.uid?.substring(0, 6).toUpperCase() || 'FREE123'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join App',
        text: `Use my referral code ${referralCode} to get free starting bonuses!`,
        url: window.location.origin
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0515] font-sans pb-20">
      <header className="flex items-center px-4 py-4 bg-[#0A0515] sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center space-x-3 w-full">
          <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 stroke-[2.5px]" />
          </button>
          <h1 className="text-white font-bold text-[18px] tracking-wide uppercase">Refer & Earn</h1>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 py-6 w-full max-w-[500px] mx-auto">
        {/* Header section */}
        <div className="text-center mb-2">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase drop-shadow-md">
            REFER & <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">EARN</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Invite friends and unlock exclusive rewards</p>
        </div>

        {/* Referral Code Card */}
        <div className="bg-[#120B24] rounded-2xl p-5 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
          <span className="text-[11px] font-bold text-[#A78BFA] tracking-wider uppercase mb-2 block">Your Referral Code</span>
          <div className="bg-[#0A0515]/80 border border-white/10 rounded-xl py-3 px-4 flex items-center justify-between mb-4">
            <span className="font-mono font-bold text-xl tracking-widest text-[#FBBF24]">{referralCode}</span>
            <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Copy className="w-5 h-5 text-gray-300" />
            </button>
          </div>
          <button onClick={shareReferral} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            <Share2 className="w-5 h-5" />
            SHARE WITH FRIENDS
          </button>
        </div>

        {/* Rewards Types */}
        <div>
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#A78BFA]" /> Referral Rewards
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#120B24] border border-white/5 shadow-sm rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/15 flex items-center justify-center shrink-0">
                 <span className="text-[#34D399] font-black text-lg">C</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-zinc-400 font-medium leading-tight mb-0.5">Bonus</span>
                <span className="text-[13px] font-bold text-white">10 Coins / user</span>
              </div>
            </div>
            <div className="bg-[#120B24] border border-white/5 shadow-sm rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F59E0B]/15 flex items-center justify-center shrink-0">
                 <Coins className="w-5 h-5 text-[#FBBF24]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-zinc-400 font-medium leading-tight mb-0.5">Wallet</span>
                <span className="text-[13px] font-bold text-white">Extra Rewards</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
