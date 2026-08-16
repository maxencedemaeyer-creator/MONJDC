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
  } = useApp();

  const mondayDate = activeWeekDays[0]?.label || '';
  const fridayDate = activeWeekDays[4]?.label || '';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 lg:px-6 py-2.5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Brand & Class Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900">MonJDC</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  FWB / SeGEC
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Journal de Classe & Référentiels Belges
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Active Class Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-lg px-2.5 py-1.5">
            <School className="w-4 h-4 text-slate-500" />
            <select
              value={activeClass?.id || ''}
              onChange={(e) => setActiveClassId(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount} él.)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Week Selector & Week A/B */}
        <div className="flex items-center justify-between md:justify-center gap-2">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={goToPreviousWeek}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-900">{mondayDate.split(' ')[0]}</span> - {fridayDate}
            </button>
            <button
              onClick={goToNextWeek}
              className="p-1.5 hover:bg-white hover:shadow-xs rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week A / Week B Toggle */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveWeekType('A')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeWeekType === 'A'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semaine A
            </button>
            <button
              onClick={() => setActiveWeekType('B')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeWeekType === 'B'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semaine B
            </button>
          </div>
        </div>

        {/* Right: Quick actions, Firebase Flame state, Profile */}
        <div className="flex items-center justify-end gap-2">
          {/* Quick Print Button */}
          <button
            onClick={() => setActiveTab('export')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition"
            title="Exporter pour l'inspection"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export Inspection</span>
          </button>

          {/* Firebase Flame Live Sync Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
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
              <span className="font-semibold text-slate-800 hidden lg:inline">Firestore</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">En direct</span>
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

          {/* Teacher Profile Pill */}
          <div className="flex items-center gap-2 pl-1.5 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
              {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{profile.name}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{profile.schoolYear}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
