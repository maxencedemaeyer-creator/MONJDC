import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  BookMarked,
  Users,
  GraduationCap,
  FileCheck2,
  X,
  User,
  LogIn,
  LogOut,
  Flame,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    referentiels,
    students,
    evaluations,
    jdcEntries,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    currentUser,
    profile,
    logout,
    setIsAuthModalOpen,
  } = useApp();

  const navItems: {
    id: NavigationTab;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: string | number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      description: 'Vue du jour & rappels',
      icon: LayoutDashboard,
    },
    {
      id: 'jdc',
      label: 'Journal de Classe',
      description: 'Planning hebdomadaire',
      icon: CalendarDays,
      badge: jdcEntries.length > 0 ? jdcEntries.length : undefined,
    },
    {
      id: 'schedule-config',
      label: 'Grille Horaire',
      description: 'Périodes & Semaine A/B',
      icon: Clock,
    },
    {
      id: 'referentiels',
      label: 'Référentiels FWB',
      description: 'Savoirs, SF & Compétences',
      icon: BookMarked,
      badge: referentiels.length,
    },
    {
      id: 'students',
      label: 'Élèves & Aménagements',
      description: 'Besoins spé., présences & PAP',
      icon: Users,
      badge: students.length,
    },
    {
      id: 'evaluations',
      label: 'Carnet de Cotes',
      description: 'Évaluations & Bulletins',
      icon: GraduationCap,
      badge: evaluations.length,
    },
    {
      id: 'export',
      label: 'Export Inspection',
      description: 'PDF officiel & Fiches prépa',
      icon: FileCheck2,
    },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-100 flex-col justify-between shrink-0 p-3 min-h-[calc(100vh-57px)]">
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Pédagogique
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-900/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-medium leading-none truncate">{item.label}</div>
                      <div
                        className={`text-[11px] mt-1 truncate ${
                          isActive ? 'text-indigo-200' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-indigo-700 text-indigo-100'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Belgian Education Badge & User footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 px-2 space-y-2.5">
          {/* User auth mini card */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {profile.name ? profile.name[0].toUpperCase() : 'M'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{profile.name || 'Maxence'}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentUser ? currentUser.email : 'Compte enseignant'}
                </p>
              </div>
            </div>
            {currentUser ? (
              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
              >
                Connexion
              </button>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Tronc Commun FWB</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.5 rounded font-mono">
                Pacte
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Conforme aux programmes intégrés SeGEC et référentiels de la Fédération Wallonie-Bruxelles.
            </p>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Drawer / Sliding Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Menu */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 text-slate-100 flex flex-col justify-between p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200 h-full overflow-y-auto">
            <div>
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">MonJDC</h3>
                    <p className="text-[10px] text-slate-400">Fédération Wallonie-Bruxelles</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Navigation
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-900/50'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Drawer Footer with Auth */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                    {profile.name ? profile.name[0].toUpperCase() : 'M'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">{profile.name || 'Maxence'}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {currentUser ? currentUser.email : 'Compte enseignant'}
                    </p>
                  </div>
                </div>

                {currentUser ? (
                  <button
                    onClick={async () => {
                      await logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-1.5 px-2 bg-slate-700/60 hover:bg-rose-900/40 hover:text-rose-200 text-slate-300 text-xs font-medium rounded-lg border border-slate-600/50 transition flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Se déconnecter</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Connexion / Inscription</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mobile Bottom Navigation Bar (Fixed for quick 1-thumb touch navigation on smartphone) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Accueil</span>
        </button>

        <button
          onClick={() => setActiveTab('jdc')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition relative ${
            activeTab === 'jdc'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px]">JDC</span>
          {jdcEntries.length > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-indigo-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === 'students'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Élèves</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluations')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
            activeTab === 'evaluations'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          <span className="text-[10px]">Cotes</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-slate-500 hover:text-slate-800 transition"
        >
          <div className="w-5 h-5 flex flex-col justify-center items-center gap-0.5">
            <span className="w-4 h-0.5 bg-current rounded-full" />
            <span className="w-4 h-0.5 bg-current rounded-full" />
            <span className="w-4 h-0.5 bg-current rounded-full" />
          </div>
          <span className="text-[10px]">Menu</span>
        </button>
      </div>
    </>
  );
};
