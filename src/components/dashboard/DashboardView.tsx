import React from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Bell,
  Sun,
  School,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateFrench, getDomainColor, getCategoryBadge } from '../../lib/utils';
import { JdcEntry, Student } from '../../types';

interface DashboardViewProps {
  onOpenLessonModal: () => void;
  onOpenLesson: (entry: JdcEntry) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenLessonModal, onOpenLesson }) => {
  const {
    profile,
    activeClass,
    classes,
    students,
    jdcEntries,
    evaluations,
    referentiels,
    dailyNotes,
    addDailyNote,
    deleteDailyNote,
    setStudentAttendance,
    setActiveTab,
    timeSlots,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLessons = jdcEntries.filter(
    (e) => (!activeClass || e.classId === activeClass.id)
  );

  // Calculate statistics
  const totalStudents = students.filter((s) => !activeClass || s.classId === activeClass.id);
  const studentsWithNeeds = totalStudents.filter((s) => s.specialNeeds && s.specialNeeds.length > 0);
  const completedLessons = todayLessons.filter((l) => l.status === 'completed');
  const distinctCompetenciesCovered = new Set(
    jdcEntries.flatMap((e) => e.linkedReferentielIds || [])
  ).size;

  const [newNoteTitle, setNewNoteTitle] = React.useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    addDailyNote({
      date: todayStr,
      title: newNoteTitle,
      content: '',
      isImportant: false,
      category: 'remarque',
    });
    setNewNoteTitle('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome & System Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
              <School className="w-3.5 h-3.5" />
              <span>{profile.schoolName}</span>
              <span className="text-white/40">•</span>
              <span>Année {profile.schoolYear}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bonjour, {profile.name} 👋
            </h1>
            <p className="text-sm text-indigo-100/80 leading-relaxed">
              Votre classe active est <strong className="text-white font-semibold">{activeClass?.name}</strong> ({activeClass?.cycle}). Tout est synchronisé avec les référentiels du Tronc Commun FWB.
            </p>
          </div>

          {/* Right Action Box */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('jdc')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-md transition"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Ouvrir le Journal de Classe</span>
            </button>
            <button
              onClick={onOpenLessonModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/40 font-semibold text-xs rounded-xl shadow-md transition backdrop-blur-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle fiche de cours</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{todayLessons.length}</div>
            <div className="text-xs font-medium text-slate-500">Leçons préparées</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{distinctCompetenciesCovered}</div>
            <div className="text-xs font-medium text-slate-500">Compétences FWB ciblées</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalStudents.length}</div>
            <div className="text-xs font-medium text-slate-500">Élèves inscrits</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{studentsWithNeeds.length}</div>
            <div className="text-xs font-medium text-slate-500">Aménagements (PAP / DYS)</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Lessons of the day & Right Sidebar Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Planning & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Programme des séances récentes ({activeClass?.name})
                </h3>
                <p className="text-xs text-slate-500">
                  Consultez les objectifs et ouvrez directement vos fiches de préparation
                </p>
              </div>

              <button
                onClick={() => setActiveTab('jdc')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Voir toute la semaine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of lessons */}
            <div className="space-y-3">
              {todayLessons.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                  <p className="text-sm font-semibold text-slate-700">Aucune leçon enregistrée</p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    Générez automatiquement votre semaine depuis votre grille horaire.
                  </p>
                  <button
                    onClick={() => setActiveTab('jdc')}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
                  >
                    Aller au Journal de Classe
                  </button>
                </div>
              ) : (
                todayLessons.slice(0, 5).map((lesson) => {
                  const domColor = getDomainColor(lesson.domain);
                  const attachedCodes = referentiels.filter((r) =>
                    lesson.linkedReferentielIds?.includes(r.id)
                  );

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => onOpenLesson(lesson)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer hover:shadow-xs flex items-start justify-between gap-4 ${domColor.bg} border-l-4 ${domColor.border}`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-2xs">
                            P{lesson.periodNumber}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${domColor.badgeBg}`}>
                            {lesson.subjectTitle || lesson.domain}
                          </span>
                          <span className="text-[11px] text-slate-500">{lesson.date}</span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {lesson.lessonTitle}
                        </h4>

                        {lesson.objectives && (
                          <p className="text-xs text-slate-600 line-clamp-1">
                            🎯 {lesson.objectives}
                          </p>
                        )}

                        {attachedCodes.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {attachedCodes.map((code) => {
                              const cat = getCategoryBadge(code.category);
                              return (
                                <span
                                  key={code.id}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${cat.bg} ${cat.text}`}
                                >
                                  {code.code}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            lesson.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lesson.status === 'completed' ? 'Réalisé' : 'Planifié'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Attendance Check */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Appel rapide des présences ({activeClass?.name})
                </h3>
                <p className="text-xs text-slate-500">
                  Cliquez sur un élève pour basculer son statut (Présent / Absent / Retard)
                </p>
              </div>

              <button
                onClick={() => setActiveTab('students')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Fiches élèves complètes →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {totalStudents.map((stud) => {
                const isPresent = stud.currentAttendance === 'present' || !stud.currentAttendance;
                const isAbsent = stud.currentAttendance === 'absent';
                const isLate = stud.currentAttendance === 'late';

                return (
                  <div
                    key={stud.id}
                    onClick={() => {
                      const next = isPresent ? 'absent' : isAbsent ? 'late' : 'present';
                      setStudentAttendance(stud.id, next);
                    }}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer select-none transition ${
                      isPresent
                        ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        : isAbsent
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <span className="truncate">{stud.firstName} {stud.lastName[0]}.</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isPresent
                          ? 'bg-emerald-500'
                          : isAbsent
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Notes, Inspection Check & Special Needs */}
        <div className="space-y-6">
          {/* Inspection & Conformity Checklist */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/60 rounded-2xl border border-indigo-100 p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold">Conformité Inspection FWB</h3>
            </div>
            <p className="text-xs text-indigo-800/80 leading-relaxed">
              Critères officiels vérifiés pour le contrôle pédagogique :
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 bg-white/80 p-2 rounded-lg border border-indigo-100">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Codes Tronc Commun rattachés</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white/80 p-2 rounded-lg border border-indigo-100">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Phases de leçon & objectifs clairs</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white/80 p-2 rounded-lg border border-indigo-100">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Traces de différenciation / PAP</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('export')}
              className="w-full mt-2 py-2 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center shadow-xs transition"
            >
              Générer le PDF officiel d'inspection
            </button>
          </div>

          {/* Daily Pedagogical Notes & Reminders */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Mémo & Rappels du jour
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">{dailyNotes.length} notes</span>
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Ajouter un mémo rapide..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                +
              </button>
            </form>

            <div className="space-y-2">
              {dailyNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{note.title}</div>
                    {note.content && <div className="text-slate-500 mt-0.5">{note.content}</div>}
                  </div>
                  <button
                    onClick={() => deleteDailyNote(note.id)}
                    className="text-slate-400 hover:text-rose-600 text-xs p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Special Needs Quick Focus (Aménagements) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Élèves à besoins spécifiques ({studentsWithNeeds.length})
              </h3>
              <button
                onClick={() => setActiveTab('students')}
                className="text-xs text-indigo-600 font-semibold"
              >
                Détails
              </button>
            </div>

            <div className="space-y-2">
              {studentsWithNeeds.slice(0, 4).map((stud) => (
                <div
                  key={stud.id}
                  className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1"
                >
                  <div className="font-bold text-slate-900">
                    {stud.firstName} {stud.lastName}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stud.specialNeeds.map((need, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-1.5 py-0.2 bg-white text-amber-800 rounded border border-amber-200"
                      >
                        {need}
                      </span>
                    ))}
                  </div>
                  {stud.specialNeedsNotes && (
                    <p className="text-[11px] text-slate-600 italic line-clamp-1">
                      {stud.specialNeedsNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
