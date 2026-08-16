import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Bell, 
  User, 
  Wallet, 
  Gamepad2, 
  ShoppingCart, 
  BarChart2, 
  Gift, 
  Users, 
  Flag,
  Shield, 
  Star, 
  BarChart3, 
  HelpCircle, 
  Info, 
  Headphones, 
  Share2, 
  ClipboardList, 
  Globe, 
  Power,
  ChevronRight,
  X,
  Check
} from 'lucide-react';

export default function Profile() {
  const { dbUser, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Bengali'];

  const handleSignOut = () => {
    signOut(auth);
  };

  const showComingSoon = () => {
    toast('Coming Soon!', {
      icon: '🚧',
    });
  };

  const isReallyAdmin = isAdmin || dbUser?.isAdmin === true || dbUser?.role === 'admin' || dbUser?.role === 'staff' || user?.email === 'malleshr20944@gmail.com';

  const menuItems = [
    ...(isReallyAdmin ? [{ icon: <Shield className="w-[18px] h-[18px] text-[#FF4500]" strokeWidth={2.5} />, label: 'Admin Dashboard', onClick: () => navigate('/admin') }] : []),
    { icon: <Bell className="w-[18px] h-[18px] text-white fill-white" />, label: 'Push Notification', rightElement: <div className={`w-[36px] h-5 rounded-full flex items-center p-0.5 cursor-pointer ${pushEnabled ? 'bg-blue-600' : 'bg-black/80'} transition-colors duration-200`} onClick={(e) => { e.stopPropagation(); setPushEnabled(!pushEnabled); }}><div className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${pushEnabled ? 'translate-x-4 bg-white' : 'translate-x-0 bg-[#2D2D2D]'}`} /></div>, onClick: () => setPushEnabled(!pushEnabled) },
    { icon: <User className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'My Profile', onClick: () => navigate('/my-profile') },
    { icon: <Wallet className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'My Wallet', onClick: () => navigate('/wallet') },
    { icon: <Gamepad2 className="w-[18px] h-[18px] text-white fill-white" />, label: 'My Matches', onClick: () => navigate('/my-matches') },
    { icon: <ShoppingCart className="w-[18px] h-[18px] text-white fill-white" />, label: 'My Order', onClick: () => navigate('/my-orders') },
    { icon: <BarChart2 className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'My Statistics', onClick: () => navigate('/my-statistics') },
    { icon: <Gift className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'My Rewards', onClick: () => navigate('/my-rewards') },
    { icon: <Users className="w-[18px] h-[18px] text-white fill-white" />, label: 'My Referrals', onClick: () => navigate('/earn') },
    { icon: <Flag className="w-[18px] h-[18px] text-white fill-white" />, label: 'Announcement', onClick: () => navigate('/announcement') },
    { icon: <Star className="w-[18px] h-[18px] text-white fill-white" />, label: 'Top Players', onClick: () => navigate('/leaderboard') },
    { icon: <BarChart3 className="w-[18px] h-[18px] text-white" strokeWidth={3} />, label: 'Leaderboard', onClick: () => navigate('/leaderboard') },
    { icon: <HelpCircle className="w-[18px] h-[18px] text-white fill-white text-[#1A0B2E]" />, label: 'App Tutorial', onClick: () => navigate('/tutorial') },
    { icon: <Info className="w-[18px] h-[18px] text-white fill-white text-[#1A0B2E]" />, label: 'About us', onClick: () => navigate('/about') },
    { icon: <Headphones className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'Customer Support', onClick: () => window.open("https://wa.me/qr/HVVVHOUFP6MZO1", "_blank") },
    { icon: <Share2 className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'Share App', onClick: () => {
        if (navigator.share) {
          navigator.share({ title: 'NG ESPORTS', url: window.location.origin });
        } else {
          toast.success('Link copied to clipboard!');
          navigator.clipboard.writeText(window.location.origin);
        }
    }},
    { icon: <ClipboardList className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'Terms & Conditions', onClick: () => navigate('/terms') },
    { icon: <Globe className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'Change Language', onClick: () => setIsLanguageModalOpen(true) },
    { icon: <Power className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />, label: 'Logout', onClick: handleSignOut },
  ];

  return (
    <div className="flex flex-col px-4 py-6 font-sans max-w-[500px] mx-auto w-full pb-20 items-center overflow-x-hidden relative">
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-[100px] h-[100px] rounded-full border-[3px] border-white overflow-hidden flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(59,130,246,0.6)]">
           <img 
             src={dbUser?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${dbUser?.username || user?.uid || 'Felix'}`} 
             alt="Profile" 
             className="w-full h-full object-cover bg-gradient-to-br from-blue-900 to-black rounded-full"
             referrerPolicy="no-referrer"
             onError={(e) => {
               e.currentTarget.onerror = null;
               e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${dbUser?.username || user?.uid || 'Felix'}`;
             }}
           />
        </div>
        <h2 className="text-[20px] font-bold text-white mb-0.5">{dbUser?.username || 'free'}</h2>
        <span className="text-[#10B981] font-bold text-[15px]">Verified</span>
      </div>

      {/* Stats Card */}
      <div className="w-full bg-[#1A0B2E] rounded-md py-4 flex justify-between items-center mb-6 border border-white/5">
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <span className="text-white font-bold text-[17px] leading-none mb-2 text-center">{dbUser?.totalMatches || 0}</span>
          <span className="text-white font-medium text-[11px] text-center leading-tight">Matches<br/>Played</span>
          <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-white/20" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <span className="text-white font-bold text-[17px] leading-none mb-2 text-center">{dbUser?.totalKills || 0}</span>
          <span className="text-white font-medium text-[11px] text-center leading-tight">Total<br/>Killed</span>
          <div className="absolute right-0 top-[10%] bottom-[10%] w-[1px] bg-white/20" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-[17px] leading-none mb-2 text-center flex justify-center items-center gap-1.5 w-full">
            <div className="w-[15px] h-[15px] bg-yellow-400 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0">C</div> {dbUser?.winningBalance || 0}
          </span>
          <span className="text-white font-medium text-[11px] text-center leading-tight pr-1">Coins<br/>Won</span>
        </div>
      </div>

      {/* Menu List */}
      <div className="w-full flex flex-col gap-2.5">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            className="w-full bg-[#1A0B2E] rounded-md flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-[#230f3d] transition-colors"
            onClick={item.onClick}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-5">
                {item.icon}
              </div>
              <span className="text-white font-bold text-[14px]">{item.label}</span>
            </div>
            {item.rightElement ? (
              item.rightElement
            ) : (
              <ChevronRight className="w-[18px] h-[18px] text-white/30 stroke-[2.5]" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center">
         <span className="text-white font-medium text-[13px] mb-1">Version : 1</span>
         <span className="text-[#EF4444] font-bold text-[13px]">Developed by <span className="text-white underline decoration-white underline-offset-2">Infinity code free</span></span>
      </div>

      {/* Language Modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C093B] border border-white/10 w-full max-w-[320px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/20">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                Select Language
              </h3>
              <button 
                onClick={() => setIsLanguageModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col p-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setIsLanguageModalOpen(false);
                    toast.success(`Language changed to ${lang}`);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                    selectedLanguage === lang 
                      ? 'bg-blue-600/20 text-blue-400 font-semibold' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-[15px]">{lang}</span>
                  {selectedLanguage === lang && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
