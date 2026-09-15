"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Plus, Trash2, CheckCircle2, Circle, Bell, BellOff, X, Edit2, AlertTriangle, BellRing, Check, Timer, TrendingUp, Target, Award, Zap, Flame } from "lucide-react";

type Habit = {
  id: string;
  title: string;
  createdAt: string;
  reminderTimes: string | null;
  logs: { date: string }[];
};

// Paleta dinâmica de gradientes para dar identidade a cada hábito
const COLOR_GRADIENTS = [
  "from-blue-500 to-cyan-400 shadow-blue-500/50",
  "from-purple-500 to-pink-500 shadow-purple-500/50",
  "from-emerald-500 to-teal-400 shadow-emerald-500/50",
  "from-orange-500 to-yellow-400 shadow-orange-500/50",
  "from-indigo-500 to-violet-500 shadow-indigo-500/50"
];

export default function Home() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, habitId: "", title: "" });
  const [editModal, setEditModal] = useState({ isOpen: false, habitId: "" });
  const [editTitle, setEditTitle] = useState("");
  const [editTimeInput, setEditTimeInput] = useState("");
  const [editSelectedTimes, setEditSelectedTimes] = useState<string[]>([]);

  const [nativeNotifGranted, setNativeNotifGranted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifiedToday, setNotifiedToday] = useState<string[]>([]);
  const [snoozedReminders, setSnoozedReminders] = useState<{habitId: string, time: string}[]>([]);
  const [activeNotification, setActiveNotification] = useState<{habitId: string, title: string, time: string, key: string} | null>(null);

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 4000);
  };

  useEffect(() => {
    setMounted(true);
    if ("Notification" in window) setNativeNotifGranted(Notification.permission === "granted");
    
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setIsSubscribed(true);
        });
      });
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchHabits();
  }, [status]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      const permission = await Notification.requestPermission();
      setNativeNotifGranted(permission === "granted");

      if (permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.ready;
          const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
          };

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
          });

          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription)
          });

          setIsSubscribed(true);
          showToast("Notificações em Segundo Plano ativadas!");
        } catch (error) {
          console.error("Erro ao assinar Push:", error);
        }
      }
    }
  };

  const disableNotifications = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint })
          });
          await subscription.unsubscribe();
          setIsSubscribed(false);
          showToast("Notificações desativadas neste aparelho.");
        }
      } catch (error) {
        console.error("Erro ao desativar:", error);
      }
    }
  };

  // --- O NOVO CALCULADOR DE OFENSIVA INFALÍVEL ---
  const calculateRealStreak = (logs: {date: string}[]) => {
    if (!logs || logs.length === 0) return 0;
    
    const normalizedDates = [...new Set(logs.map(l => {
      const d = new Date(l.date);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }))].sort((a,b) => b - a);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    if (normalizedDates[0] !== today && normalizedDates[0] !== yesterday) return 0;

    let streak = 0;
    let current = normalizedDates[0] === today ? today : yesterday;

    for (const time of normalizedDates) {
      if (time === current) {
        streak++;
        current -= 86400000;
      } else {
        break;
      }
    }
    return streak;
  };

  // ==========================================
  // MOTOR DE NOTIFICAÇÕES FRONTEND
  // ==========================================
  useEffect(() => {
    if (habits.length === 0 || status !== "authenticated") return;
    const now = new Date();
    if (now.getSeconds() !== 0) return; 
    
    const currentHourMin = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const todayStr = now.toLocaleDateString('pt-BR');

    habits.forEach(habit => {
      const isCompleted = habit.logs.some(log => {
        const logDate = new Date(log.date);
        return logDate.getDate() === now.getDate() && logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      });
      if (isCompleted) return;

      const times = habit.reminderTimes ? habit.reminderTimes.split(',') : [];
      const snoozed = snoozedReminders.filter(s => s.habitId === habit.id).map(s => s.time);
      const allTimes = [...times, ...snoozed];

      if (allTimes.includes(currentHourMin)) {
        const notifKey = `${habit.id}-${currentHourMin}-${todayStr}`;
        if (!notifiedToday.includes(notifKey)) {
           setActiveNotification({ habitId: habit.id, title: habit.title, time: currentHourMin, key: notifKey });
           setNotifiedToday(prev => [...prev, notifKey]);
           if (nativeNotifGranted) {
             new Notification('⏰ Lembrete de Hábito', { body: `Hora de: ${habit.title}`, icon: 'https://www.svgrepo.com/show/474347/calendar.svg' });
           }
        }
      }
    });
  }, [currentTime, habits, status, snoozedReminders, notifiedToday, nativeNotifGranted]);

  const handleSnooze = (minutes: number) => {
    if (!activeNotification) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozedTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    setSnoozedReminders(prev => [...prev, { habitId: activeNotification.habitId, time: snoozedTime }]);
    setActiveNotification(null);
  };

  const handleNotificationDone = () => {
    if (activeNotification) {
      handleToggle(activeNotification.habitId);
      setActiveNotification(null);
    }
  };

  const fetchHabits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/habits");
      if (response.ok) setHabits(await response.json());
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTime = (e: React.MouseEvent) => {
    e.preventDefault();
    if (timeInput && !selectedTimes.includes(timeInput)) {
      setSelectedTimes([...selectedTimes, timeInput].sort());
      setTimeInput("");
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newHabit, reminderTimes: selectedTimes.length > 0 ? selectedTimes.join(",") : null }),
      });
      if (response.ok) {
        const addedHabit = await response.json();
        setHabits([{ ...addedHabit, logs: [] }, ...habits]);
        setNewHabit("");
        setSelectedTimes([]);
        showToast("Hábito criado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao criar:", error);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/habits/${deleteModal.habitId}`, { method: "DELETE" });
      if (response.ok) {
        setHabits(habits.filter((h) => h.id !== deleteModal.habitId));
        setDeleteModal({ isOpen: false, habitId: "", title: "" });
        showToast("Hábito removido!");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const openEdit = (habit: Habit) => {
    setEditTitle(habit.title);
    setEditSelectedTimes(habit.reminderTimes ? habit.reminderTimes.split(",") : []);
    setEditTimeInput("");
    setEditModal({ isOpen: true, habitId: habit.id });
  };

  const handleEditTimeAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (editTimeInput && !editSelectedTimes.includes(editTimeInput)) {
      setEditSelectedTimes([...editSelectedTimes, editTimeInput].sort());
      setEditTimeInput("");
    }
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      const reminderTimesStr = editSelectedTimes.length > 0 ? editSelectedTimes.join(",") : null;
      const response = await fetch(`/api/habits/${editModal.habitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, reminderTimes: reminderTimesStr }),
      });

      if (response.ok) {
        setHabits(habits.map(h => h.id === editModal.habitId ? { ...h, title: editTitle, reminderTimes: reminderTimesStr } : h));
        setEditModal({ isOpen: false, habitId: "" });
        showToast("Hábito atualizado!");
      }
    } catch (error) {
      console.error("Erro ao editar:", error);
    }
  };

  const handleToggle = async (id: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const today = new Date();
        const isCompleted = habit.logs.some(log => {
          const logDate = new Date(log.date);
          return logDate.getDate() === today.getDate() && logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear();
        });
        
        let newLogs = [];
        if (!isCompleted) {
          newLogs = [{ date: new Date().toISOString() }, ...habit.logs];
        } else {
          newLogs = habit.logs.filter(log => {
              const logDate = new Date(log.date);
              return !(logDate.getDate() === today.getDate() && logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear());
          });
        }
        return { ...habit, logs: newLogs };
      }
      return habit;
    }));
    try {
      await fetch(`/api/habits/${id}/toggle`, { method: "POST" });
    } catch (error) {
      fetchHabits(); 
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (authMode === "register") {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.error || "Erro ao cadastrar.");
        return;
      }
    }
    const res = await signIn("credentials", { redirect: false, email, password });
    if (res?.error) setAuthError("Email ou senha incorretos.");
  };

  const renderHeatmap = (logs: { date: string }[], themeGradient: string) => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.getTime());
    }
    const logDates = logs.map(log => {
      const d = new Date(log.date);
      d.setHours(0,0,0,0);
      return d.getTime();
    });

    return (
      <div className="flex gap-1.5 mt-4 overflow-x-auto pb-2 scrollbar-thin">
        {days.map(dayTime => {
          const isDone = logDates.includes(dayTime);
          return (
            <div 
              key={dayTime} 
              className={`min-w-[14px] h-[14px] rounded-[4px] transition-all duration-300 ${isDone ? `bg-gradient-to-tr ${themeGradient} shadow-md` : 'bg-gray-200 dark:bg-gray-800'}`} 
              title={new Date(dayTime).toLocaleDateString()} 
            />
          );
        })}
      </div>
    );
  };

  if (status === "loading" || !mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">Carregando...</div>;
  }

  // --- TELA DE LOGIN ---
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] bg-gray-50 dark:bg-gray-950 p-4 transition-colors">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20 dark:border-gray-800/50 relative overflow-hidden">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-800/50 text-gray-500 transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2 tracking-tight">Habit Tracker</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8 font-medium">Eleve sua rotina ao próximo nível.</p>
          <div className="flex gap-4 mb-6">
            <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className={`flex-1 py-2 font-bold border-b-2 transition-colors ${authMode === "login" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Entrar</button>
            <button onClick={() => { setAuthMode("register"); setAuthError(""); }} className={`flex-1 py-2 font-bold border-b-2 transition-colors ${authMode === "register" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Cadastrar</button>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "register" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white shadow-sm" placeholder="Seu nome" />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white shadow-sm" placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white shadow-sm" placeholder="••••••••" />
            </div>
            {authError && <p className="text-red-500 text-sm text-center font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{authError}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
              {authMode === "login" ? "Acessar Plataforma" : "Criar Conta Grátis"}
            </button>
          </form>
          <div className="mt-8 mb-6 flex items-center justify-center">
            <div className="border-t border-gray-200 dark:border-gray-800 flex-1"></div>
            <span className="px-4 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Ou entre com</span>
            <div className="border-t border-gray-200 dark:border-gray-800 flex-1"></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => signIn("google")} className="flex-1 flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Google
            </button>
            <button onClick={() => signIn("github")} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 shadow-md transition-colors">
              <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-5 h-5 dark:invert-0 invert" /> GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estatísticas para o Dashboard
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.logs.some(l => {
    const d = new Date(l.date);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  })).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => calculateRealStreak(h.logs))) : 0;

  // --- TELA DO PAINEL PRINCIPAL ---
  return (
    <main className="min-h-screen bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-8 transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Luzes difusas de fundo (Aura) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/20 dark:border-gray-800/50">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
              Olá, {session?.user?.name || session?.user?.email?.split('@')[0]}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400 font-medium capitalize text-sm">
              <span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(currentTime)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700"></span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isSubscribed ? (
              <button onClick={requestNotificationPermission} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors shadow-sm" title="Ativar Notificações">
                <Bell size={20} />
              </button>
            ) : (
              <button onClick={disableNotifications} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors shadow-sm" title="Desativar Notificações">
                <BellOff size={20} />
              </button>
            )}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => signOut()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold transition-colors">
              <LogOut size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* --- DASHBOARD DE ESTATÍSTICAS (COCKPIT) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-5 rounded-3xl shadow-sm border border-white/20 dark:border-gray-800/50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Concluído Hoje</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{completionRate}%</p>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-5 rounded-3xl shadow-sm border border-white/20 dark:border-gray-800/50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Flame size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recorde Máximo</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{bestStreak} {bestStreak === 1 ? 'dia' : 'dias'}</p>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-5 rounded-3xl shadow-sm border border-white/20 dark:border-gray-800/50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hábitos Ativos</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{totalHabits}</p>
            </div>
          </div>
        </div>

        {/* INPUT DE CRIAR */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-sm border border-white/20 dark:border-gray-800/50 mb-10">
          <form onSubmit={handleAddHabit} className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="Ex: Ler 10 páginas 📖" className="flex-1 px-5 py-4 bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all placeholder:text-gray-400 font-medium" />
            <div className="flex gap-2">
              <div className="relative flex items-center bg-gray-50/50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl px-4">
                <Bell size={18} className="text-gray-400 mr-2" />
                <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 py-4 cursor-pointer font-medium" />
                <button onClick={handleAddTime} type="button" className="ml-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors">Add</button>
              </div>
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 active:scale-95">
                <Plus size={20} strokeWidth={3} />
                <span className="hidden sm:inline">Criar</span>
              </button>
            </div>
          </form>
          {selectedTimes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center mr-2 font-medium">Notificar às:</span>
              {selectedTimes.map(time => (
                <div key={time} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-200 dark:border-blue-800/50 shadow-sm">
                  <span>{time}</span>
                  <button type="button" onClick={() => setSelectedTimes(selectedTimes.filter(t => t !== time))} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LISTA DE HÁBITOS (GAMIFICADA) */}
        <div className="space-y-5">
          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-5">
              {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>)}
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm py-20 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-12"><Target size={40} /></div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Jornada Vazia</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Crie seu primeiro hábito e comece a ganhar níveis.</p>
            </div>
          ) : (
            habits.map((habit) => {
              const today = new Date();
              const isCompleted = habit.logs.some(log => {
                const logDate = new Date(log.date);
                return logDate.getDate() === today.getDate() && logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear();
              });

              // Usa a nossa função infalível para calcular a ofensiva
              const realStreak = calculateRealStreak(habit.logs);
              
              // Gera uma cor fixa baseada no ID do Hábito
              const habitGradient = COLOR_GRADIENTS[habit.id.charCodeAt(habit.id.length - 1) % COLOR_GRADIENTS.length];

              // --- LOGICA DE GAMIFICAÇÃO (NÍVEIS) ---
              let cardStyle = "border-white/20 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600";
              let badgeStyle = "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
              let badgeIcon = "⚪";

              if (realStreak >= 30) {
                cardStyle = "border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]";
                badgeStyle = "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400";
                badgeIcon = "🔮";
              } else if (realStreak >= 7) {
                cardStyle = "border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.15)]";
                badgeStyle = "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400";
                badgeIcon = "🏆";
              } else if (realStreak > 0) {
                cardStyle = isCompleted ? "border-green-400/40 shadow-sm" : cardStyle;
                badgeStyle = "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400";
                badgeIcon = "🔥";
              }

              return (
                <div key={habit.id} className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col group ${cardStyle}`}>
                  <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleToggle(habit.id)}>
                        <button className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${isCompleted ? `bg-gradient-to-tr ${habitGradient} text-white shadow-lg scale-110` : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                          {isCompleted ? <Check size={20} strokeWidth={3} /> : <Circle size={20} strokeWidth={2} />}
                        </button>
                        <span className={`text-xl font-bold transition-all duration-300 ${isCompleted ? "text-gray-400 dark:text-gray-500 line-through decoration-2" : "text-gray-800 dark:text-gray-100"}`}>{habit.title}</span>
                      </div>
                      
                      {habit.reminderTimes && (
                        <div className="flex items-center gap-2 mt-3 ml-14">
                          <Bell size={14} className="text-gray-400" />
                          <div className="flex gap-1.5 flex-wrap">
                            {habit.reminderTimes.split(",").map(time => (
                              <span key={time} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md font-bold border border-gray-200 dark:border-gray-700 shadow-sm">{time}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Badge Gamificada */}
                      <div className={`flex items-center gap-2 font-black px-4 py-2 rounded-xl text-sm mr-2 shadow-sm ${badgeStyle}`}>
                        <span className="text-base">{badgeIcon}</span>
                        <span>{realStreak} {realStreak === 1 ? 'dia' : 'dias'}</span>
                      </div>
                      
                      <button onClick={() => openEdit(habit)} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-md"><Edit2 size={18} /></button>
                      <button onClick={() => setDeleteModal({ isOpen: true, habitId: habit.id, title: habit.title })} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all bg-red-50 dark:bg-red-900/10 rounded-xl hover:shadow-md"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800/80">
                    {renderHeatmap(habit.logs, habitGradient)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- MODAL DO ALARME / NOTIFICAÇÃO (DESPERTADOR FRONTEND) --- */}
      {activeNotification && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-24 p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_0_50px_rgba(59,130,246,0.4)] border border-blue-500/30 p-8 max-w-sm w-full animate-in slide-in-from-top-10">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto mb-6 animate-bounce shadow-lg shadow-blue-500/20">
              <BellRing size={48} />
            </div>
            <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2 tracking-tight">Alarme!</h2>
            <p className="text-xl text-center font-bold text-blue-600 dark:text-blue-400 mb-8">{activeNotification.title}</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleNotificationDone} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 active:scale-95">
                <Check size={24} strokeWidth={3} /> Concluir Agora
              </button>
              <div className="flex gap-3 mt-2">
                <button onClick={() => handleSnooze(5)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Timer size={18} /> Adiar 5m
                </button>
                <button onClick={() => handleSnooze(15)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Timer size={18} /> Adiar 15m
                </button>
              </div>
              <button onClick={() => setActiveNotification(null)} className="mt-4 text-sm font-semibold text-center w-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Ignorar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO --- */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3"><Edit2 size={24} className="text-blue-500" /> Editar Hábito</h3>
              <button onClick={() => setEditModal({ isOpen: false, habitId: "" })} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><X size={20} strokeWidth={3} /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nome do Hábito</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Horários de Alerta</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl px-4">
                    <Bell size={18} className="text-gray-400 mr-2" />
                    <input type="time" value={editTimeInput} onChange={(e) => setEditTimeInput(e.target.value)} className="bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 py-4 w-full cursor-pointer font-medium" />
                  </div>
                  <button type="button" onClick={handleEditTimeAdd} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 rounded-2xl font-bold transition-colors">Add</button>
                </div>
              </div>
              {editSelectedTimes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {editSelectedTimes.map(time => (
                    <div key={time} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-200 dark:border-blue-800/50 shadow-sm">
                      <span>{time}</span>
                      <button type="button" onClick={() => setEditSelectedTimes(editSelectedTimes.filter(t => t !== time))} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setEditModal({ isOpen: false, habitId: "" })} className="flex-1 py-4 rounded-2xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button onClick={saveEdit} className="flex-1 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE EXCLUSÃO --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-6 mx-auto"><AlertTriangle size={32} /></div>
            <h3 className="text-2xl font-extrabold text-center text-gray-900 dark:text-white mb-2">Excluir Hábito?</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 font-medium">Você está prestes a excluir "<strong>{deleteModal.title}</strong>". Todo o progresso será perdido para sempre.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, habitId: "", title: "" })} className="flex-1 py-4 rounded-2xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOAST FLUTUANTE --- */}
      <div className={`fixed bottom-6 right-6 z-[70] transition-all duration-500 transform ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}>
        <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3">
          <div className="bg-green-500 text-white rounded-full p-1"><Check size={16} strokeWidth={3} /></div>
          {toast.message}
        </div>
      </div>

    </main>
  );
}