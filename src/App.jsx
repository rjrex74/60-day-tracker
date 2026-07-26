import React, { useState, useEffect } from 'react';
import { 
  Home, CheckSquare, Dumbbell, Utensils, ChevronLeft, ChevronRight, 
  Droplet, Moon, Activity, User, Flame, CheckCircle2, Circle, 
  Sun, Settings, Cloud, Loader2, LogOut, Lock, Mail
} from 'lucide-react';

import { auth, db, appId } from './firebase';
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const TOTAL_DAYS = 60;

const HABITS = [
  { id: 'wakeup', label: 'Wake up at 6:00 AM', icon: Sun },
  { id: 'water', label: 'Drink 3.5L Water', icon: Droplet },
  { id: 'protein', label: 'Hit 160g Protein Goal', icon: Flame },
  { id: 'workout', label: 'Complete Gym Workout', icon: Dumbbell },
  { id: 'steps', label: 'Morning Walk / 10k Steps', icon: Activity },
  { id: 'posture', label: 'Posture Routine (APT)', icon: User },
  { id: 'grooming', label: 'Hair & Beard Care Routine', icon: User },
  { id: 'sleep', label: 'Sleep by 10:30 PM', icon: Moon },
];

const WORKOUT_PLAN = [
  { day: 'Monday', focus: 'Chest & Triceps', exercises: ['Incline DB Press (4x8-10)', 'Flat Barbell Bench (3x8-12)', 'Cable Crossovers (3x12-15)', 'Tricep Pushdowns (3x10-15)'] },
  { day: 'Tuesday', focus: 'Back & Biceps', exercises: ['Pull-ups/Lat Pulldown (4x8-12)', 'Barbell Rows (4x8-10)', 'Face Pulls - Posture (3x15)', 'DB Hammer Curls (3x10-12)'] },
  { day: 'Wednesday', focus: 'Legs & Core', exercises: ['Squats (4x8-10)', 'Leg Press (3x10-12)', 'Romanian Deadlifts (3x10-12)', 'Calf Raises (4x15)', 'Dead Bugs (3x12/side)'] },
  { day: 'Thursday', focus: 'Shoulders', exercises: ['Overhead DB Press (4x8-10)', 'Lateral Raises (4x15)', 'Front Raises (3x12)', 'Shrugs (3x15)'] },
  { day: 'Friday', focus: 'Full Body', exercises: ['Glute Bridges (3x15)', 'Pull-ups (3xMax)', 'Push-ups (3xMax)', 'Walking Lunges (3x12/leg)'] },
  { day: 'Saturday', focus: 'Active Recovery', exercises: ['45 Min Brisk Walk', '15 Min Posture Routine'] },
  { day: 'Sunday', focus: 'Rest', exercises: ['Full Rest', 'Meal Prep for the Week'] },
];

