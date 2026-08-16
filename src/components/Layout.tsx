import { Outlet, Link, useLocation } from "react-router-dom";
import { Gamepad2, User as UserIcon, Globe, Headphones, Plus, Wallet as WalletIcon, Settings, Percent, Home as HomeIcon, Bell } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { toast } from 'react-hot-toast';

// Custom Leaderboard SVG Icon matching the screenshot (3 bars with a star on the tallest middle-right bar)
const LeaderboardIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={cn("w-6 h-6 transition-all", className)} 
    fill={isActive ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Clean esports rounded bar lines */}
    <line x1="5" y1="20" x2="5" y2="13" strokeWidth="2.5" />
    <line x1="11" y1="20" x2="11" y2="9" strokeWidth="2.5" />
    <line x1="17" y1="20" x2="17" y2="13" strokeWidth="2.5" />
    {/* Floating Star over the active center column */}
    <path 
      d="M11 2.2l.7 1.4 1.5.2-1.1 1.1.2 1.5-1.3-.8-1.3.8.2-1.5-1.1-1.1 1.5-.2.7-1.4z" 
      fill="currentColor" 
      stroke="none" 
    />
  </svg>
);

export default function Layout() {
  const { pathname } = useLocation();
  const { dbUser, user } = useAuth();

  const showComingSoon = () => {
    toast('Support & Global Features loaded!', {
      icon: '🛡️',
    });
  };

  const links = [
    { name: "Earn", href: "/earn", type: 'percent', icon: Percent },
    { name: "Leaderboard", href: "/leaderboard", type: 'leaderboard', icon: null },
    { name: "Home", href: "/", type: 'home', icon: HomeIcon },
    { name: "Wallet", href: "/wallet", type: 'wallet', icon: WalletIcon },
    { name: "Profile", href: "/profile", type: 'profile', icon: UserIcon },
  ];
  
  const hideHeaderRoutes = ['/my-matches', '/leaderboard', '/announcement', '/about', '/terms', '/tutorial', '/tournaments', '/my-profile', '/my-orders', '/my-statistics', '/my-rewards', '/wallet', '/add-coins', '/withdraw-coins', '/exclusive-games', '/refer'];
  const shouldHideHeader = hideHeaderRoutes.includes(pathname) || pathname.startsWith('/tournaments/');

  return (
    <div className="flex h-screen w-full flex-col bg-[#0A0515] overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto pb-[76px]">
        {/* Header matching the reference UI */}
        {!shouldHideHeader && (
          <header className="flex h-[60px] items-center justify-between px-3 bg-[#0A0515] sticky top-0 z-50 w-full">
            {/* Left side: Avatar & Headphones */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#1E40AF] to-[#0A0515] flex items-center justify-center overflow-hidden border-[2px] border-white/90 shadow-lg relative">
                <img 
                  src={dbUser?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${dbUser?.username || user?.displayName || user?.email?.split('@')[0] || 'Reshma454145'}&backgroundColor=0747E8`} 
                  alt="avatar" 
                  className={cn("object-cover", (dbUser?.photoURL || user?.photoURL) ? "w-full h-full" : "w-[85%] h-[85%]")} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${dbUser?.username || user?.displayName || user?.email?.split('@')[0] || 'Reshma454145'}&backgroundColor=0747E8`;
                  }}
                />
              </div>
              <Headphones onClick={() => window.open("https://wa.me/qr/HVVVHOUFP6MZO1", "_blank")} className="w-[20px] h-[20px] text-white cursor-pointer" strokeWidth={2} />
            </div>

            {/* Center: Welcome Back & Username */}
            <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
              <span className="text-[11px] font-extrabold text-white italic tracking-wide leading-tight">
                Welcome Back,
              </span>
              <span className="text-[14px] font-[900] text-white italic uppercase tracking-wider leading-tight shadow-sm">
                {dbUser?.username || dbUser?.displayName || user?.displayName || user?.email?.split('@')[0] || 'ZEN BATTLE'}
              </span>
            </div>

            {/* Right side: Bell & Wallet */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell onClick={showComingSoon} className="w-[20px] h-[20px] text-white cursor-pointer fill-white" strokeWidth={0} />
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#0A0515]"></div>
              </div>
              
              <Link to="/wallet" className="flex items-center bg-white rounded flex-row px-2 text-black transition-all h-[26px] gap-[3px]">
                {/* Wallet Icon (replaces coin icon from screenshot) */}
                <div className="w-[14px] h-[14px] rounded-full bg-[#fbbc04] flex items-center justify-center">
                  <span className="text-[8px] text-[#a47a00] font-serif font-black">C</span>
                </div>
                
                <span className="text-[12px] font-bold text-black flex items-center ml-0.5">
                  {((dbUser?.walletBalance || 0) + (dbUser?.bonusBalance || 0)).toFixed(0)}
                </span>
              </Link>
            </div>
          </header>
        )}

        <div className="mx-auto w-full max-w-[500px]">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation - Identical layout & visuals to screenshot */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] items-center justify-around bg-[#0F0B1A] border-t border-[#1F143A]/50 max-w-[500px] mx-auto w-full pb-1.5 rounded-t-[22px] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
          
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-[75px] h-full transition-all duration-300 relative select-none",
                isActive ? "text-[#EF4444] font-display scale-105" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <div className="flex flex-col items-center justify-center relative">
                {link.type === 'percent' && (
                  <div className={cn(
                    "text-2xl font-sans tracking-tighter select-none transition-transform font-bold -mb-0.5",
                    isActive ? "text-[#EF4444]" : "text-zinc-500"
                  )}>
                    %
                  </div>
                )}
                
                {link.type === 'leaderboard' && (
                  <LeaderboardIcon isActive={isActive} className={isActive ? "text-[#EF4444]" : "text-zinc-500"} />
                )}
                
                {link.type === 'home' && link.icon && (
                  <link.icon className={cn("h-[25px] w-[25px] transition-all", isActive ? "fill-[#EF4444]/20 stroke-[#EF4444]" : "stroke-zinc-500")} strokeWidth={2.4} />
                )}

                {link.type === 'wallet' && link.icon && (
                  <link.icon className={cn("h-[23px] w-[23px] transition-all", isActive ? "fill-[#EF4444]/20 stroke-[#EF4444]" : "stroke-zinc-500")} strokeWidth={2.3} />
                )}

                {link.type === 'profile' && link.icon && (
                  <div className="relative">
                    <link.icon className={cn("h-[23px] w-[23px] transition-all", isActive ? "stroke-[#EF4444]" : "stroke-zinc-500")} strokeWidth={2.3} />
                    {/* Tiny gear settings badge overlaid in bottom right corner */}
                    <div className={cn(
                      "absolute -bottom-[3px] -right-[3px] rounded-full p-[1px] border border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.5)] bg-[#0F0B1A]",
                      isActive ? "text-[#EF4444]" : "text-zinc-500"
                    )}>
                      <Settings className="w-2.5 h-2.5" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Home is shown explicitly with active name label below it in colored state just like screenshot */}
              {link.type === 'home' && (
                <span className={cn(
                  "text-[11.5px] font-display font-medium mt-1 select-none leading-none",
                  isActive ? "text-[#EF4444] opacity-100" : "text-transparent"
                )}>
                  Home
                </span>
              )}
              
              {/* For other tabs, we hide the text completely even when active, per screenshot matching. */}
            </Link>
          )
        })}
      </nav>
    </div>
  );
}
