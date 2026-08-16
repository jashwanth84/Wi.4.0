import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { format } from 'date-fns';
import ImageUploader from '../components/ImageUploader';
import { 
  Users, Gamepad2, Coins, FileText, Bell, Image as ImageIcon, 
  Settings, UserCheck, Shield, Menu, X, Trophy, Banknote, ShieldAlert, CheckCircle, Smartphone,
  Activity, CheckCircle2, Award, Trash2, Edit, Plus, MoveUp, MoveDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Admin() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const navItems = [
    { id: 'dashboard', icon: Trophy, label: 'Dashboard', path: '/admin' },
    { id: 'users', icon: Users, label: 'Users', path: '/admin/users' },
    { id: 'add-game', icon: Gamepad2, label: 'Add Game', path: '/admin/add-game' },
    { id: 'matches', icon: Gamepad2, label: 'Matches', path: '/admin/matches' },
    { id: 'deposits', icon: Banknote, label: 'Add Money Req', path: '/admin/deposits' },
    { id: 'withdrawals', icon: Coins, label: 'Withdraw Req', path: '/admin/withdrawals' },
    { id: 'expenses', icon: FileText, label: 'Expenses', path: '/admin/expenses' },
    { id: 'notices', icon: Bell, label: 'Notices', path: '/admin/notices' },
    { id: 'rules', icon: FileText, label: 'Rules', path: '/admin/rules' },
    { id: 'notifications', icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { id: 'sliders', icon: ImageIcon, label: 'Sliders', path: '/admin/sliders' },
    { id: 'tutorials', icon: Smartphone, label: 'Tutorials', path: '/admin/tutorials' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' },
    { id: 'update', icon: Settings, label: 'App Update', path: '/admin/update' },
    { id: 'staff', icon: Shield, label: 'Staff', path: '/admin/staff' }
  ];

  const getPageTitle = () => {
    const item = navItems.find(nav => nav.path === location.pathname || (location.pathname.startsWith(nav.path) && nav.path !== '/admin'));
    return item ? item.label : 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-[#f2fafb] text-[#2c3e50] font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 fixed lg:relative z-30 inset-y-0 left-0
        w-64 bg-[#2c3e50] text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
      `}>
        <div className="p-6 flex justify-between items-center border-b border-gray-700">
          <h1 className="text-2xl font-bold tracking-wider">ADMIN PANEL</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-300 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin')
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-[#34495e] hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700 text-center text-xs text-gray-400">
          v2.5.0 - Botz Esports
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative z-0">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#2c3e50]">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-semibold text-[#2c3e50]">{getPageTitle()}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium bg-green-100 text-green-800 py-1 px-3 rounded-full">Online</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="add-game" element={<AdminAddGame />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="deposits" element={<AdminDeposits />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="expenses" element={<AdminExpenses />} />
            <Route path="sliders" element={<AdminSliders />} />
            <Route path="notices" element={<AdminContentEditor docId="announcement" title="Manage Notices/Announcements" />} />
            <Route path="rules" element={<AdminContentEditor docId="terms" title="Manage App Rules & Terms" />} />
            <Route path="tutorials" element={<AdminContentEditor docId="tutorial" title="Manage App Tutorials" />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="update" element={<AdminAppUpdate />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    deposits: 0,
    withdrawals: 0,
    approvedDeposits: 0,
    approvedWithdrawals: 0,
    banned: 0,
    tournaments: 0,
    liveTournaments: 0,
    completedTournaments: 0,
    totalWinnings: 0
  });

  useEffect(() => {
    // Basic stats listening
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      let users = snap.size;
      let banned = 0;
      snap.forEach(doc => { if (doc.data().banned) banned++; });
      setStats(prev => ({ ...prev, users, banned }));
    });
    
    const unsubTx = onSnapshot(collection(db, 'wallet_transactions'), (snap) => {
      let withdrawals = 0, approvedWithdrawals = 0;
      snap.forEach(doc => {
         const data = doc.data();
         if (data.type === 'withdrawal') {
           if (data.status === 'pending') withdrawals++;
           if (data.status === 'completed' || data.status === 'approved') approvedWithdrawals++;
         }
      });
      setStats(prev => ({ ...prev, withdrawals, approvedWithdrawals }));
    });
    
    const unsubDep = onSnapshot(collection(db, 'deposit_requests'), (snap) => {
      let deposits = 0, approvedDeposits = 0;
      snap.forEach(doc => {
         const data = doc.data();
         if (data.status === 'pending') deposits++;
         if (data.status === 'completed' || data.status === 'approved') approvedDeposits++;
      });
      setStats(prev => ({ ...prev, deposits, approvedDeposits }));
    });

    const unsubTournaments = onSnapshot(collection(db, 'tournaments'), (snap) => {
      let tournaments = snap.size;
      let liveTournaments = 0;
      let completedTournaments = 0;
      let totalWinnings = 0;
      snap.forEach(doc => {
         const data = doc.data();
         if (data.status === 'live' || data.status === 'ongoing') {
           liveTournaments++;
         }
         if (data.status === 'completed') {
           completedTournaments++;
           totalWinnings += Number(data.prizePool) || 0;
         }
      });
      setStats(prev => ({ ...prev, tournaments, liveTournaments, completedTournaments, totalWinnings }));
    });

    return () => { unsubUsers(); unsubTx(); unsubDep(); unsubTournaments(); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard icon={Trophy} title="Total Tournaments" value={stats.tournaments} color="text-yellow-500" action="Created" />
        <DashboardCard icon={Activity} title="Live Tournaments" value={stats.liveTournaments} color="text-green-500" action="Ongoing" />
        <DashboardCard icon={CheckCircle2} title="Completed Tournaments" value={stats.completedTournaments} color="text-blue-500" action="Finished" />
        <DashboardCard icon={Award} title="Winnings Distributed" value={`₹${stats.totalWinnings}`} color="text-purple-500" action="Total" />
      </div>

      <h3 className="text-xl font-bold mt-8 mb-4">Users & Finance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard icon={Users} title="Total Users" value={stats.users} color="text-blue-500" action="Total" />
        <DashboardCard icon={Coins} title="Deposit Requests" value={stats.deposits} color="text-yellow-500" action="Action" />
        <DashboardCard icon={Banknote} title="Pending Withdrawals" value={stats.withdrawals} color="text-red-500" action="Action" />
        <DashboardCard icon={CheckCircle} title="Approved Deposits" value={stats.approvedDeposits} color="text-green-500" action="History" />
        <DashboardCard icon={Banknote} title="Approved Withdrawals" value={stats.approvedWithdrawals} color="text-purple-500" action="History" />
        <DashboardCard icon={ShieldAlert} title="Banned Users" value={stats.banned} color="text-red-600" action="Alert" />
      </div>
    </div>
  );
}

function DashboardCard({ icon: Icon, title, value, color, action }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-8 h-8 ${color}`} />
        <span className="text-gray-400 text-sm">{action}</span>
      </div>
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-gray-500">{title}</p>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleBan = async (id: string, currentlyBanned: boolean) => {
    if (confirm(`Are you sure you want to ${currentlyBanned ? 'unban' : 'ban'} this user?`)) {
       try {
         await updateDoc(doc(db, 'users', id), { banned: !currentlyBanned });
         toast.success(`User ${currentlyBanned ? 'unbanned' : 'banned'} successfully`);
       } catch (error) {
         console.error(error);
         toast.error('Failed to update ban status (Missing Permissions)');
       }
    }
  };

  const editWallet = async (id: string, currentBalance: number, currentDeposit: number) => {
    const newBalanceStr = prompt("Enter new TOTAL balance amount:", (currentBalance || 0).toString());
    if (newBalanceStr === null || newBalanceStr.trim() === '') return;
    
    const newBalance = parseFloat(newBalanceStr);
    if (!isNaN(newBalance)) {
       const newDepositStr = prompt("Enter new DEPOSIT balance amount:", (currentDeposit || 0).toString());
       const newDeposit = parseFloat(newDepositStr || '0');
       try {
         await updateDoc(doc(db, 'users', id), { 
           totalBalance: newBalance,
           depositBalance: !isNaN(newDeposit) ? newDeposit : currentDeposit,
           walletBalance: newBalance // legacy fallback
         });
         toast.success("Wallet updated successfully");
       } catch (error) {
         console.error(error);
         toast.error('Failed to update wallet (Missing Permissions)');
       }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
      <div className="flex gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Search username or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 p-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Search</button>
      </div>
      {loading ? (
        <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(u => (
            <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition gap-4">
              <div>
                <div className="font-bold text-[#2c3e50] flex items-center gap-2">
                  {u.username || 'Unknown'} 
                  {u.banned && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">BANNED</span>}
                  {u.isAdmin && <Shield className="w-3 h-3 text-blue-500" />}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <strong>Total:</strong> ₹{u.totalBalance || u.walletBalance || 0} • <strong>Dep:</strong> ₹{u.depositBalance || 0} • <strong>Win:</strong> ₹{u.winningBalance || 0}
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => editWallet(u.id, u.totalBalance || u.walletBalance || 0, u.depositBalance || 0)} className="text-xs font-medium px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
                   Edit Wallet
                 </button>
                 <button onClick={() => toggleBan(u.id, u.banned)} className={`text-xs font-medium px-3 py-1.5 rounded ${u.banned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                   {u.banned ? 'Unban' : 'Ban'}
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminAddGame() {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [gameType, setGameType] = useState<'play_with_ads_coins' | 'free_matches'>('play_with_ads_coins');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'games'), (snap) => {
      setGames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => console.error(err));
    return () => unsub();
  }, []);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'games', editingId), {
          title,
          image,
          gameType,
          updatedAt: serverTimestamp()
        });
        toast.success('Game updated successfully!');
      } else {
        await addDoc(collection(db, 'games'), {
          title,
          image,
          gameType,
          createdAt: serverTimestamp()
        });
        toast.success('Game added successfully!');
      }
      
      handleCancelEdit();
    } catch (error) {
      console.error(error);
      toast.error(editingId ? 'Failed to update game' : 'Failed to add game');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (g: any) => {
    setEditingId(g.id);
    setTitle(g.title || '');
    setImage(g.image || '');
    setGameType(g.gameType || 'play_with_ads_coins');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setImage('');
    setGameType('play_with_ads_coins');
  };

  const handleToggleType = async (gameId: string, currentType: string) => {
    try {
      const nextType = currentType === 'free_matches' ? 'play_with_ads_coins' : 'free_matches';
      await updateDoc(doc(db, 'games', gameId), { gameType: nextType });
      toast.success('Game type updated!');
    } catch (error) {
      console.error('Error toggling type:', error);
      toast.error('Failed to update game type');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this game?')) {
      try {
        await deleteDoc(doc(db, 'games', id));
        toast.success('Game deleted successfully');
        if (editingId === id) {
          handleCancelEdit();
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete game.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold">Games</h2>
          <p className="text-sm text-gray-500">Manage available games and features categorization</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h3 className="font-bold mb-4">{editingId ? '✍️ Edit Game Details' : '➕ Add New Game'}</h3>
        <form onSubmit={handleAddGame} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Game Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#f2fafb] border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="e.g., PUBG Mobile" required />
            </div>
            <div>
              <ImageUploader label="Game Poster Image" value={image} onChange={setImage} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Select Game Placement Option</label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setGameType('play_with_ads_coins')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                  gameType === 'play_with_ads_coins' 
                    ? 'border-yellow-500 bg-yellow-50/25' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-yellow-500">
                  {gameType === 'play_with_ads_coins' && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">Play with Ads Coins</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Show in Ads Coins section</p>
                </div>
              </div>

              <div 
                onClick={() => setGameType('free_matches')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                  gameType === 'free_matches' 
                    ? 'border-emerald-500 bg-emerald-50/25' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-emerald-500">
                  {gameType === 'free_matches' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">Free Matches</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Show in Free Match section</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="bg-[#2c3e50] text-white py-3 rounded-lg hover:bg-[#1e2a37] font-bold disabled:opacity-50 transition flex-1 shadow">
              {editingId ? 'Save Changes' : 'Add Game'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 font-bold transition border shadow-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-md text-gray-800">Existing Games & Placement</h3>
          <span className="text-xs text-gray-500 font-medium">Click badge to toggle section placement</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {games.map(g => {
            const currentType = g.gameType || 'play_with_ads_coins';
            return (
              <div key={g.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between shadow-sm bg-white hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  {g.image && <img src={g.image} alt={g.title} className="w-12 h-12 rounded-lg object-cover border" />}
                  <div>
                    <p className="font-bold text-sm text-gray-800">{g.title}</p>
                    <button 
                      onClick={() => handleToggleType(g.id, currentType)}
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 cursor-pointer border hover:opacity-90 block text-left transition ${
                        currentType === 'free_matches' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                      }`}
                    >
                      {currentType === 'free_matches' ? '🏆 Free Matches' : '⚡ Ads Coins'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleStartEdit(g)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition" title="Edit Game"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(g.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" title="Delete Game"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
          {games.length === 0 && <p className="text-gray-500 col-span-full py-4 text-center">No games added yet.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminMatches() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [roomModalInfo, setRoomModalInfo] = useState<{id: string, roomId: string, roomPassword: string} | null>(null);
  const [showPlayersModal, setShowPlayersModal] = useState<string | null>(null); // tournament Id
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [newMatch, setNewMatch] = useState({
    title: '', date: '', entryFee: '0', prizePool: '0', type: 'Squad', map: 'Erangel', image: '', gameId: '', gameTitle: ''
  });
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tournaments'), (snap) => {
      setTournaments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'games'), (snap) => {
      setGames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, err => console.error(err));
    return () => unsub();
  }, []);

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatch.gameTitle && !newMatch.gameId) {
      alert("Please select a game first.");
      return;
    }
    setLoading(true);
    try {
      if (isEditing && editMatchId) {
        await updateDoc(doc(db, 'tournaments', editMatchId), {
          title: newMatch.title,
          date: newMatch.date,
          entryFee: Number(newMatch.entryFee || 0),
          prizePool: Number(newMatch.prizePool || 0),
          type: newMatch.type,
          map: newMatch.map,
          image: newMatch.image,
          imageUrl: newMatch.image,
          game: newMatch.gameTitle,
          gameId: newMatch.gameId,
          slotsTotal: 100,
          updatedAt: serverTimestamp()
        });
        alert('Match updated successfully!');
      } else {
        await addDoc(collection(db, 'tournaments'), {
          title: newMatch.title,
          date: newMatch.date,
          entryFee: Number(newMatch.entryFee || 0),
          prizePool: Number(newMatch.prizePool || 0),
          type: newMatch.type,
          map: newMatch.map,
          image: newMatch.image,
          imageUrl: newMatch.image,
          gameId: newMatch.gameId,
          game: newMatch.gameTitle,
          status: 'upcoming',
          slotsTotal: 100,
          slotsFilled: 0,
          participants: [],
          createdAt: serverTimestamp()
        });
        alert('Match added successfully!');
      }
      setShowAddModal(false);
      setIsEditing(false);
      setEditMatchId(null);
      setNewMatch({ title: '', date: '', entryFee: '0', prizePool: '0', type: 'Squad', map: 'Erangel', image: '', gameId: '', gameTitle: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this match?')) {
      try {
        await deleteDoc(doc(db, 'tournaments', id));
        alert('Match deleted successfully');
      } catch (error) {
        console.error(error);
        alert('Failed to delete match');
      }
    }
  };

  const openEditModal = (t: any) => {
    setIsEditing(true);
    setEditMatchId(t.id);
    const gameId = games.find(g => g.title === t.game || g.id === t.gameId)?.id || '';
    setNewMatch({
      title: t.title || '',
      date: t.date || '',
      entryFee: t.entryFee?.toString() || '0',
      prizePool: t.prizePool?.toString() || '0',
      type: t.type || 'Squad',
      map: t.map || 'Erangel',
      image: t.imageUrl || t.image || '',
      gameId: gameId,
      gameTitle: t.game || ''
    });
    setShowAddModal(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomModalInfo) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'tournaments', roomModalInfo.id), {
        roomId: roomModalInfo.roomId,
        roomPassword: roomModalInfo.roomPassword
      });
      alert('Room updated!');
      setRoomModalInfo(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const [filter, setFilter] = useState('upcoming');
  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'upcoming') return t.status === 'upcoming';
    if (filter === 'ongoing') return t.status === 'live' || t.status === 'ongoing';
    if (filter === 'results') return t.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">All Matches</h3>
        <button 
          onClick={() => {
            setIsEditing(false);
            setEditMatchId(null);
            setNewMatch({ title: '', date: '', entryFee: '0', prizePool: '0', type: 'Squad', map: 'Erangel', image: '', gameId: '', gameTitle: '' });
            setShowAddModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold"
        >
          + Add Match
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{isEditing ? 'Edit Match' : 'Create New Match'}</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-800" /></button>
            </div>
            <form onSubmit={handleAddMatch} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Game</label>
                <select 
                  required
                  value={newMatch.gameId} 
                  onChange={e => {
                    const selGame = games.find(g => g.id === e.target.value);
                    setNewMatch({
                       ...newMatch, 
                       gameId: selGame?.id || '',
                       gameTitle: selGame?.title || ''
                    });
                  }} 
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select a game...</option>
                  {games.map(g => (
                     <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input type="text" required value={newMatch.title} onChange={e => setNewMatch({...newMatch, title: e.target.value})} className="w-full border p-2 rounded" placeholder="e.g. BGMI Erangel Match" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Entry Fee (₹)</label>
                  <input type="number" required value={newMatch.entryFee} onChange={e => setNewMatch({...newMatch, entryFee: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Prize Pool (₹)</label>
                  <input type="number" required value={newMatch.prizePool} onChange={e => setNewMatch({...newMatch, prizePool: e.target.value})} className="w-full border p-2 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Type</label>
                  <select value={newMatch.type} onChange={e => setNewMatch({...newMatch, type: e.target.value})} className="w-full border p-2 rounded">
                    <option>Solo</option>
                    <option>Duo</option>
                    <option>Squad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Map</label>
                  <input type="text" required value={newMatch.map} onChange={e => setNewMatch({...newMatch, map: e.target.value})} className="w-full border p-2 rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Schedule (Date & Time)</label>
                <input type="text" required value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} className="w-full border p-2 rounded" placeholder="e.g. 25 Aug, 8:00 PM" />
              </div>
              <div>
                <ImageUploader 
                  label="Match Card Image" 
                  value={newMatch.image} 
                  onChange={(url) => setNewMatch({...newMatch, image: url})} 
                  placeholder="https://..." 
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-4">
                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Match'}
              </button>
            </form>
          </div>
        </div>
      )}

      {roomModalInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Manage Room Details</h3>
              <button onClick={() => setRoomModalInfo(null)}><X className="w-5 h-5 text-gray-500 hover:text-gray-800" /></button>
            </div>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Room ID</label>
                <input type="text" value={roomModalInfo.roomId} onChange={e => setRoomModalInfo({...roomModalInfo, roomId: e.target.value})} className="w-full border p-2 rounded" placeholder="e.g. 12345678" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Room Password</label>
                <input type="text" value={roomModalInfo.roomPassword} onChange={e => setRoomModalInfo({...roomModalInfo, roomPassword: e.target.value})} className="w-full border p-2 rounded" placeholder="e.g. 1234" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Room Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-lg shadow-sm w-fit border border-gray-100">
        <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded-md transition font-medium ${filter === 'upcoming' ? 'bg-[#2c3e50] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Upcoming</button>
        <button onClick={() => setFilter('ongoing')} className={`px-4 py-2 rounded-md transition font-medium ${filter === 'ongoing' ? 'bg-[#2c3e50] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Ongoing</button>
        <button onClick={() => setFilter('results')} className={`px-4 py-2 rounded-md transition font-medium ${filter === 'results' ? 'bg-[#2c3e50] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Results</button>
      </div>
      
      {filteredTournaments.length === 0 && <p className="text-gray-500 text-center py-10">No matches found.</p>}
      
      <div className="space-y-4">
        {filteredTournaments.map(t => (
          <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row gap-4 hover:shadow-md transition">
            <img src={t.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e'} className="w-full md:w-40 h-28 bg-gray-200 rounded-lg object-cover" />
            <div className="flex-1">
               <div className="flex justify-between items-start">
                 <h3 className="font-bold text-lg text-[#2c3e50] line-clamp-1">{t.title}</h3>
                 <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600">Delete</button>
               </div>
               <p className="text-xs text-gray-500 mb-2">Time: {t.date}</p>
               <div className="flex gap-3 text-xs font-semibold text-gray-600 mb-2">
                 <span className="bg-gray-100 px-2 py-1 rounded">Prize: ₹{t.prizePool}</span>
                 <span className="bg-gray-100 px-2 py-1 rounded">Fee: ₹{t.entryFee}</span>
                 <span className="bg-gray-100 px-2 py-1 rounded">Type: {t.type}</span>
               </div>
               <div className="flex flex-wrap gap-2 mt-4">
                 <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium hover:bg-blue-200" onClick={() => openEditModal(t)}>Edit</button>
                 <button className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm font-medium hover:bg-purple-200" onClick={() => setShowPlayersModal(t.id)}>Players ({t.participants?.length || 0})</button>
                 <button className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-sm font-medium hover:bg-amber-200" onClick={() => setRoomModalInfo({id: t.id, roomId: t.roomId || '', roomPassword: t.roomPassword || ''})}>Room ID</button>
                 {t.status === 'upcoming' ? (
                   <button onClick={() => updateDoc(doc(db, 'tournaments', t.id), { status: 'live' })} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium hover:bg-green-200">Go Live</button>
                 ) : t.status === 'live' || t.status === 'ongoing' ? (
                   <button onClick={() => updateDoc(doc(db, 'tournaments', t.id), { status: 'completed' })} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-medium hover:bg-red-200">Finish Match</button>
                 ) : null}
               </div>
            </div>
          </div>
        ))}
      </div>

      {showPlayersModal && (
        <PlayersModal 
          tournamentId={showPlayersModal} 
          onClose={() => setShowPlayersModal(null)} 
        />
      )}
    </div>
  );
}

function PlayersModal({ tournamentId, onClose }: { tournamentId: string, onClose: () => void }) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, `tournaments/${tournamentId}/participants`), (snap) => {
      setPlayers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [tournamentId]);

  const verifyPlayer = async (p: any) => {
    if (confirm(`Approve result for ${p.inGameName || 'Player'}? This should award points if needed.`)) {
      try {
        await updateDoc(doc(db, `tournaments/${tournamentId}/participants`, p.id), { verified: true });
        
        // Update user stats
        if (p.userId) {
           const userRef = doc(db, 'users', p.userId);
           const userSnap = await getDoc(userRef);
           if (userSnap.exists()) {
             const data = userSnap.data();
             const newMatches = (data.totalMatches || 0) + 1;
             const newKills = (data.totalKills || 0) + (p.kills || 0);
             const kdRatio = newMatches > 0 ? (newKills / newMatches).toFixed(2) : '0.0';
             
             await updateDoc(userRef, {
               totalMatches: newMatches,
               totalKills: newKills,
               kdRatio: kdRatio
             });
           }
        }
        alert('Verified successfully');
      } catch(e) {
        console.error(e);
        alert('Failed to verify completely.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Match Players & Results</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          {loading ? (
            <p className="text-center py-4">Loading...</p>
          ) : players.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No players joined yet.</p>
          ) : (
            <div className="space-y-4">
              {players.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold">{p.inGameName}</p>
                      <p className="text-xs text-gray-500">UID: {p.userId}</p>
                    </div>
                    {p.verified ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">VERIFIED</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold">PENDING</span>
                    )}
                  </div>
                  {(p.screenshotUrl || p.kills > 0 || p.placement > 0) && (
                    <div className="mt-2 text-sm border-t pt-2">
                      <p>Kills: <strong>{p.kills || 0}</strong></p>
                      <p>Placement: <strong>{p.placement || 0}</strong></p>
                      {p.screenshotUrl && (
                        <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs block mt-1">View Screenshot</a>
                      )}
                      {!p.verified && (
                        <button onClick={() => verifyPlayer(p)} className="mt-2 bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600 font-bold">
                          Verify Result
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDeposits() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'deposit_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAction = async (id: string, status: string, amount: number, userId: string) => {
    if (confirm(`Are you sure you want to ${status} this deposit?`)) {
       try {
         await updateDoc(doc(db, 'deposit_requests', id), { status });
         if (status === 'completed' || status === 'approved') {
           const userRef = doc(db, 'users', userId);
           const userSnap = await getDoc(userRef);
           if (userSnap.exists()) {
             await updateDoc(userRef, {
               totalBalance: (userSnap.data().totalBalance || 0) + amount,
               depositBalance: (userSnap.data().depositBalance || 0) + amount,
               walletBalance: (userSnap.data().walletBalance || 0) + amount // keep for legacy fallback
             });
           }
         }
       } catch (error) {
         console.error(error);
         toast.error('Failed to update deposit / user balance (Missing Permissions)');
       }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
      <h3 className="text-xl font-bold mb-4">Deposit Requests</h3>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
             <div>
                <h4 className="font-bold text-sm">User: <span className="font-medium text-xs">{req.username || req.userId}</span></h4>
                {req.utr && <p className="text-xs text-gray-500 font-mono mt-0.5">UTR: {req.utr}</p>}
                <p className="text-sm font-bold text-green-600 mt-1">₹{req.amount} <span className="text-[10px] text-gray-400 font-normal ml-1">({req.createdAt ? format(req.createdAt.toDate(), 'MMM d, h:mm a') : 'Now'})</span></p>
                <div className="text-xs text-brand-purple mt-1 capitalize font-medium px-2 py-0.5 bg-brand-purple/10 inline-block rounded">{req.status}</div>
             </div>
             {req.status === 'pending' && (
               <div className="space-x-2 flex">
                   <button onClick={() => handleAction(req.id, 'approved', req.amount, req.userId)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg shadow text-sm font-bold hover:bg-green-600">Approve</button>
                   <button onClick={() => handleAction(req.id, 'rejected', req.amount, req.userId)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg shadow text-sm font-bold hover:bg-red-600">Reject</button>
               </div>
             )}
          </div>
        ))}
        {requests.length === 0 && <p className="text-center text-gray-500 py-4">No deposit requests.</p>}
      </div>
    </div>
  );
}

function AdminWithdrawals() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'wallet_transactions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((tx: any) => tx.type === 'withdrawal'));
    });
    return () => unsub();
  }, []);

  const handleAction = async (id: string, status: string, amount: number, userId: string) => {
    if (confirm(`Are you sure you want to ${status} this withdrawal?`)) {
       try {
         await updateDoc(doc(db, 'wallet_transactions', id), { status });
         if (status === 'completed' || status === 'approved') {
           const userRef = doc(db, 'users', userId);
           const userSnap = await getDoc(userRef);
           if (userSnap.exists()) {
             await updateDoc(userRef, {
               totalBalance: Math.max(0, (userSnap.data().totalBalance || 0) - amount),
               winningBalance: Math.max(0, (userSnap.data().winningBalance || 0) - amount),
               walletBalance: Math.max(0, (userSnap.data().walletBalance || 0) - amount) // legacy fallback
             });
           }
         }
       } catch (error) {
         console.error(error);
         toast.error('Failed to update withdrawal / user balance (Missing Permissions)');
       }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
      <h3 className="text-xl font-bold mb-4">Withdrawal Requests</h3>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
             <div>
                <h4 className="font-bold text-sm">User ID: <span className="font-mono text-xs">{req.userId}</span></h4>
                <p className="text-sm font-bold text-red-500">₹{req.amount} <span className="text-[10px] text-gray-400 font-normal ml-1">({req.createdAt ? format(req.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Now'})</span></p>
                <div className="text-xs text-gray-500 mt-1 capitalize font-medium">Status: {req.status}</div>
             </div>
             {req.status === 'pending' && (
               <div className="space-x-2">
                   <button onClick={() => handleAction(req.id, 'completed', req.amount, req.userId)} className="bg-green-500 text-white px-3 py-1 rounded shadow text-sm font-bold">Approve</button>
                   <button onClick={() => handleAction(req.id, 'rejected', req.amount, req.userId)} className="bg-red-500 text-white px-3 py-1 rounded shadow text-sm font-bold">Reject</button>
               </div>
             )}
          </div>
        ))}
        {requests.length === 0 && <p className="text-center text-gray-500 py-4">No withdrawal requests.</p>}
      </div>
    </div>
  );
}

function AdminSliders() {
  const [sliders, setSliders] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    gradient: 'from-blue-900/40 via-blue-800/30 to-indigo-900/40',
    iconType: 'Megaphone',
    spriteSeed: 'ninja',
    link: '',
    status: 'active',
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'sliders'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setSliders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await updateDoc(doc(db, 'sliders', isEditing), {
          ...formData,
          order: Number(formData.order)
        });
      } else {
        await addDoc(collection(db, 'sliders'), {
          ...formData,
          order: Number(formData.order),
          createdAt: serverTimestamp()
        });
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Error saving slider');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this slider?')) {
      await deleteDoc(doc(db, 'sliders', id));
    }
  };

  const editSlider = (s: any) => {
    setIsEditing(s.id);
    setFormData({
      title: s.title || '',
      image: s.image || '',
      gradient: s.gradient || 'from-blue-900/40 via-blue-800/30 to-indigo-900/40',
      iconType: s.iconType || 'Megaphone',
      spriteSeed: s.spriteSeed || 'ninja',
      link: s.link || '',
      status: s.status || 'active',
      order: s.order || 0
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({
      title: '',
      image: '',
      gradient: 'from-blue-900/40 via-blue-800/30 to-indigo-900/40',
      iconType: 'Megaphone',
      spriteSeed: 'ninja',
      link: '',
      status: 'active',
      order: sliders.length
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold">Slider Banners</h2>
          <p className="text-sm text-gray-500 text-muted-foreground">Manage homepage sliding banners</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Slider
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sliders.map(s => (
          <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => editSlider(s)}>
              <div className="w-20 h-16 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden border shrink-0">
                {s.image ? (
                  <img src={s.image} alt={s.title || "Banner"} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-r ${s.gradient || 'from-[#0F0B1E] via-[#2A1657] to-[#0A0714]'} flex items-center justify-center relative overflow-hidden`}>
                    <ImageIcon className="w-5 h-5 text-white absolute z-10" />
                    <div 
                       className="absolute left-[-5px] bottom-0 w-1/2 h-full bg-contain bg-no-repeat bg-bottom opacity-50 pointer-events-none" 
                       style={{ backgroundImage: `url('https://api.dicebear.com/7.x/adventurer/svg?seed=${s.spriteSeed}&flip=true')` }}
                     />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: s.title || s.image || 'Untitled Banner' }} />
                <div className="flex gap-2 text-xs mt-1">
                  <span className={`px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {(s.status || 'ACTIVE').toUpperCase()}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Order: {s.order}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => editSlider(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit className="w-5 h-5" /></button>
              <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
        {sliders.length === 0 && <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-sm border">No sliders found.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">{isEditing ? 'Edit Slider' : 'New Slider'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <ImageUploader 
                  label="Slider Banner Image (Optional - If specified, will be used as the banner background instead of gradient)" 
                  value={formData.image} 
                  onChange={(url) => setFormData({...formData, image: url})} 
                  placeholder="https://example.com/slide1.jpg" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Title (HTML allowed block - for gradient banners only)</label>
                <textarea value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-2 rounded" rows={3} placeholder="WIN<br/>BIG<br/>PRIZES" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Gradient Class</label>
                  <input type="text" value={formData.gradient} onChange={e => setFormData({...formData, gradient: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Sprite Seed (Avatar)</label>
                  <input type="text" value={formData.spriteSeed} onChange={e => setFormData({...formData, spriteSeed: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Icon Name</label>
                  <select value={formData.iconType} onChange={e => setFormData({...formData, iconType: e.target.value})} className="w-full border p-2 rounded">
                    <option value="Trophy">Trophy</option>
                    <option value="Gamepad2">Gamepad2</option>
                    <option value="PlayCircle">PlayCircle</option>
                    <option value="Instagram">Instagram</option>
                    <option value="CheckCircle2">CheckCircle2</option>
                    <option value="Crosshair">Crosshair</option>
                    <option value="Megaphone">Megaphone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Order</label>
                  <input type="number" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border p-2 rounded">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Link (Optional UX)</label>
                  <input type="text" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full border p-2 rounded" placeholder="/tournaments" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 mt-4">
                {loading ? 'Saving...' : 'Save Slider'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminExpenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Prize Distribution' });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'expenses'), orderBy('createdAt', 'desc')), snap => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'expenses'), {
      title: newExpense.title,
      amount: Number(newExpense.amount),
      category: newExpense.category,
      createdAt: serverTimestamp()
    });
    setShowAdd(false);
    setNewExpense({ title: '', amount: '', category: 'Prize Distribution' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense?')) {
      await deleteDoc(doc(db, 'expenses', id));
    }
  };

  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold">Platform Expenses</h2>
          <p className="text-sm text-gray-500">Track and manage outgoing platform expenses</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex gap-2 items-center" onClick={() => setShowAdd(true)}>
          <Plus className="w-5 h-5" /> Add Expense
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="bg-red-50 p-4 rounded-full">
          <Banknote className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-bold uppercase">Total Expenses</p>
          <p className="text-2xl font-black text-red-600">₹{total}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">Expense History</h3>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {expenses.map(e => (
            <div key={e.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{e.title}</p>
                <div className="flex gap-2 text-xs text-gray-500 uppercase font-medium mt-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{e.category}</span>
                  <span>{e.createdAt?.toDate ? format(e.createdAt.toDate(), 'PPP') : 'Just now'}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-red-600 font-bold">-₹{e.amount}</span>
                <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && <div className="p-8 text-center text-gray-500">No expenses recorded yet.</div>}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold">Add Expense</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Title / Description</label>
                <input required type="text" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Server Hosting" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Amount (₹)</label>
                <input required type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" min="1" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Category</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                  <option>Prize Distribution</option>
                  <option>Server & Tech</option>
                  <option>Marketing</option>
                  <option>Staff & Operators</option>
                  <option>Other</option>
                </select>
              </div>
              <button className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow-sm hover:bg-blue-700">Save Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminContentEditor({ docId, title }: { docId: string, title: string }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = doc(db, 'app_content', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data().text || '');
        } else {
          setContent('Welcome to ' + title + '.\n\nEdit this content here.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [docId, title]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Need to use setDoc with merge: true in case it doesn't exist
      await setDoc(doc(db, 'app_content', docId), {
        text: content,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success('Content saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save content (Missing Permissions?)');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)]">
      <div className="mb-4">
         <h2 className="text-xl font-bold">{title}</h2>
         <p className="text-sm text-gray-500">Edit the text that appears in the user app. HTML is allowed.</p>
      </div>
      <div className="flex-1 min-h-0 flex flex-col gap-4">
         <textarea 
           className="w-full flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed whitespace-pre"
           value={content}
           onChange={(e) => setContent(e.target.value)}
           placeholder="Enter content here..."
         />
         <button 
           onClick={handleSave} 
           disabled={saving}
           className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition w-full md:w-auto md:px-8 self-end"
         >
           {saving ? 'Saving...' : 'Save Content'}
         </button>
      </div>
    </div>
  );
}

function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(list);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'notifications', editingId), {
          title,
          body,
          updatedAt: serverTimestamp()
        });
        alert('Notification updated successfully!');
        setEditingId(null);
        setTitle('');
        setBody('');
      } else {
        await addDoc(collection(db, 'notifications'), {
          title,
          body,
          readBy: [],
          createdAt: serverTimestamp()
        });
        alert('Notification sent to all users!');
        setTitle('');
        setBody('');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save notification');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (n: any) => {
    setEditingId(n.id);
    setTitle(n.title || '');
    setBody(n.body || '');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
        alert('Notification deleted successfully!');
        if (editingId === id) {
          setEditingId(null);
          setTitle('');
          setBody('');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to delete notification');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white rounded-xl shadow p-6 border border-gray-100">
           <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Notification' : 'Send Push Notification'}</h2>
           <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Server Maintenance" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Message</label>
                <textarea 
                  required 
                  value={body} 
                  onChange={(e) => setBody(e.target.value)} 
                  rows={4} 
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Message content..."
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-grow bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Notification' : 'Send Broadcast'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
           </form>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Sent Notifications Logs</h2>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="font-medium">No sent notifications found.</p>
              <p className="text-xs">Create your first broadcast notification using the form.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm leading-tight">{n.title}</span>
                      {n.createdAt && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {format(n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-normal whitespace-pre-wrap">{n.body}</p>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-1">
                      <span>Seen by: <strong>{n.readBy?.length || 0}</strong> users</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0 md:self-start">
                    <button 
                      onClick={() => handleEdit(n)}
                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-2.5 py-1.5 rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(n.id)}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-bold px-2.5 py-1.5 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminAppUpdate() {
  const [version, setVersion] = useState('');
  const [link, setLink] = useState('');
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'app_settings', 'general'));
        if (docSnap.exists()) {
          setVersion(docSnap.data().latestVersion || '');
          setLink(docSnap.data().updateLink || '');
          setMaintenance(docSnap.data().maintenanceMode || false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'app_settings', 'general'), {
        latestVersion: version,
        updateLink: link,
        maintenanceMode: maintenance,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100 max-w-2xl">
       <h2 className="text-xl font-bold mb-4">App Update & Maintenance</h2>
       <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Latest App Version (e.g. 1.0.5)</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1.0.0" />
            <p className="text-xs text-gray-500 mt-1">Users on an older version will be prompted to update.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">App Update Link (APK / Play Store)</label>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
          </div>
          <div className="pt-4 border-t border-gray-100">
            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} className="w-5 h-5 text-red-600 rounded" />
              <span className="font-bold text-red-600">Enable Maintenance Mode</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-8">When enabled, regular users will not be able to access the app.</p>
          </div>
          <button type="submit" disabled={saving} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-4">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
       </form>
    </div>
  );
}

function AdminStaff() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), (snap) => {
      setAdmins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100 max-w-2xl">
       <div className="flex items-center gap-3 mb-6">
         <Shield className="w-8 h-8 text-blue-600" />
         <div>
           <h2 className="text-xl font-bold">Manage Staff / Admins</h2>
           <p className="text-sm text-gray-500">Admins can access this dashboard and manage the application.</p>
         </div>
       </div>

       <div className="space-y-4">
          <h3 className="font-bold">Current Administrators (UIDs)</h3>
          {loading ? (
             <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-3">
              {admins.map(a => (
                <div key={a.id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-sm text-gray-800">{a.id}</span>
                    <p className="text-xs text-gray-500 capitalize">Role: {a.role || 'Admin'}</p>
                  </div>
                  <button onClick={async () => {
                     if (confirm(`Remove admin access for ${a.id}?`)) {
                        await deleteDoc(doc(db, 'admins', a.id));
                     }
                  }} className="text-red-500 hover:text-red-700 text-sm font-bold">Remove</button>
                </div>
              ))}
              {admins.length === 0 && <p className="text-sm text-gray-500">No admins found other than default rules.</p>}
            </div>
          )}
       </div>

       <div className="mt-8 border-t pt-6">
         <h3 className="font-bold mb-2">Add New Administrator</h3>
         <p className="text-xs text-gray-500 mb-4">To add an admin, you must know their exact Firebase User UID. They must have registered an account first.</p>
         <div className="flex gap-2">
           <input type="text" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="flex-1 border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="User UID (e.g. dKh8U...)" />
           <button onClick={async () => {
             if (!newAdminEmail.trim()) return;
             try {
               const { setDoc } = await import('firebase/firestore');
               await setDoc(doc(db, 'admins', newAdminEmail.trim()), {
                 role: 'admin',
                 createdAt: serverTimestamp()
               });
               setNewAdminEmail('');
             } catch(e) {
               console.error(e);
               alert('Failed to add admin');
             }
           }} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700">Add Admin</button>
          </div>
        </div>
     </div>
  );
}

function AdminSettings() {
  const [activeOption, setActiveOption] = useState<'all' | 'play_with_ads_coins' | 'free_matches'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'app_content', 'game_mode');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActiveOption(docSnap.data().activeOption || 'all');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveMode = async (opt: 'all' | 'play_with_ads_coins' | 'free_matches') => {
    setSaving(true);
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'app_content', 'game_mode'), {
        activeOption: opt,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setActiveOption(opt);
      alert('Selected option is now active and direct on client panel!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings. (Missing Permissions?)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100 font-sans">
         <h2 className="text-xl font-bold text-[#2c3e50]">Active Game Option Setting</h2>
         <p className="text-sm text-gray-500 mt-1">
           Choose which game/match option users can play. Selecting an option will directly display it in the user's "EXCLUSIVE" section and hide other features.
         </p>

         {loading ? (
           <div className="py-8 text-center text-gray-500">Loading configurations...</div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
             {/* Option 1: Both Options */}
             <div 
               onClick={() => !saving && handleSaveMode('all')}
               className={`p-5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between h-40 ${
                 activeOption === 'all' 
                   ? 'border-blue-500 bg-blue-50/50' 
                   : 'border-gray-200 hover:border-gray-300 bg-white'
               }`}
             >
               <div>
                 <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded-full">Standard</span>
                 <h4 className="font-bold text-lg mt-2 text-gray-900">Show Both Options</h4>
                 <p className="text-xs text-gray-500 mt-1">Users see "Play with Ads Coins" AND "Free Matches" in their panel.</p>
               </div>
               <div className="text-right">
                 {activeOption === 'all' && <span className="text-sm text-blue-600 font-extrabold">Active ✓</span>}
               </div>
             </div>

             {/* Option 2: Play with Ads Coins Only */}
             <div 
               onClick={() => !saving && handleSaveMode('play_with_ads_coins')}
               className={`p-5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between h-40 ${
                 activeOption === 'play_with_ads_coins' 
                   ? 'border-yellow-500 bg-yellow-50/30' 
                   : 'border-gray-200 hover:border-gray-300 bg-white'
               }`}
             >
               <div>
                 <span className="text-xs font-bold px-2 py-1 bg-yellow-105 text-yellow-850 rounded-full">Monetized</span>
                 <h4 className="font-bold text-lg mt-2 text-gray-900">Play with Ads Coins Only</h4>
                 <p className="text-xs text-gray-500 mt-1">Users see ONLY "Play with Ads Coins". All other features are hidden.</p>
               </div>
               <div className="text-right">
                 {activeOption === 'play_with_ads_coins' && <span className="text-sm text-yellow-600 font-extrabold">Active ✓</span>}
               </div>
             </div>

             {/* Option 3: Free Matches Only */}
             <div 
               onClick={() => !saving && handleSaveMode('free_matches')}
               className={`p-5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between h-40 ${
                 activeOption === 'free_matches' 
                   ? 'border-emerald-500 bg-emerald-50/30' 
                   : 'border-gray-200 hover:border-gray-300 bg-white'
               }`}
             >
               <div>
                 <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">Free Play</span>
                 <h4 className="font-bold text-lg mt-2 text-gray-900">Free Matches Only</h4>
                 <p className="text-xs text-gray-500 mt-1">Users see ONLY "Free Matches". All other features are hidden.</p>
               </div>
               <div className="text-right">
                 {activeOption === 'free_matches' && <span className="text-sm text-emerald-600 font-extrabold">Active ✓</span>}
               </div>
             </div>
           </div>
         )}
      </div>

      <AdminContentEditor docId="about" title="Manage About Us / App Settings" />
    </div>
  );
}