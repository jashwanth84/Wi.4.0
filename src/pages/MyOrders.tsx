import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Search, ShoppingBag, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
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
        .filter(tx => tx.type === 'entry_fee')
        .sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
          return tB - tA;
        });
      setOrders(filtered);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredOrders = orders.filter(o => 
    o.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] font-sans pb-20">
      <header className="flex items-center px-4 py-3 bg-[#12182F] sticky top-0 z-20 shadow-md border-b border-white/5">
        <div className="flex items-center space-x-3 w-full">
          <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold text-[17px] tracking-wide">My Orders</h1>
        </div>
      </header>

      <div className="flex flex-col px-4 pt-4 w-full">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-[#1C093B]/50 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-inner"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-[#1C093B]/20 rounded-2xl border border-white/5 mx-2">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-blue-400 opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Orders Found</h3>
            <p className="text-gray-400 text-sm max-w-[250px]">You haven't purchased any tournament entries yet.</p>
            <button onClick={() => navigate('/tournaments')} className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg">
              Browse Tournaments
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
             {filteredOrders.map(order => (
               <div key={order.id} className="bg-[#1C093B]/40 border border-white/5 rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-900/40 flex items-center justify-center shrink-0 border border-blue-500/20">
                     <Gamepad2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <h3 className="text-white font-bold text-sm truncate">{order.description || 'Tournament Entry'}</h3>
                     <div className="flex items-center gap-2 mt-1">
                       <Clock className="w-3.5 h-3.5 text-gray-500" />
                       <span className="text-gray-400 text-[11px]">{order.createdAt?.toDate ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(order.createdAt.toDate()) : 'Now'}</span>
                     </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-white font-black">₹{order.amount}</span>
                     <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded mt-1">Success</span>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
