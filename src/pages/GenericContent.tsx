import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Info, ClipboardList, HelpCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function GenericContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/announcement':
        return { title: 'Announcements', icon: Megaphone, color: 'text-red-400', docId: 'announcement' };
      case '/about':
        return { title: 'About Us', icon: Info, color: 'text-blue-400', docId: 'about' };
      case '/terms':
        return { title: 'Terms & Conditions', icon: ClipboardList, color: 'text-gray-300', docId: 'terms' };
      case '/tutorial':
        return { title: 'App Tutorial', icon: HelpCircle, color: 'text-yellow-400', docId: 'tutorial' };
      default:
        return { title: 'Page', icon: Info, color: 'text-white', docId: 'unknown' };
    }
  };

  const info = getPageInfo();
  const Icon = info.icon;

  useEffect(() => {
    if (info.docId === 'unknown') {
       setLoading(false);
       return;
    }
    const fetchContent = async () => {
       try {
         const docRef = doc(db, 'app_content', info.docId);
         const docSnap = await getDoc(docRef);
         if (docSnap.exists() && docSnap.data().text) {
           setContent(docSnap.data().text);
         } else {
           setContent(`Welcome to ${info.title}.\n\nThis content is managed by the administrator. Currently there is no content available for this section.`);
         }
       } catch (err) {
         console.error(err);
         setContent('Failed to load content.');
       } finally {
         setLoading(false);
       }
    };
    fetchContent();
  }, [info.docId, info.title]);

  return (
    <div className="flex flex-col min-h-screen bg-black w-full pb-20 font-sans">
      <div className="bg-[#1C093B] sticky top-0 z-10 w-full px-4 py-4 flex items-center gap-3 border-b border-white/10 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Icon className={`w-5 h-5 ${info.color}`} />
        <h1 className="text-[17px] font-bold text-white tracking-wide uppercase">{info.title}</h1>
      </div>

      <div className="p-4 pt-6">
        <div className="bg-[#1A0B2E] rounded-xl p-5 sm:p-6 border border-white/5 shadow-lg max-w-2xl mx-auto min-h-[300px]">
          {loading ? (
             <div className="flex items-center justify-center h-40">
               <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
             <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
          )}
        </div>
      </div>
    </div>
  );
}
