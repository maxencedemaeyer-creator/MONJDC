import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  BookMarked,
  Users,
  GraduationCap,
  FileCheck2,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, referentiels, students, evaluations, jdcEntries } = useApp();

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

  return (
    <aside className="w-full lg:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0 p-3 lg:min-h-[calc(100vh-57px)]">
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
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
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

      {/* Belgian Education Badge Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 px-2 space-y-2">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
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
  );
};
