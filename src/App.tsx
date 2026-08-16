import React, { useState } from 'react';
import { Flame, Info, AlertTriangle, X, Loader2, BookOpen } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { JdcWeeklyView } from './components/jdc/JdcWeeklyView';
import { TimetableConfigView } from './components/timetable/TimetableConfigView';
import { ReferentielsView } from './components/referentiels/ReferentielsView';
import { ClassesView } from './components/classes/ClassesView';
import { EvaluationsView } from './components/evaluations/EvaluationsView';
import { ExportInspectionView } from './components/export/ExportInspectionView';
import { LessonModal } from './components/jdc/LessonModal';
import { AuthModal } from './components/auth/AuthModal';
import { JdcEntry } from './types';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-2 ${
            t.type === 'success'
              ? 'bg-white/95 border-emerald-200 text-slate-800'
              : t.type === 'error'
              ? 'bg-rose-50/95 border-rose-200 text-rose-950'
              : 'bg-indigo-50/95 border-indigo-200 text-indigo-950'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {t.type === 'success' ? (
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 fill-emerald-500" />
              </div>
            ) : t.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <Info className="w-5 h-5 text-indigo-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              {t.message}
            </p>
            {t.docId && (
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                Doc ID: {t.docId}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
            aria-label="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isAuthLoading,
  } = useApp();
  const [selectedLessonForModal, setSelectedLessonForModal] = useState<JdcEntry | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  const handleOpenNewLesson = () => {
    setSelectedLessonForModal(null);
    setIsLessonModalOpen(true);
  };

  const handleOpenExistingLesson = (entry: JdcEntry) => {
    setSelectedLessonForModal(entry);
    setIsLessonModalOpen(true);
  };

  const handleOpenPrintSheet = (entry: JdcEntry) => {
    setSelectedLessonForModal(entry);
    setActiveTab('export');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white">
              MonJDC • Journal de Classe
            </h1>
            <p className="text-xs text-slate-400">
              Tronc Commun FWB • Synchronisation Firebase
            </p>
          </div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mt-4">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Vérification de la session en cours...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation with Flame & Live Connection Indicator */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Navigation Sidebar & Mobile Drawer/Bar */}
        <Sidebar />

        {/* Dynamic Content View with bottom padding for mobile bar */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 pb-24 lg:pb-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenLessonModal={handleOpenNewLesson}
              onOpenLesson={handleOpenExistingLesson}
            />
          )}

          {activeTab === 'jdc' && (
            <JdcWeeklyView onOpenPrintSheet={handleOpenPrintSheet} />
          )}

          {activeTab === 'schedule-config' && <TimetableConfigView />}

          {activeTab === 'referentiels' && <ReferentielsView />}

          {(activeTab === 'classes' || activeTab === 'students') && <ClassesView />}

          {activeTab === 'evaluations' && <EvaluationsView />}

          {activeTab === 'export' && <ExportInspectionView />}
        </main>
      </div>

      {/* Global Lesson Edit/Create Modal */}
      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        entry={selectedLessonForModal}
        onPrintLesson={handleOpenPrintSheet}
      />

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Real-time Firestore Toast Feed */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
