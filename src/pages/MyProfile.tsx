import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, UserCircle, Mail, Hash, Globe, Edit2, X, Check, Camera, RefreshCw, Upload, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function MyProfile() {
  const { dbUser, user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    username: '',
    photoURL: '',
    country: '',
    phone: ''
  });

  // Camera & Upload state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Clean stream on unmount or close
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle closing camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setCameraError(null);
  };

  // Start back or front camera
  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    setCapturedImage(null);
    setCameraActive(true);
    setIsCapturing(true);

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setIsCapturing(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate cameras
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setCameraDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDevice) {
          setSelectedDevice(deviceId || videoInputs[0].deviceId);
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCapturing(false);
      setCameraError('Could not access device camera. Please grant camera permission.');
    }
  };

  // Switch camera source
  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    await startCamera(deviceId);
  };

  // Capture photo from streaming video track
  const captureFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Horizontal mirrors
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        
        // Stop the streaming feed
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
      }
    }
  };

  // Apply the base64 captured frame
  const applyCapturedPhoto = () => {
    if (capturedImage) {
      setEditForm(prev => ({ ...prev, photoURL: capturedImage }));
      setCameraActive(false);
      setCapturedImage(null);
      toast.success('Camera photo applied to profile avatar!');
    }
  };

  // File Upload base e64 encoding
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image is too large. Choose an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditForm(prev => ({ ...prev, photoURL: result }));
        toast.success('Custom avatar loaded from file!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      username: dbUser?.username || '',
      photoURL: dbUser?.photoURL || user?.photoURL || '',
      country: dbUser?.country || '',
      phone: dbUser?.phone || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: editForm.username,
        photoURL: editForm.photoURL,
        country: editForm.country,
        phone: editForm.phone,
        updatedAt: new Date()
      });
      toast.success('Profile updated successfully!');
      // Update local state temporarily if needed, though onSnapshot or reload might be better.
      // But we use AuthContext, so wait for auth context to re-trigger, or just close and let user reload. 
      // Actually AuthContext doesn't use onSnapshot, it uses getDoc once onAuthStateChanged.
      // So dbUser won't update immediately unless we refresh or update context.
      // Easiest is to reload page if we want to show changes without context refactoring.
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black font-sans pb-20 relative">
      <header className="flex items-center justify-between px-4 py-3 bg-[#12182F] sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <button aria-label="Back" className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold text-lg tracking-wide">User Identity</h1>
        </div>
        {!isEditing && (
          <button 
            onClick={handleEditClick}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors text-sm font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </header>

      <div className="flex flex-col px-4 pt-6 max-w-[500px] mx-auto w-full">
        <div className="flex items-center justify-center mb-8 relative">
           <div className="w-[120px] h-[120px] rounded-full border-[3px] border-[#3B82F6] overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.4)] relative group bg-[#12182F]">
             <img 
               src={dbUser?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${dbUser?.username || user?.uid || 'user'}`} 
               alt="Profile" 
               className="w-full h-full object-cover" 
               referrerPolicy="no-referrer"
               onError={(e) => {
                 e.currentTarget.onerror = null;
                 e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${dbUser?.username || user?.uid || 'user'}`;
               }}
             />
             {isEditing && (
               <div className="absolute inset-x-0 bottom-0 top-0 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-sm pointer-events-none">
                 <Camera className="w-8 h-8 mb-1 opacity-80" />
                 <span className="text-[10px] font-bold text-center px-2">Edit URL in form</span>
               </div>
             )}
           </div>
        </div>

        <div className="bg-[#1A0B2E] rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5 shadow-lg">
          <div className="px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <UserCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white/60 text-[12px] font-medium mb-0.5">Username / Gamer tag</p>
              <p className="text-white font-bold text-[15px] truncate">{dbUser?.username || 'Not set'}</p>
            </div>
          </div>

          <div className="px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white/60 text-[12px] font-medium mb-0.5">Email / Mobile number</p>
              <p className="text-white font-bold text-[15px] truncate">{user?.email || dbUser?.phone || 'Not set'}</p>
            </div>
          </div>

          <div className="px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <Hash className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white/60 text-[12px] font-medium mb-0.5">User ID</p>
              <p className="text-white font-mono text-[13px] truncate">{user?.uid}</p>
            </div>
          </div>

          <div className="px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white/60 text-[12px] font-medium mb-0.5">Country / Region</p>
              <p className="text-white font-bold text-[15px] truncate">{dbUser?.country || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1C093B] w-full max-w-[500px] sm:rounded-2xl rounded-t-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/20">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                Edit Profile
              </h3>
              <button 
                onClick={() => { stopCamera(); setIsEditing(false); }}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[13px] text-gray-300 font-medium ml-1">Username</label>
                <input 
                  type="text" 
                  value={editForm.username} 
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                  placeholder="Enter username"
                />
              </div>

              <div className="flex flex-col gap-2.5 p-4 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[13px] text-gray-300 font-medium">Profile Avatar Control</span>
                
                {/* Visual Circle Preview */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full border border-blue-500/50 overflow-hidden shrink-0 bg-[#12182F]">
                    {editForm.photoURL ? (
                      <img src={editForm.photoURL} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold text-center p-1">No Image</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-white/95">Avatar Design Center</span>
                    <span className="text-[10.5px] text-gray-400 leading-normal">Take a snapshot using your build-in camera or choose an image file to upload.</span>
                  </div>
                </div>

                {/* Styled Pickers */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="flex items-center justify-center gap-2 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/20 hover:border-[#7C3AED]/50 text-[#A78BFA] hover:text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                  >
                    <Camera className="w-4 h-4" />
                    Take Live Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/50 text-blue-400 hover:text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Inline Camera stream or snapshot view */}
                {cameraActive && (
                  <div className="mt-3 p-3 bg-black/60 rounded-xl border border-white/10 flex flex-col items-center gap-3">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 animate-pulse">
                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                        {capturedImage ? "Photo Captured" : "Live Camera System"}
                      </span>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {cameraError ? (
                      <p className="text-xs text-red-400 text-center py-4">{cameraError}</p>
                    ) : capturedImage ? (
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="w-32 h-32 rounded-full border-2 border-green-500 overflow-hidden shadow-lg shadow-green-500/10">
                          <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => startCamera(selectedDevice)}
                            className="flex-1 bg-white/10 hover:bg-white/25 text-white py-2 rounded-lg text-xs font-bold transition"
                          >
                            Retake Photo
                          </button>
                          <button
                            type="button"
                            onClick={applyCapturedPhoto}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Use Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
                          {isCapturing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10 text-xs text-gray-400 font-bold">
                              Booting Lens...
                            </div>
                          )}
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Camera controls */}
                        <div className="flex items-center justify-between w-full gap-2">
                          {cameraDevices.length > 1 ? (
                            <select
                              value={selectedDevice}
                              onChange={(e) => handleDeviceChange(e.target.value)}
                              className="bg-black/80 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white max-w-[150px] focus:outline-none"
                            >
                              {cameraDevices.map((device, idx) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                  Camera {idx + 1}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-[1px]"></div>
                          )}

                          <button
                            type="button"
                            onClick={captureFrame}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-full shadow-[0_0_12px_rgba(220,38,38,0.4)] flex items-center justify-center transition active:scale-95 shrink-0"
                            title="Capture Photo"
                          >
                            <span className="w-4 h-4 rounded-full bg-white block"></span>
                          </button>

                          <div className="w-[1px]"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[13px] text-gray-300 font-medium">Or Paste Profile Photo URL</label>
                  <span className="text-[10px] text-purple-400 font-mono">Advanced Option</span>
                </div>
                <input 
                  type="text" 
                  value={editForm.photoURL} 
                  onChange={(e) => setEditForm({...editForm, photoURL: e.target.value})}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 font-mono text-xs"
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-gray-300 font-medium ml-1">Mobile Number (Optional)</label>
                <input 
                  type="tel" 
                  value={editForm.phone} 
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-gray-300 font-medium ml-1">Country / Region</label>
                <input 
                  type="text" 
                  value={editForm.country} 
                  onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                  placeholder="e.g. India, USA"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20 mt-auto">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
