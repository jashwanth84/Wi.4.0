import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, getDocs, collection, query, where, updateDoc, increment, addDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Trophy, ShieldAlert, UserPlus, Mail, Lock, User as UserIcon, Gamepad2 } from 'lucide-react';

export default function Register() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phoneCode: '+91',
    phoneNumber: '',
    email: '',
    freeFireId: '',
    password: '',
    confirmPassword: '',
  });
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    const registerEmail = formData.email.trim();
    if (!registerEmail.includes('@')) {
      return setError('Please enter a valid email address.');
    }

    try {
      setLoading(true);
      setError('');

      let referrerId: string | null = null;
      let referrerUsername = '';
      let referrerEmail = '';
      
      const enteredCodeRaw = formData.freeFireId.trim();
      if (enteredCodeRaw) {
        const enteredCodeClean = enteredCodeRaw.toUpperCase().replace('NG-', '');
        
        // Match standard query
        const usersRef = collection(db, 'users');
        const q1 = query(usersRef, where('referralCode', '==', enteredCodeRaw.toUpperCase()));
        const snap1 = await getDocs(q1);
        let referrerDoc = snap1.docs[0];

        if (!referrerDoc) {
          const q2 = query(usersRef, where('referralCode', '==', enteredCodeClean));
          const snap2 = await getDocs(q2);
          referrerDoc = snap2.docs[0];
        }

        if (!referrerDoc) {
          // Fallback scan
          const allUsersSnap = await getDocs(usersRef);
          referrerDoc = allUsersSnap.docs.find(d => d.id.substring(0, 6).toUpperCase() === enteredCodeClean);
        }

        if (referrerDoc) {
          referrerId = referrerDoc.id;
          referrerUsername = referrerDoc.data().username || 'Another Player';
          referrerEmail = referrerDoc.data().email || '';
        } else {
          return setError('Invalid referral code. Please check the code or clear it to register.');
        }
      }
      
      const { user } = await createUserWithEmailAndPassword(auth, registerEmail, formData.password);
      
      const userRef = doc(db, 'users', user.uid);
      const ownReferralCode = `NG-${user.uid.substring(0, 6).toUpperCase()}`;

      // Create new user profile with bonus if referred
      const signupBonus = referrerId ? 5 : 0;

      await setDoc(userRef, {
        userId: user.uid,
        displayName: formData.firstName + ' ' + formData.lastName,
        username: formData.username,
        email: registerEmail,
        phoneNumber: formData.phoneCode + formData.phoneNumber,
        referralCode: ownReferralCode,
        referredBy: referrerId || '',
        referredByCode: enteredCodeRaw || '',
        walletBalance: 0,
        bonusBalance: signupBonus,
        totalEarnings: 0,
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // If referred, credit both users
      if (referrerId) {
        // Credit referrer +10 coins
        await updateDoc(doc(db, 'users', referrerId), {
          bonusBalance: increment(10),
          totalEarnings: increment(10)
        });

        // Add referrer transaction history
        await addDoc(collection(db, 'wallet_transactions'), {
          userId: referrerId,
          userEmail: referrerEmail,
          username: referrerUsername,
          amount: 10,
          type: 'referral_bonus',
          status: 'completed',
          details: { message: `Referral bonus for inviting ${formData.username}` },
          createdAt: serverTimestamp()
        });

        // Add new user welcome transaction history
        await addDoc(collection(db, 'wallet_transactions'), {
          userId: user.uid,
          userEmail: registerEmail,
          username: formData.username,
          amount: 5,
          type: 'signup_bonus',
          status: 'completed',
          details: { message: `Welcome referral bonus from using code ${enteredCodeRaw}` },
          createdAt: serverTimestamp()
        });
      }

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black p-4 relative font-sans overflow-hidden">
      <div className="w-full max-w-[400px] mx-auto z-10 flex flex-col justify-center py-4">
        <div className="mb-6 mt-4">
          <h1 className="text-3xl font-bold text-white leading-tight tracking-wide">
            Welcome to,<br />Sign Up
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start text-red-500">
            <ShieldAlert className="h-5 w-5 mr-3 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center">
          <form onSubmit={handleRegister} className="space-y-3">
            
            <div>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                className="w-full h-12 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px]"
              />
            </div>
            
            <div>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full h-12 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px]"
              />
            </div>

            <div>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full h-12 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px]"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative w-[80px]">
                <select
                  name="phoneCode"
                  value={formData.phoneCode}
                  onChange={handleChange as any}
                  className="w-full h-12 bg-[#2D1B69] text-white rounded-full px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px] cursor-pointer"
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                  <option value="+62">+62</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
              <input
                type="tel"
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Phone number"
                className="flex-1 h-12 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px]"
              />
            </div>

            <div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full h-12 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px]"
              />
            </div>

            <div>
              <input
                type="text"
                name="freeFireId"
                value={formData.freeFireId}
                onChange={handleChange}
                placeholder="Referral Code (Optional)"
                className="w-full h-12 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px]"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full h-12 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px]"
              />
            </div>
            
            <div>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="w-full h-12 bg-[#2D1B69] text-white placeholder:text-gray-200 rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] border-none text-[14px]"
              />
            </div>

            <div className="pt-2 pb-1">
              <p className="text-center text-[11px] text-white/90 leading-tight">
                By Registering, I agree to NG ESPORTS's<br />
                <a href="/terms" className="font-semibold underline">Terms and Conditions</a> and <a href="/terms" className="font-semibold underline">Privacy Policy</a>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.username || !formData.email || !formData.password}
              className="w-full h-12 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl text-base font-bold mt-1 transition-colors disabled:opacity-50 uppercase tracking-widest"
            >
              SIGNUP
            </button>
          </form>

          <div className="mt-4 mb-2">
            <p className="text-center text-xs text-white">
              Already have an account?{' '}
              <Link to="/login" className="font-bold hover:text-brand-purple transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