const MEAL_PLAN = [
  { meal: 'Breakfast (7:15 AM)', food: '3 Eggs + 2 Whites, 50g Oats, Banana' },
  { meal: 'Morning Snack (10:30 AM)', food: 'Apple + 10 Almonds' },
  { meal: 'Lunch (1:30 PM)', food: '2 Chapatis, 150g Chicken/Paneer, Salad' },
  { meal: 'Pre-Workout (4:30 PM)', food: 'Black Coffee + Fruit/Dates' },
  { meal: 'Dinner (7:30 PM)', food: '150g Chicken/Fish/Soy + Vegetables + 1 Chapati' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('daily');
  const [currentDay, setCurrentDay] = useState(1);
  const [weight, setWeight] = useState(80);
  const [logs, setLogs] = useState({});

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [savingStatus, setSavingStatus] = useState('Synced');
  
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const docRef = doc(db, 'users', user.uid, 'app_data', 'tracker');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logs) setLogs(data.logs);
        if (data.weight) setWeight(data.weight);
        if (data.currentDay) setCurrentDay(data.currentDay);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const saveToCloud = async (newData) => {
    if (!user || !db) return;
    setSavingStatus('Saving...');
    const docRef = doc(db, 'users', user.uid, 'app_data', 'tracker');
    try {
      await setDoc(docRef, newData, { merge: true });
      setSavingStatus('Synced');
    } catch (error) {
      setSavingStatus('Error Saving');
    }
  };

  const handleUpdateDay = (newDay) => {
    if (newDay < 1 || newDay > TOTAL_DAYS) return;
    setCurrentDay(newDay);
    saveToCloud({ currentDay: newDay });
  };

  const handleUpdateWeight = (newWeight) => {
    setWeight(newWeight);
    saveToCloud({ weight: newWeight });
  };

  const toggleHabit = (day, habitId) => {
    const dayLog = logs[day] || {};
    const newLogs = { ...logs, [day]: { ...dayLog, [habitId]: !dayLog[habitId] } };
    setLogs(newLogs); 
    saveToCloud({ logs: newLogs }); 
  };

  const calculateProgress = () => {
    let completed = 0;
    Object.values(logs).forEach(day => Object.values(day).forEach(c => c && completed++));
    return Math.round((completed / (TOTAL_DAYS * HABITS.length)) * 100) || 0;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      else await signInWithEmailAndPassword(auth, authEmail, authPassword);
    } catch (error) {
      setAuthError(error.message.replace('Firebase: ', ''));
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setLogs({});
    setCurrentDay(1);
    setWeight(80);
  };

  if (loadingAuth) {
    return (
      <div className="max-w-md mx-auto bg-slate-50 min-h-screen flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
        <p className="font-medium animate-pulse">Loading Application...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-slate-50 min-h-screen flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Dumbbell size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dr Fitness App</h1>
            <p className="text-sm text-slate-500 mt-2">Log in to sync your progress</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={18} className="text-slate-400" /></div>
                <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="you@email.com"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-slate-400" /></div>
                <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="••••••••"/>
              </div>
            </div>
            {authError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs text-center border border-red-100">{authError}</div>}
            <button type="submit" className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 active:scale-95 transition-all shadow-md">
              {isSignUp ? 'Create Account' : 'Log In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20"><Cloud size={80} /></div>
        <h2 className="text-xl font-bold mb-1 relative z-10">Your Progress</h2>
        <p className="text-blue-200 text-sm mb-4 relative z-10">Consistency is greater than intensity.</p>
        <div className="relative pt-1 z-10">
          <div className="flex mb-2 items-center justify-between">
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-900">Overall Completion</span>
            <span className="text-xs font-semibold inline-block text-blue-100">{calculateProgress()}%</span>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-800">
            <div style={{ width: `${calculateProgress()}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-400 transition-all duration-500"></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Weight</p>
          <div className="flex items-end justify-center gap-1">
            <span className="text-3xl font-black text-slate-800">{weight}</span><span className="text-slate-500 font-medium mb-1">kg</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Day</p>
          <div className="flex items-end justify-center gap-1">
            <span className="text-3xl font-black text-slate-800">{currentDay}</span><span className="text-slate-500 font-medium mb-1">/ 60</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDailyTracker = () => {
    const todayLog = logs[currentDay] || {};
    const progressToday = Math.round((HABITS.filter(h => todayLog[h.id]).length / HABITS.length) * 100) || 0;

    return (
      <div className="flex flex-col h-full animate-in fade-in duration-200">
        <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => handleUpdateDay(currentDay - 1)} className={`p-2 rounded-full ${currentDay === 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronLeft size={24} /></button>
          <div className="text-center">
            <h2 className="text-lg font-black text-slate-800">Day {currentDay}</h2>
            <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">{savingStatus}</p>
          </div>
          <button onClick={() => handleUpdateDay(currentDay + 1)} className={`p-2 rounded-full ${currentDay === TOTAL_DAYS ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}><ChevronRight size={24} /></button>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Daily Progress</span><span className={progressToday === 100 ? "text-green-600" : ""}>{progressToday}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-300 ${progressToday === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progressToday}%` }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
          {HABITS.map((habit) => {
            const isCompleted = !!todayLog[habit.id];
            const Icon = habit.icon;
            return (
              <button key={habit.id} onClick={() => toggleHabit(currentDay, habit.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left active:scale-[0.98] ${isCompleted ? 'border-green-500 bg-green-50/30' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                <div className={`shrink-0 ${isCompleted ? 'text-green-500' : 'text-slate-400'}`}>
                  {isCompleted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                </div>
                <div className="flex-1"><p className={`font-semibold ${isCompleted ? 'text-slate-800 line-through decoration-green-500/30' : 'text-slate-700'}`}>{habit.label}</p></div>
                <div className={`p-2 rounded-lg shrink-0 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}><Icon size={18} /></div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWorkout = () => (
    <div className="p-4 pb-24 space-y-4 animate-in slide-in-from-right-4 duration-200">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-xl font-bold text-slate-800">Training Program</h2>
        <p className="text-sm text-slate-500 mt-1">Focus on progressive overload.</p>
      </div>
      {WORKOUT_PLAN.map((workout, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-800 p-3 flex justify-between items-center">
            <span className="font-bold text-white text-sm">{workout.day}</span>
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-700 text-blue-300 rounded uppercase tracking-wider">{workout.focus}</span>
          </div>
          <div className="p-0 divide-y divide-slate-100">
            {workout.exercises.map((ex, i) => (
              <div key={i} className="p-3 text-sm text-slate-700 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>{ex}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDiet = () => (
    <div className="p-4 pb-24 space-y-4 animate-in slide-in-from-right-4 duration-200">
      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-6 flex gap-4 items-center">
        <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 shrink-0"><Flame size={24} /></div>
        <div>
          <h2 className="font-bold text-slate-800">Nutrition Targets</h2>
          <p className="text-sm text-slate-600">1,900 kcal • 160g Protein</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {MEAL_PLAN.map((meal, idx) => (
          <div key={idx} className="p-4 border-b border-slate-50 last:border-0">
            <p className="text-xs font-bold text-blue-600 mb-1">{meal.meal}</p>
            <p className="text-sm font-medium text-slate-800 leading-snug">{meal.food}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right-4 duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><User size={32} /></div>
        <h2 className="text-xl font-bold text-slate-800 truncate px-2">{user.email}</h2>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Weight (kg)</label>
          <input type="number" value={weight} onChange={(e) => handleUpdateWeight(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Tracking Day</label>
          <input type="number" min="1" max="60" value={currentDay} onChange={(e) => handleUpdateDay(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"/>
        </div>
      </div>
      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-red-100 hover:bg-red-100 active:scale-95 transition-all">
        <LogOut size={20} /> Log Out
      </button>
    </div>
  );

  const NavButton = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)} className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${activeTab === id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
      <div className={`p-1.5 rounded-lg mb-1 transition-all ${activeTab === id ? 'bg-blue-100' : 'bg-transparent'}`}><Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} /></div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen shadow-2xl overflow-hidden flex flex-col relative font-sans text-slate-900">
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'daily' && renderDailyTracker()}
        {activeTab === 'workout' && renderWorkout()}
        {activeTab === 'diet' && renderDiet()}
        {activeTab === 'profile' && renderProfile()}
      </main>
      <nav className="bg-white border-t border-slate-200 flex justify-between pb-safe absolute bottom-0 w-full z-50 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavButton id="dashboard" label="Stats" icon={Home} />
        <NavButton id="daily" label="Tracker" icon={CheckSquare} />
        <NavButton id="workout" label="Workout" icon={Dumbbell} />
        <NavButton id="diet" label="Diet" icon={Utensils} />
        <NavButton id="profile" label="Profile" icon={Settings} />
      </nav>
    </div>
  );
        }
              
