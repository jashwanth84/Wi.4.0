import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs, runTransaction, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Copy, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Join Flow state
  const [joinStep, setJoinStep] = useState(false);
  const [joining, setJoining] = useState(false);
  const [inGameName, setInGameName] = useState('');
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  
  // Upload Result state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ kills: '0', placement: '0', screenshotUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [participantData, setParticipantData] = useState<any>(null);
  
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();

  const currentBalance = (dbUser?.walletBalance || 0) + (dbUser?.bonusBalance || 0);

  useEffect(() => {
    if (!id) return;

    const unsubDoc = onSnapshot(doc(db, 'tournaments', id), (snapshot) => {
      if (snapshot.exists()) {
        setTournament({ id: snapshot.id, ...snapshot.data() });
      } else {
        setTournament(null);
      }
      setLoading(false);
    });

    return () => unsubDoc();
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

    const checkJoined = async () => {
      const q = query(collection(db, `tournaments/${id}/participants`), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setIsJoined(!querySnapshot.empty);
      if (!querySnapshot.empty) {
        setParticipantData(querySnapshot.docs[0].data());
      }
    };

    checkJoined();
  }, [id, user]);

  const handleCopy = (text: string, isId: boolean) => {
    navigator.clipboard.writeText(text);
    if (isId) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handleJoinConfirm = async () => {
    if (!tournament || !user || !dbUser) return;
    
    if (!inGameName.trim()) {
      toast.error('Please enter your In Game Name');
      setShowNamePopup(true);
      return;
    }

    if (currentBalance < tournament.entryFee) {
      toast.error('Insufficient balance! Please recharge your wallet.');
      return;
    }

    try {
      setJoining(true);

      await runTransaction(db, async (transaction) => {
        const tRef = doc(db, 'tournaments', tournament.id);
        const uRef = doc(db, 'users', user.uid);
        const pRef = doc(db, `tournaments/${tournament.id}/participants`, user.uid);
        
        const [tDoc, uDoc, pDoc] = await Promise.all([
          transaction.get(tRef),
          transaction.get(uRef),
          transaction.get(pRef)
        ]);

        if (!tDoc.exists() || !uDoc.exists()) throw new Error("Document missing");
        if (pDoc.exists()) throw new Error("Already joined");
        if ((tDoc.data().slotsFilled || 0) >= tDoc.data().slotsTotal) throw new Error("Tournament is full");
        
        const totalBalance = uDoc.data().totalBalance || uDoc.data().walletBalance || 0;
        const depositBalance = uDoc.data().depositBalance || 0;
        const winningBalance = uDoc.data().winningBalance || 0;
        
        if (totalBalance < tournament.entryFee) throw new Error("Insufficient balance");
        
        let newTotal = totalBalance;
        let newDeposit = depositBalance;
        let newWinning = winningBalance;
        let remainingFee = tournament.entryFee;
        
        if (newDeposit >= remainingFee) {
          newDeposit -= remainingFee;
          remainingFee = 0;
        } else {
          remainingFee -= newDeposit;
          newDeposit = 0;
          if (newWinning >= remainingFee) {
             newWinning -= remainingFee;
             remainingFee = 0;
          }
        }
        
        newTotal -= tournament.entryFee;

        transaction.set(pRef, {
          userId: user.uid,
          joinedAt: serverTimestamp(),
          gameId: inGameName.trim(),
          kills: 0,
          placement: 0,
          points: 0
        });

        transaction.update(uRef, {
          totalBalance: newTotal,
          depositBalance: newDeposit,
          winningBalance: newWinning,
          walletBalance: newTotal, // legacy fallback
          updatedAt: serverTimestamp()
        });

        transaction.update(tRef, {
          slotsFilled: (tDoc.data().slotsFilled || 0) + 1,
          participants: arrayUnion(user.uid)
        });
        
        if (tournament.entryFee > 0) {
          const transRef = doc(collection(db, 'wallet_transactions'));
          transaction.set(transRef, {
            userId: user.uid,
            type: 'tournament_fee',
            amount: tournament.entryFee,
            status: 'completed',
            createdAt: serverTimestamp(),
            tournamentId: tournament.id
          });
        }
      });

      setIsJoined(true);
      setShowConfirmPopup(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const handleUploadResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setUploading(true);
    try {
      // In a real app, you'd verify the upload, here we just set it
      // And we might want to let Admin verify before awarding points.
      // But the request asks for "players upload screenshots", "Admin verifies results"
      // We'll store it as pending verification.
      const pRef = doc(db, `tournaments/${id}/participants`, user.uid);
      await runTransaction(db, async (t) => {
        t.update(pRef, {
          kills: Number(uploadData.kills),
          placement: Number(uploadData.placement),
          screenshotUrl: uploadData.screenshotUrl,
          verified: false,
          updatedAt: serverTimestamp()
        });
      });
      toast.success('Result uploaded successfully! Waiting for admin verification.');
      setShowUploadModal(false);
      // local update
      setParticipantData((prev: any) => ({ ...prev, kills: Number(uploadData.kills), placement: Number(uploadData.placement), screenshotUrl: uploadData.screenshotUrl, verified: false }));
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to upload result: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center flex h-screen items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!tournament) return <div className="p-8 text-center text-gray-500 bg-white min-h-screen">Tournament not found.</div>;

  if (joinStep) {
    return (
      <div className="bg-[#071a35] min-h-screen text-white font-sans">
        <div className="max-w-md mx-auto px-4 pt-4 pb-10 flex flex-col min-h-screen">
          <header className="flex items-center space-x-3 mb-6">
            <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full" onClick={() => setJoinStep(false)}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-semibold text-lg">Joining Match</h1>
          </header>
          
          <div className="flex space-x-4 mb-6">
            <img alt="Wallet Icon" className="w-20 h-20 flex-shrink-0 rounded shadow" src="https://storage.googleapis.com/a1aa/image/8725def4-9d7f-4495-cea3-5cb5fc7e6f46.jpg"/>
            <div className="flex flex-col justify-center space-y-3 flex-grow">
              <div className="text-right text-white text-sm font-normal flex items-center justify-end gap-1">
                Your Current Balance :
                <span className="inline-flex items-center font-bold">
                  <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center mr-1">
                    <span className="text-[8px] font-black text-white" style={{ WebkitTextStroke: '0.5px #B45309' }}>C</span>
                  </div>
                  {currentBalance.toFixed(2)}
                </span>
              </div>
              <p className="text-right text-white text-sm font-normal">
                Match Time : <span className="font-bold">{tournament.startTime ? format(new Date(tournament.startTime.toDate()), "hh:mm a") : (tournament.date?.split(',')[1] || 'TBA')}</span>
              </p>
              <p className="text-right text-white text-sm font-normal">
                Match Type : <span className="font-bold">{tournament.type || 'Solo'}</span>
              </p>
              <div className="text-right text-white text-sm font-normal flex items-center justify-end gap-1">
                Match Entry Fee Per Person :
                <span className="inline-flex items-center font-bold">
                  {tournament.entryFee > 0 ? (
                    <>
                      <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center mr-1">
                        <span className="text-[8px] font-black text-white" style={{ WebkitTextStroke: '0.5px #B45309' }}>C</span>
                      </div>
                      {tournament.entryFee}
                    </>
                  ) : 'Free'}
                </span>
              </div>
              <div className="text-right text-white text-sm font-normal flex items-center justify-end gap-1">
                Total Payable Amount :
                <span className="inline-flex items-center font-bold text-yellow-400">
                  {tournament.entryFee > 0 ? (
                    <>
                      <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center mr-1">
                        <span className="text-[8px] font-black text-white" style={{ WebkitTextStroke: '0.5px #B45309' }}>C</span>
                      </div>
                      {tournament.entryFee}
                    </>
                  ) : 'Free'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="rounded-t-md bg-[#5c00ff] font-semibold text-white text-center py-2">
            Selected Position
          </div>
          <table className="w-full rounded-b-md bg-white text-black text-sm">
            <thead>
              <tr>
                <th className="py-2 font-bold text-left px-4">Team</th>
                <th className="py-2 font-bold text-left px-4">Position</th>
                <th className="py-2 font-bold text-left px-4">In Game Name</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="py-3 px-4 text-gray-600">Team 1</td>
                <td className="py-3 px-4 text-gray-600">{(tournament.slotsFilled || 0) + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    {inGameName ? (
                      <>
                        <span className="bg-gray-200 text-black px-2 py-1 rounded text-xs">{inGameName}</span>
                        <button onClick={() => setShowNamePopup(true)} className="bg-[#2c2f3a] text-white text-[11px] font-semibold rounded px-2.5 py-1 uppercase">Edit info</button>
                      </>
                    ) : (
                      <button onClick={() => setShowNamePopup(true)} className="bg-[#2c2f3a] text-white text-[11px] font-semibold rounded px-2.5 py-1 uppercase">Add info</button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="flex justify-between mt-8 gap-4">
            <button className="flex-1 bg-[#4a4a4a] text-white font-semibold py-3 rounded-md tracking-wider transition hover:bg-[#5a5a5a]" onClick={() => setJoinStep(false)}>CANCEL</button>
            <button 
              onClick={handleJoinConfirm} 
              disabled={joining}
              className="flex-1 bg-[#5c00ff] text-white font-semibold py-3 rounded-md tracking-wider transition hover:bg-[#6c10ff] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {joining ? 'JOINING...' : 'JOIN'}
            </button>
          </div>
          
          <div className="flex-grow"></div>
          
          <p className="text-white/80 text-sm font-mono mb-6 text-center mt-6">
            Note - Please Enter Your In Game Username/ Name.
          </p>
        </div>

        {/* Game Name Popup */}
        {showNamePopup && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-[#1e2436] text-white text-center text-lg font-semibold py-3">
                Join Match
              </div>
              <div className="p-4">
                <label className="block text-[#1e2436] text-sm font-semibold mb-1">
                  Player In Game Name
                </label>
                <input
                  type="text"
                  value={inGameName}
                  onChange={(e) => setInGameName(e.target.value)}
                  placeholder="Enter your exact game name"
                  className="w-full border-b-2 border-gray-300 focus:outline-none focus:border-blue-600 pb-1 mb-4 text-base text-black bg-transparent"
                />
                
                <p className="text-gray-600 text-[13px] mb-6 font-medium text-center">
                  Make sure you have entered correct information
                </p>
                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => setShowNamePopup(false)}
                    className="flex-1 bg-[#e87c7c] text-white font-semibold py-2.5 rounded-md hover:bg-[#d96b6b] transition text-sm"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => {
                      if (inGameName.trim()) {
                        setShowNamePopup(false);
                      } else {
                        toast.error('Name cannot be empty');
                      }
                    }}
                    className="flex-1 bg-[#5ac9b7] text-white font-semibold py-2.5 rounded-md hover:bg-[#4bb9a8] transition text-sm"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Popup */}
        {showConfirmPopup && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-[#1e2436] text-white text-center text-lg font-semibold py-3">
                CONFIRMATION
              </div>
              <div className="p-5 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-800 text-sm mb-6 font-medium leading-relaxed">
                  Congratulations!!! You have successfully joined this match. Entry fee has been deducted from your account. Room Id and Password will be visible 15 minutes before match starts.
                </p>
                <button
                  onClick={() => {
                    setShowConfirmPopup(false);
                    setJoinStep(false);
                  }}
                  className="w-full bg-[#5ac9b7] text-white font-semibold py-3 rounded-md hover:bg-[#4bb9a8] transition tracking-wider"
                >
                  OKAY
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Match Info View
  return (
    <div className="bg-white text-gray-900 font-sans min-h-screen">
      <div className="max-w-md mx-auto border-x border-gray-200 min-h-screen shadow-sm pb-24">
        {/* Header */}
        <header className="flex items-center bg-[#161c2d] text-white px-4 py-3 sticky top-0 z-10">
          <button aria-label="Back" className="p-1 -ml-1 mr-2 hover:bg-white/10 rounded-full transition" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold leading-none truncate mt-0.5">
            {tournament.title}
          </h1>
        </header>
        
        {/* Image placeholder with bottom nav */}
        <div className="relative bg-gray-200 h-[200px] w-full">
          <img 
            src={tournament.imageUrl || tournament.image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${tournament.id || 'arena'}&flip=true`}
            alt="Match Banner" 
            className="w-full h-full object-cover"
            style={{ backgroundColor: (tournament.imageUrl || tournament.image) ? 'transparent' : '#2f1b69' }} 
          />
          <nav className="absolute bottom-0 left-0 right-0 bg-[#161c2d]/90 backdrop-blur flex justify-center text-white text-[13px] font-semibold px-6 pt-3 pb-2">
            <span className="border-b-2 border-white pb-1 px-1">
              DESCRIPTION
            </span>
          </nav>
        </div>
        
        {/* Content */}
        <main className="p-5">
          {/* Room Details Box - Only shown to joined players when match is close */}
          {isJoined && (
            <div className="mb-6">
              <div className="flex flex-col bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-4 max-w-xs w-full space-y-3 mx-auto">
                <h1 className="text-blue-600 text-center text-lg font-bold">
                  Room Details
                </h1>
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm font-medium">Room ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 font-mono">{tournament.roomId || 'Wait...'}</span>
                      {tournament.roomId && (
                        <button onClick={() => handleCopy(tournament.roomId, true)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded">
                          {copiedId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="text-gray-600 text-sm font-medium">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 font-mono">{tournament.roomPassword || 'Wait...'}</span>
                      {tournament.roomPassword && (
                        <button onClick={() => handleCopy(tournament.roomPassword, false)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded">
                          {copiedPass ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-blue-600 font-bold text-[17px] mb-4 leading-tight uppercase tracking-wide">
            {tournament.title}
          </h2>
          
          <div className="flex flex-wrap gap-2.5 mb-6">
            <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-gray-600">
              Type : <span className="font-bold text-gray-900 ml-1">{tournament.type || 'Solo'}</span>
            </div>
            <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap flex items-center gap-1.5 text-gray-600">
              Entry Fee :
              {tournament.entryFee > 0 ? (
                <span className="font-bold text-gray-900 flex items-center gap-1 inline-flex">
                   <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center -mt-0.5">
                     <span className="text-[8px] font-black text-white" style={{ WebkitTextStroke: '0.5px #B45309' }}>C</span>
                   </div>
                   {tournament.entryFee}
                </span>
              ) : (
                <span className="font-bold text-green-600">Free</span>
              )}
            </div>
            <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-gray-600">
              Version : <span className="font-bold text-gray-900 ml-1">{tournament.version || 'TPP'}</span>
            </div>
            <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-gray-600">
              Map : <span className="font-bold text-gray-900 ml-1">{tournament.map || 'Bermuda'}</span>
            </div>
            <div className="border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-gray-600 flex-1 min-w-[200px]">
              Match Schedule : <span className="font-bold text-gray-900 ml-1">{tournament.startTime ? format(new Date(tournament.startTime.toDate()), "dd/MM/yyyy hh:mm a") : (tournament.date || 'TBA')}</span>
            </div>
          </div>
          
          <h3 className="text-blue-600 font-bold text-base mb-3 leading-tight uppercase tracking-wide">
            Price Details
          </h3>
          <div className="flex flex-wrap gap-2.5 mb-8">
            <div className="border border-gray-200 bg-yellow-50/50 rounded-md px-4 py-2.5 text-sm font-medium whitespace-nowrap text-gray-700 flex-1">
              PRIZE POOL : <span className="font-bold text-gray-900 ml-1 text-base">{tournament.prizePool}</span>
            </div>
            <div className="border border-gray-200 bg-blue-50/50 rounded-md px-4 py-2.5 text-sm font-medium whitespace-nowrap text-gray-700 flex-1">
              PER KILL : <span className="font-bold text-gray-900 ml-1 text-base">{tournament.perKillReward || 0}</span>
            </div>
          </div>
          
          <h3 className="text-blue-600 font-bold text-base mb-3 leading-tight uppercase tracking-wide">
            About this Match
          </h3>
          <div className="mb-4 text-sm leading-relaxed text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-100 min-h-[150px]">
            {tournament.rules ? (
              <div dangerouslySetInnerHTML={{ __html: tournament.rules.replace(/\n/g, '<br>') }} />
            ) : (
              <div className="space-y-2">
                <p>1. Play fair and maintain sportsmanship.</p>
                <p>2. Emulators are strictly prohibited unless specified.</p>
                <p>3. Room ID and password will be shared here 15 mins before match start time.</p>
                <p>4. Teaming up with enemies will lead to a permanent ban.</p>
                <p>5. Ensure your game ID exactly matches your registered in-game name.</p>
                <p className="mt-4 text-xs text-gray-500 font-medium">Admins reserve the right to modify rules and make final decisions.</p>
              </div>
            )}
          </div>
        </main>

        {/* Fixed Bottom Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20 pb-safe">
          <div className="max-w-md mx-auto flex gap-3">
            {isJoined ? (
              <div className="flex-1 flex flex-col gap-2">
                <button 
                  disabled 
                  className="bg-green-600 text-white font-bold tracking-wider py-3.5 rounded-md text-center shadow-sm opacity-90 cursor-not-allowed"
                >
                  JOINED
                </button>
                {(tournament.status === 'live' || tournament.status === 'ongoing' || tournament.status === 'completed') && (
                  <button 
                    onClick={() => {
                      setUploadData({
                        kills: participantData?.kills || '0',
                        placement: participantData?.placement || '0',
                        screenshotUrl: participantData?.screenshotUrl || ''
                      });
                      setShowUploadModal(true);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold tracking-wider py-2 rounded-md text-center shadow-sm transition active:scale-[0.98]"
                  >
                    {participantData?.screenshotUrl ? 'UPDATE RESULT' : 'UPLOAD RESULT'}
                  </button>
                )}
              </div>
            ) : (tournament.slotsFilled || 0) >= tournament.slotsTotal ? (
              <button 
                disabled 
                className="flex-1 bg-gray-400 text-white font-bold tracking-wider py-3.5 rounded-md text-center shadow-sm cursor-not-allowed"
              >
                FULL
              </button>
            ) : tournament.status !== 'open' && tournament.status !== 'upcoming' ? (
              <button 
                disabled 
                className="flex-1 bg-gray-400 text-white font-bold tracking-wider py-3.5 rounded-md text-center shadow-sm cursor-not-allowed uppercase"
              >
                {tournament.status}
              </button>
            ) : (
              <button 
                onClick={() => setJoinStep(true)}
                className="flex-1 bg-[#5c00ff] text-white font-bold tracking-wider py-3.5 rounded-md text-center shadow hover:bg-[#6c10ff] transition active:scale-[0.98]"
              >
                JOIN MATCH
              </button>
            )}
            <button 
              onClick={() => toast.success('Players list feature coming soon!')}
              className="flex-[0.7] bg-[#2c2f3a] text-white font-bold tracking-wider py-3.5 rounded-md text-center shadow hover:bg-[#3a3d4a] transition active:scale-[0.98]"
            >
              PLAYERS
            </button>
          </div>
        </div>

        {/* Upload Result Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm relative">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-xl font-bold mb-4">Upload Result</h3>
              <form onSubmit={handleUploadResult} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Total Kills</label>
                  <input type="number" min="0" required value={uploadData.kills} onChange={e => setUploadData({...uploadData, kills: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Placement / Rank</label>
                  <input type="number" min="1" required value={uploadData.placement} onChange={e => setUploadData({...uploadData, placement: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Screenshot URL (Imgur/Drive)</label>
                  <input type="url" required value={uploadData.screenshotUrl} onChange={e => setUploadData({...uploadData, screenshotUrl: e.target.value})} className="w-full border p-2 rounded" placeholder="https://" />
                </div>
                <button type="submit" disabled={uploading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg text-center shadow transition">
                  {uploading ? 'UPLOADING...' : 'SUBMIT RESULT'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
