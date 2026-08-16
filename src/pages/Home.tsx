import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Megaphone,
  CheckCircle2,
  Clock,
  Radio,
  MessageCircle,
  Share2,
  Instagram,
  Send,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Gamepad2,
  PlayCircle,
  Crosshair,
  Youtube
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function Home() {
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [activeGameMode, setActiveGameMode] = useState<string>('all');
  const [announcement, setAnnouncement] = useState('FREE COINS KYA LIYA MESSAGE KARO — JOIN NOW FOR FREE FIRE TOURNAMENTS — POOL PRIZE ₹600');

  // Fetch active game mode config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_content', 'game_mode'), (snap) => {
      if (snap.exists()) {
        const mode = snap.data().activeOption || 'all';
        setActiveGameMode(mode);
      }
    }, err => console.error(err));
    return () => unsub();
  }, []);

  // Fetch live announcement content
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'app_content', 'announcement'), (snap) => {
      if (snap.exists() && snap.data().text) {
        // Strip html tags if admin added them, so it displays nicely in the marquee ribbon
        const plainText = snap.data().text.replace(/<[^>]*>/g, '').trim();
        if (plainText) {
          setAnnouncement(plainText);
        }
      }
    }, err => console.error(err));
    return () => unsub();
  }, []);

  // Fetch games
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'games'), (snap) => {
      setGames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => console.error(err));
    return () => unsub();
  }, []);

  // Fetch sliders
  useEffect(() => {
    const q = query(collection(db, 'sliders'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const allSliders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const activeSliders = allSliders.filter((s: any) => s.status === 'active');
      if (activeSliders.length > 0) {
        setSlides(activeSliders);
      } else {
        setSlides([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  // Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
  };

  const openWhatsAppChannel = () => {
    toast.success("Opening official WhatsApp Channel...");
    window.open("https://wa.me/qr/HVVVHOUFP6MZO1", "_blank");
  };

  const handlePlayAction = (gameName: string) => {
    navigate(`/tournaments?game=${encodeURIComponent(gameName)}`);
  };

  return (
    <div className="flex flex-col gap-5 px-3 py-3 text-white font-sans relative pb-10">
      
      {/* 1. Scrolling HELP Marquee Announcement Ribbon */}
      <div className="bg-[#1C0D42] text-white px-3.5 py-2 rounded-xl border border-[#7C3AED]/20 text-[12.5px] font-black tracking-normal flex items-center gap-3 overflow-hidden shadow-md mt-1 relative">
        <div className="bg-red-500 rounded-full p-1 shrink-0 animate-pulse z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          <Megaphone className="w-3.5 h-3.5 text-white fill-current" />
        </div>
        
        {/* Animated Infinite Marquee Container */}
        <div className="flex-1 overflow-hidden relative select-none">
          <div className="whitespace-nowrap inline-block animate-marquee select-none pl-[40%] font-display uppercase tracking-wider text-white">
            {announcement}
          </div>
        </div>

        {/* Custom scroll animation inject style */}
        <style>{`
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
          .animate-marquee {
            display: inline-block;
            animation: marquee 18s linear infinite;
          }
        `}</style>
      </div>

      {/* 2. IMPORTANT SECTION WITH SLIDERS BANNER */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 px-0.5">
          <h2 className="text-white font-display font-black text-sm tracking-wide uppercase flex items-center gap-1">
            IMPORTANT
            <span className="text-[#EF4444] text-sm animate-bounce">🛑</span>
          </h2>
        </div>
        <p className="text-zinc-500 text-[11px] font-medium leading-none mb-1 px-0.5">Updates and Alerts</p>
        
        {/* Sliders Container with full image size */}
        {slides.length > 0 ? (
          <div 
            className="w-full aspect-[21/9] sm:aspect-[2.5/1] rounded-2xl overflow-hidden relative border border-violet-800/20 shadow-[0_3px_15px_rgba(0,0,0,0.6)] cursor-pointer group active:scale-[0.99] transition-transform"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div 
                  key={index} 
                  className="w-full h-full shrink-0 relative flex items-center justify-center p-0 m-0"
                  onClick={() => {
                    if (slide.link) {
                      if (slide.link.startsWith('http')) window.open(slide.link, '_blank');
                      else navigate(slide.link);
                    }
                  }}
                >
                  {slide.image ? (
                    <img 
                      src={slide.image} 
                      alt={slide.title || "Banner"} 
                      className="w-full h-full object-fill m-0 p-0 absolute inset-0"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient || 'from-[#0F0B1E] via-[#2A1657] to-[#0A0714]'} flex items-center justify-between px-6 sm:px-10 h-full w-full relative overflow-hidden`}>
                      {/* Left Title and text content */}
                      <div className="z-10 flex flex-col justify-center max-w-[60%]">
                        <h3 className="font-sans font-black text-sm sm:text-base text-white uppercase leading-tight tracking-wider whitespace-pre-wrap text-left drop-shadow-md" dangerouslySetInnerHTML={{ __html: slide.title || '' }} />
                      </div>
                      
                      {/* Character Sprite illustration from Dicebear on the right */}
                      {slide.spriteSeed && (
                        <div 
                          className="absolute right-2 bottom-0 w-[35%] h-[92%] bg-contain bg-no-repeat bg-bottom opacity-85 pointer-events-none z-10" 
                          style={{ backgroundImage: `url('https://api.dicebear.com/7.x/adventurer/svg?seed=${slide.spriteSeed}&flip=true')` }}
                        />
                      )}
                      
                      {/* Large watermarked icon behind */}
                      <div className="absolute right-[25%] top-[10%] opacity-15 pointer-events-none">
                        {(() => {
                          const IconComp = (() => {
                            switch (slide.iconType) {
                              case 'Trophy': return Trophy;
                              case 'Gamepad2': return Gamepad2;
                              case 'PlayCircle': return PlayCircle;
                              case 'Instagram': return Instagram;
                              case 'CheckCircle2': return CheckCircle2;
                              case 'Crosshair': return Crosshair;
                              case 'Megaphone': return Megaphone;
                              default: return Megaphone;
                            }
                          })();
                          return <IconComp className="w-16 h-16 text-white" />;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation Arrows (visible on hover) */}
            <div className="absolute inset-y-0 left-0 flex items-center px-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/40 text-white flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Dots Indicator */}
            {slides.length > 1 && (
              <div className="absolute bottom-1.5 sm:bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      currentSlide === index ? 'bg-white w-4 sm:w-5' : 'bg-white/50 w-1.5 sm:w-2'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={openWhatsAppChannel}
            className="w-full aspect-[2/1] rounded-2xl overflow-hidden relative border border-violet-800/20 shadow-[0_3px_15px_rgba(0,0,0,0.6)] cursor-pointer bg-gradient-to-r from-[#0F0B1E] via-[#2A1657] to-[#0A0714] group active:scale-[0.99] transition-transform"
          >
            <div className="absolute inset-0 bg-transparent flex items-center justify-center text-zinc-600 font-bold text-xs uppercase tracking-widest">
              Setup Sliders in Admin
            </div>
          </div>
        )}
      </div>

      {/* 3. EXCLUSIVE SECTION WITH DYNAMIC MATCH CARDS */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 px-0.5">
          <h2 className="text-white font-display font-black text-sm tracking-wide uppercase flex items-center gap-1">
            EXCLUSIVE
            <span className="bg-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide animate-pulse">LIVE</span>
          </h2>
        </div>
        <p className="text-zinc-500 text-[11px] font-medium leading-none mb-1.5 px-0.5">Tap a category to go inside and view games</p>

        {/* Dynamic columns matches layout based on game feature selection */}
        <div className={`grid gap-3.5 px-0.5 ${
          activeGameMode === 'all' ? 'grid-cols-2' : 'grid-cols-1'
        }`}>
          
          {/* CARD 1: Play with Ads Coins */}
          {(activeGameMode === 'all' || activeGameMode === 'play_with_ads_coins') && (
            <div 
              id="exclusive-ads-coins"
              onClick={() => navigate('/exclusive-games?type=play_with_ads_coins')}
              className="rounded-[18px] overflow-hidden bg-gradient-to-br from-[#120B24] to-[#1D0C3A] border border-white/5 hover:border-yellow-500/30 flex flex-col relative aspect-[4/5] cursor-pointer group active:scale-[0.98] transition-all duration-300 shadow-2xl"
            >
              {/* Top Indicator badge */}
              <div className="absolute top-2.5 left-2.5 z-20">
                <div className="bg-[#0747E8] text-[9.5px] font-black text-white px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>FairPlay : ON</span>
                </div>
              </div>

              {/* Center graphical area */}
              <div className="flex-1 relative flex flex-col items-center justify-center p-3 overflow-hidden bg-[#0A0615]">
                {/* Image from user's upload or fallback html */}
                <div className="absolute inset-0 z-0">
                  <div className="w-full h-full bg-gradient-to-b from-[#140b2e] to-[#0A0615] flex flex-col items-center justify-center pt-5">
                    <div className="relative flex flex-col items-center">
                      <h4 className="text-[14px] font-display font-black text-white italic drop-shadow-md z-10 leading-tight">Play with</h4>
                      <div className="bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 text-transparent bg-clip-text font-black text-[18px] italic transform -skew-x-12 drop-shadow-lg scale-110 mb-1 leading-none uppercase">Ads Coins</div>
                      
                      {/* Big Coin Logo inside */}
                      <div className="relative mt-2">
                         <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] border-[2px] border-yellow-200/50">
                            <span className="text-2xl font-black text-yellow-900 drop-shadow-sm">⚡</span>
                         </div>
                         <div className="absolute -bottom-2 -left-4 w-7 h-7 bg-yellow-500 rounded-full border border-yellow-300 flex items-center justify-center shadow-lg transform -rotate-12 text-[10px]">🪙</div>
                         <div className="absolute top-0 -right-3 w-5 h-5 bg-yellow-400 rounded-full border border-yellow-200 flex items-center justify-center shadow-md transform rotate-12 text-[8px]">🪙</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Play action pill */}
              <div className="absolute bottom-2 right-2 z-10">
                <div className="bg-white text-black px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg pointer-events-none group-hover:scale-105 transition-transform">
                  <span>ENTER</span>
                  <span className="text-[8px]">▶</span>
                </div>
              </div>
            </div>
          )}

          {/* CARD 2: Free Matches */}
          {(activeGameMode === 'all' || activeGameMode === 'free_matches') && (
            <div 
              id="exclusive-free-matches"
              onClick={() => navigate('/exclusive-games?type=free_matches')}
              className="rounded-[18px] overflow-hidden bg-gradient-to-br from-[#120B24] to-[#1D0C3A] border border-white/5 hover:border-emerald-500/30 flex flex-col relative aspect-[4/5] cursor-pointer group active:scale-[0.98] transition-all duration-300 shadow-2xl"
            >
              {/* Top Indicator badge */}
              <div className="absolute top-2.5 left-2.5 z-20">
                <div className="bg-[#10B981] text-[9.5px] font-black text-white px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></span>
                  <span>Free Matches</span>
                </div>
              </div>

              {/* Center graphical area */}
              <div className="flex-1 relative flex flex-col items-center justify-center p-3 overflow-hidden bg-[#0A0615]">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#061E14] to-[#0A0615] flex flex-col items-center justify-center pt-2">
                   <h4 className="text-[13px] font-black text-emerald-400 uppercase tracking-widest opacity-90">Free Matches</h4>
                   
                   <div className="relative mt-2 flex items-center justify-center w-[75px] h-[75px]">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#10B981] to-[#042F1A] rounded-full border-[3px] border-[#34D399]/70 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-white text-[34px] font-bold drop-shadow-md z-10 mb-1 relative">🏆</span>
                   </div>
                   
                   <div className="mt-2 text-center flex flex-col items-center">
                      <span className="text-[8px] font-black text-[#34D399] tracking-[0.2em] mb-0.5 leading-none">ZERO FEES</span>
                      <span className="text-[11px] font-black text-white px-2 mt-0.5 max-w-[120px] truncate leading-tight">Play Free, Win Real!</span>
                   </div>
                </div>
              </div>

              {/* Bottom Play action pill */}
              <div className="absolute bottom-2 right-2 z-10">
                <div className="bg-[#10B981] text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg pointer-events-none group-hover:scale-105 transition-transform">
                  <span>ENTER</span>
                  <span className="text-[8px]">▶</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MY CONTESTS SECTION */}
      <div className="flex flex-col gap-1.5 mt-2">
        <div className="flex items-center gap-1.5 px-0.5">
          <h2 className="text-[#EF4444] font-display font-black text-[13px] tracking-widest uppercase flex items-center gap-1.5 font-sans">
            MY CONTESTS
            <div className="w-[14px] h-[14px] rounded-full bg-[#EF4444] flex items-center justify-center text-[9px] text-white font-bold ml-0.5 shadow-sm">✔</div>
          </h2>
        </div>
        <p className="text-zinc-500 text-[11px] font-medium leading-none mb-2 px-0.5 mt-[-1px]">Your Tournaments Journey</p>
        
        {/* Uniform Grid of 3 rounded cards */}
        <div className="grid grid-cols-3 gap-3.5 px-0.5 pb-2">
          
          {/* UPCOMING MATCHES */}
          <Link 
            to="/my-matches?tab=upcoming" 
            className="bg-[#190C36] hover:bg-[#1E1145] rounded-2xl aspect-[4/4.5] flex flex-col items-center justify-center border border-white/5 transition-all shadow-md active:scale-95"
          >
            <div className="w-[52px] h-[52px] rounded-full border-[2.5px] border-[#EF4444] flex items-center justify-center mb-2 bg-[#100722]">
              <Clock className="w-6 h-6 text-[#EF4444]" strokeWidth={2.5} />
            </div>
            <span className="text-[12.5px] font-bold text-white tracking-wide">Upcoming</span>
          </Link>

          {/* ONGOING MATCHES */}
          <Link 
            to="/my-matches?tab=ongoing" 
            className="bg-[#190C36] hover:bg-[#1E1145] rounded-2xl aspect-[4/4.5] flex flex-col items-center justify-center border border-white/5 transition-all shadow-md active:scale-95"
          >
            <div className="w-[52px] h-[52px] rounded-full border-[2.5px] border-[#EF4444] flex items-center justify-center mb-2 bg-[#100722]">
              <Radio className="w-6 h-6 text-[#EF4444] animate-pulse" strokeWidth={2.5} />
            </div>
            <span className="text-[12.5px] font-bold text-white tracking-wide">Ongoing</span>
          </Link>

          {/* COMPLETED MATCHES */}
          <Link 
            to="/my-matches?tab=completed" 
            className="bg-[#190C36] hover:bg-[#1E1145] rounded-2xl aspect-[4/4.5] flex flex-col items-center justify-center border border-white/5 transition-all shadow-md active:scale-95"
          >
            <div className="w-[52px] h-[52px] rounded-full border-[2.5px] border-[#EF4444] flex items-center justify-center mb-2 bg-[#100722]">
              <CheckCircle2 className="w-6 h-6 text-[#EF4444]" strokeWidth={2.5} />
            </div>
            <span className="text-[12.5px] font-bold text-white tracking-wide">Completed</span>
          </Link>
        </div>
      </div>

      {/* 5. LEAGUE CHAMPIONS HERO ILLUSTRATION MASCOT CARD */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-b from-[#1C0D42] to-[#0A0515] border border-white/5 relative min-h-[140px] shadow-xl flex items-end p-5 mt-1.5">
        <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMGgxNnYxNkgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjgiIGN5PSI4IiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIi8+PC9zdmc+')] z-0"></div>
        {/* Futuristic neon lights */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-[#7C3AED] to-pink-500 z-10 shadow-[0_0_15px_rgba(124,58,237,0.8)]"></div>
        
        {/* Mascot images simulating the combat cyber-soldiers from reference screenshot background */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center mix-blend-screen opacity-70 filter brightness-[1.25]" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80')" }}
        />
        
        {/* Text layout */}
        <div className="relative z-10 w-[70%] flex flex-col justify-end">
          <span className="text-[#EF4444] text-[9px] font-black tracking-widest uppercase">Rewards Battle Champions</span>
          <h3 className="text-lg font-display font-black text-white leading-tight mt-0.5">
            Esports Arena league
          </h3>
          <p className="text-zinc-400 text-[10px] font-medium mt-1">
            Always play on reliable servers under official support supervision. Check active leaderboards.
          </p>
        </div>
      </div>

      {/* 6. SHARE AND CALL TO ACTION UTILITIES */}
      <div className="flex gap-3 mt-1.5">
        <Button 
          variant="secondary" 
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin);
            toast.success("Application link copied to clipboard!");
          }}
          className="flex-1 bg-[#1A0B2C] border border-white/5 text-white hover:bg-[#26123D] h-11 flex items-center justify-center gap-2 rounded-xl text-[13px] font-bold tracking-wide"
        >
          <Share2 className="w-[17px] h-[17px]" />
          Share
        </Button>
        <Button 
          onClick={openWhatsAppChannel}
          className="flex-[1.3] bg-[#25D366] hover:bg-[#20ba59] text-white border-none h-11 flex items-center justify-center gap-2 rounded-xl text-[13px] font-black tracking-wide shadow-md transform hover:scale-[1.01] transition-transform"
        >
          <MessageCircle className="w-[18px] h-[18px] fill-white text-white" />
          Share on WhatsApp
        </Button>
      </div>

      {/* Social networks quick launchers */}
      <div className="flex justify-center items-center gap-4.5 mt-3 mb-1">
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-[40px] h-[40px] rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
            <Instagram className="w-5 h-5 text-[#E1306C]" />
          </div>
        </a>
        <a href="https://t.me/Infinitycodesfree" target="_blank" rel="noreferrer" className="w-[40px] h-[40px] bg-[#229ED9] hover:bg-[#208ebe] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <Send className="w-5 h-5 text-white ml-[-2px] mt-[1px]" />
        </a>
        <a href="https://wa.me/qr/HVVVHOUFP6MZO1" target="_blank" rel="noreferrer" className="w-[40px] h-[40px] bg-[#25D366] hover:bg-[#20ba59] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <MessageCircle className="w-[24px] h-[24px] text-white fill-white" />
        </a>
        <a href="https://youtu.be/Rz93geLvlKE?si=3KX-ECGqYLkOZdaT" target="_blank" rel="noreferrer" className="w-[40px] h-[40px] bg-[#FF0000] hover:bg-[#E50000] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <Youtube className="w-5 h-5 text-white" />
        </a>
      </div>

      {/* 7. FLOATING CY_PULSING CHAT / HEADPHONES SUPPORT BADGE (Pulsating bottom right in mockup) */}
      <div className="fixed bottom-[88px] right-4 z-40">
        <button 
          onClick={() => setShowSupportModal(true)}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#9333EA] via-[#3B82F6] to-pink-500 shadow-[0_4px_15px_rgba(147,51,234,0.6)] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer relative group animate-bounce"
          style={{ animationDuration: '4s' }}
        >
          {/* Neon pulsating radar halo */}
          <span className="absolute inset-0 rounded-full bg-[#3B82F6] opacity-35 animate-ping -z-10"></span>
          <span className="absolute -inset-1 rounded-full border border-pink-500/30 opacity-40 animate-pulse -z-10"></span>
          
          <svg className="w-6 h-6 text-white text-shadow" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 1a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      </div>

      {/* Interactive Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#130B24] border border-white/10 rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-800 to-[#120B24] p-5 text-center relative border-b border-white/5">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-base font-display font-black text-white">REWARDS BATTLE SUPPORT</h3>
              <p className="text-[11px] text-violet-300">Quick help inside 5 minutes</p>
            </div>

            {/* Methods list */}
            <div className="p-5 flex flex-col gap-3">
              <div className="text-[11.5px] text-zinc-400 text-center leading-relaxed">
                Connect directly with our live developers or game lobbies management helpline:
              </div>

              {/* Whatsapp */}
              <a 
                href="https://wa.me/qr/HVVVHOUFP6MZO1" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3.5 bg-zinc-900 hover:bg-zinc-800 p-3 rounded-2xl border border-white/5 transition-colors"
                onClick={() => setShowSupportModal(false)}
              >
                <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center font-bold text-lg text-white">
                  💬
                </div>
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-black text-white">Direct WhatsApp</span>
                  <span className="text-[10px] text-zinc-500">Contact / Scan QR</span>
                </div>
              </a>

              {/* Telegram */}
              <a 
                href="https://t.me/Infinitycodesfree" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3.5 bg-zinc-900 hover:bg-zinc-800 p-3 rounded-2xl border border-white/5 transition-colors"
                onClick={() => setShowSupportModal(false)}
              >
                <div className="w-10 h-10 bg-[#229ED9] rounded-xl flex items-center justify-center font-bold text-lg text-white">
                  ✈️
                </div>
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-black text-white">Official Telegram</span>
                  <span className="text-[10px] text-zinc-500">@Infinitycodesfree</span>
                </div>
              </a>

              {/* YouTube */}
              <a 
                href="https://youtu.be/Rz93geLvlKE?si=3KX-ECGqYLkOZdaT" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3.5 bg-zinc-900 hover:bg-zinc-800 p-3 rounded-2xl border border-white/5 transition-colors"
                onClick={() => setShowSupportModal(false)}
              >
                <div className="w-10 h-10 bg-[#FF0000] rounded-xl flex items-center justify-center font-bold text-lg text-white">
                  📺
                </div>
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-black text-white">YouTube Tutorials</span>
                  <span className="text-[10px] text-zinc-500">Watch & Learn Lobbies</span>
                </div>
              </a>
            </div>

            {/* Footer close */}
            <div className="p-3 bg-black/40 flex justify-center">
              <button 
                onClick={() => setShowSupportModal(false)}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black transition-colors"
              >
                Dismiss Desk
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
