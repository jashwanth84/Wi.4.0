import React from 'react';
import { Users, MonitorPlay, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Earn() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 px-4 py-6 w-full max-w-[500px] mx-auto pb-24">
      
      {/* Refer & Earn Card */}
      <div 
        onClick={() => navigate('/refer')}
        className="rounded-2xl bg-gradient-to-br from-[#68DF44] to-[#2BA9E0] p-5 flex items-center justify-between shadow-[0_8px_16px_rgba(43,169,224,0.3)] h-[150px] cursor-pointer active:scale-95 transition-transform overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
        
        {/* Graphic Left */}
        <div className="w-[110px] h-[110px] bg-[#FFDE59]/20 rounded-full flex items-center justify-center shrink-0 -ml-2 relative z-10 border-[4px] border-white/10">
           <Users className="w-14 h-14 text-white drop-shadow-md" strokeWidth={2} />
        </div>

        {/* Text Right */}
        <div className="flex flex-col items-end text-right z-10 w-[60%]">
           <h2 className="text-white font-[900] text-[18px] mb-2 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] font-sans tracking-wide">
             REFER & EARN
           </h2>
           <p className="text-white text-[14px] font-medium leading-[1.3] drop-shadow-sm">
             Invite your friends to the app and Earn Huge!
           </p>
        </div>
      </div>

      {/* Watch & Earn Card */}
      <div 
        className="rounded-2xl bg-gradient-to-br from-[#186053] to-[#2BDF94] p-5 flex items-center justify-between shadow-[0_8px_16px_rgba(43,223,148,0.2)] h-[150px] cursor-pointer active:scale-95 transition-transform overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
        
        {/* Graphic Left */}
        <div className="w-[110px] h-[110px] bg-black/10 rounded-full flex items-center justify-center shrink-0 -ml-2 relative z-10 border-[4px] border-white/5 shadow-inner">
           <MonitorPlay className="w-14 h-14 text-white drop-shadow-md" strokeWidth={2.2} />
           <div className="absolute -top-1 -right-1 text-[#2BDF94] font-black text-sm drop-shadow-md">$</div>
           <div className="absolute top-1 -left-1 text-white font-black text-sm drop-shadow-md">$</div>
        </div>

        {/* Text Right */}
        <div className="flex flex-col items-end text-right z-10 w-[60%]">
           <h2 className="text-white font-[900] text-[18px] mb-2 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] font-sans tracking-wide">
             WATCH & EARN
           </h2>
           <p className="text-white text-[14px] font-medium leading-[1.3] drop-shadow-sm">
             Watch ad video and win huge!
           </p>
        </div>
      </div>

      {/* Buy Products Card */}
      <div 
        className="rounded-2xl bg-[linear-gradient(135deg,#FDE047_0%,#F43F5E_40%,#9333EA_100%)] p-5 flex items-center justify-between shadow-[0_8px_16px_rgba(147,51,234,0.3)] h-[150px] cursor-pointer active:scale-95 transition-transform overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
        
        {/* Graphic Left */}
        <div className="w-[110px] h-[110px] bg-white/20 rounded-full flex items-center justify-center shrink-0 -ml-2 relative z-10 border-[4px] border-white/20 backdrop-blur-sm">
           <ShoppingCart className="w-14 h-14 text-white drop-shadow-md fill-white/20" strokeWidth={2} />
        </div>

        {/* Text Right */}
        <div className="flex flex-col items-end text-right z-10 w-[60%] lg:w-[65%]">
           <h2 className="text-white font-[900] text-[18px] mb-2 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] font-sans tracking-wide">
             BUY PRODUCTS
           </h2>
           <p className="text-white text-[14px] font-medium leading-[1.3] drop-shadow-sm">
             Get amazing products here in low cost!
           </p>
        </div>
      </div>

    </div>
  );
}
