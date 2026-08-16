import React from 'react';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Flame,
  Loader2,
  School,
  RotateCcw,
  Menu,
  User,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    activeClass,
    classes,
    setActiveClassId,
    activeWeekDays,
    activeWeekType,
    setActiveWeekType,
    goToNextWeek,
    goToPreviousWeek,
    goToCurrentWeek,
    profile,
    setActiveTab,
    isFirebaseCloud,
    isSyncing,
    resetAllToInitial,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    currentUser,
    setIsAuthModalOpen,
  } = useApp();

  const mondayDate = activeWeekDays[0]?.label || '';
  const fridayDate = activeWeekDays[4]?.label || '';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 lg:px-6 py-2 shadow-xs">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
            aria-label="Ouvrir le menu"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">MonJDC</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 hidden sm:inline-block">
                  FWB / SeGEC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Journal de Classe & Référentiels
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Active Class Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5">
            <School className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={activeClass?.id || ''}
              onChange={(e) => setActiveClassId(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden cursor-pointer max-w-[110px] sm:max-w-[160px] truncate"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Week Selector (Visible on tablet & desktop) */}
        <div className="hidden md:flex items-center justify-center gap-2">
          <div className="flex items-center bg-slate-100/80 p-0.5 sm:p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={goToPreviousWeek}
              className="p-1 hover:bg-white hover:shadow-xs rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-900">{mondayDate.split(' ')[0]}</span> - {fridayDate}
            </button>
            <button
              onClick={goToNextWeek}
              className="p-1 hover:bg-white hover:shadow-xs rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week A / Week B Toggle */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveWeekType('A')}
              className={`px-2 py-1 rounded-md transition text-xs ${
                activeWeekType === 'A'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem. A
            </button>
            <button
              onClick={() => setActiveWeekType('B')}
              className={`px-2 py-1 rounded-md transition text-xs ${
                activeWeekType === 'B'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sem. B
            </button>
          </div>
        </div>

        {/* Right: Cloud status & Profile / Auth */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          {/* Quick Print Button (hidden on small mobile) */}
          <button
            onClick={() => setActiveTab('export')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition"
            title="Exporter pour l'inspection"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">Export Inspection</span>
          </button>

          {/* Firebase Flame Live Sync Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              isFirebaseCloud
                ? 'bg-amber-50/80 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Synchronisation Firestore active (temps réel onSnapshot)"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
            )}
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-800 hidden sm:inline">Firestore</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-medium">En direct</span>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (confirm('Voulez-vous réinitialiser les données de démonstration dans Firestore avec le programme belge FWB ?')) {
                resetAllToInitial();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Réinitialiser Firestore avec les exemples FWB"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Teacher Profile / Auth Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition cursor-pointer text-left group"
            title={currentUser ? `Compte connecté: ${currentUser.email}` : 'Connexion / Inscription Firebase'}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs relative">
              {profile.name ? profile.name[0].toUpperCase() : 'M'}
              {currentUser && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition leading-tight">
                  {profile.name || 'Maxence'}
                </p>
                {currentUser && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[100px]">
                {currentUser ? 'Enseignant' : 'Connexion'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
