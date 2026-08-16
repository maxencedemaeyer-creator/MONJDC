import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  Copy,
  ArrowRight,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  BookOpen,
  Coffee,
  Sun,
  School,
  FileCheck2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JdcEntry, DayOfWeek } from '../../types';
import { LessonModal } from './LessonModal';
import { getDomainColor, getCategoryBadge, formatDateFrench } from '../../lib/utils';

interface JdcWeeklyViewProps {
  onOpenPrintSheet?: (entry: JdcEntry) => void;
}

export const JdcWeeklyView: React.FC<JdcWeeklyViewProps> = ({ onOpenPrintSheet }) => {
  const {
    activeClassId,
    activeClass,
    classes,
    setActiveClassId,
    activeWeekDays,
    activeWeekType,
    setActiveWeekType,
    goToNextWeek,
    goToPreviousWeek,
    goToCurrentWeek,
    timeSlots,
    jdcEntries,
    referentiels,
    populateWeekFromSchedule,
    updateJdcEntry,
    deleteJdcEntry,
    duplicateJdcEntry,
  } = useApp();

  const [selectedEntry, setSelectedEntry] = useState<JdcEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string>('');
  const [modalInitialPeriod, setModalInitialPeriod] = useState<number>(1);
  const [modalInitialDayOfWeek, setModalInitialDayOfWeek] = useState<DayOfWeek>(1);
  const [actionMenuEntryId, setActionMenuEntryId] = useState<string | null>(null);

  const periodsOnly = timeSlots.filter((s) => !s.isBreak && s.periodNumber > 0);

  const handleOpenNewLesson = (dateStr: string, periodNumber: number, dayOfWeek: DayOfWeek) => {
    setSelectedEntry(null);
    setModalInitialDate(dateStr);
    setModalInitialPeriod(periodNumber);
    setModalInitialDayOfWeek(dayOfWeek);
    setIsModalOpen(true);
  };

  const handleOpenEditLesson = (entry: JdcEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleQuickStatusToggle = (e: React.MouseEvent, entry: JdcEntry) => {
    e.stopPropagation();
    const nextStatus: JdcEntry['status'] =
      entry.status === 'completed'
        ? 'planned'
        : entry.status === 'planned'
        ? 'completed'
        : 'planned';
    updateJdcEntry(entry.id, { status: nextStatus });
  };

  return (
    <div className="space-y-4">
      {/* Action Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Journal de Classe Hebdomadaire</h1>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeClass?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Planning pédagogique de la semaine du {activeWeekDays[0]?.label} au {activeWeekDays[4]?.label} (Semaine {activeWeekType})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick populate button */}
          <button
            onClick={populateWeekFromSchedule}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition shadow-2xs"
            title="Générer les cours à partir de votre grille horaire type"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Remplir depuis la grille</span>
          </button>

          {/* Add lesson button */}
          <button
            onClick={() =>
              handleOpenNewLesson(activeWeekDays[0]?.dateStr || '', 1, 1)
            }
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une leçon</span>
          </button>
        </div>
      </div>

      {/* Grid: 5 Days (Lundi - Vendredi) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="min-w-[980px]">
          {/* Header Row: Days */}
          <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-700">
            <div className="p-3 text-center border-r border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
              Horaire
            </div>
            {activeWeekDays.map((day) => (
              <div
                key={day.dayOfWeek}
                className="p-3 text-center border-r border-slate-200 last:border-r-0"
              >
                <div className="font-bold text-slate-900 text-sm">{day.label.split(' ')[0]}</div>
                <div className="text-[11px] font-normal text-slate-500">{day.label.split(' ')[1]}</div>
              </div>
            ))}
          </div>

          {/* Rows: Periods */}
          <div className="divide-y divide-slate-100">
            {periodsOnly.map((slot) => {
              // Check if a break follows this period
              const isMorningBreakAfter = slot.periodNumber === 2;
              const isLunchBreakAfter = slot.periodNumber === 4;
              const isAfternoonBreakAfter = slot.periodNumber === 6;

              return (
                <React.Fragment key={`slot-row-${slot.periodNumber}`}>
                  <div className="grid grid-cols-6 min-h-[110px]">
                    {/* Period Time Column */}
                    <div className="p-3 border-r border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shadow-2xs mb-1">
                        P{slot.periodNumber}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600">{slot.startTime}</span>
                      <span className="text-[10px] text-slate-400">{slot.endTime}</span>
                    </div>

                    {/* 5 Day Cells */}
                    {activeWeekDays.map((day) => {
                      // Find entry for this day and period
                      const entry = jdcEntries.find(
                        (e) =>
                          e.date === day.dateStr &&
                          e.periodNumber === slot.periodNumber &&
                          (!activeClassId || e.classId === activeClassId)
                      );

                      // Wednesday afternoon off condition (Mercredi P5-P7 typically free in Belgian primary)
                      const isWednesdayAfternoon = day.dayOfWeek === 3 && slot.periodNumber >= 5;

                      if (isWednesdayAfternoon && !entry) {
                        return (
                          <div
                            key={`cell-${day.dayOfWeek}-${slot.periodNumber}`}
                            className="p-2 border-r border-slate-200 last:border-r-0 bg-slate-50/70 flex flex-col items-center justify-center text-center text-slate-400 text-xs"
                          >
                            <Sun className="w-4 h-4 mb-1 opacity-50" />
                            <span className="text-[11px] font-medium">Après-midi libre</span>
                          </div>
                        );
                      }

                      if (entry) {
                        const domColor = getDomainColor(entry.domain);
                        const attachedCodes = referentiels.filter((r) =>
                          entry.linkedReferentielIds?.includes(r.id)
                        );

                        return (
                          <div
                            key={`cell-${day.dayOfWeek}-${slot.periodNumber}`}
                            onClick={() => handleOpenEditLesson(entry)}
                            className={`p-2.5 border-r border-slate-200 last:border-r-0 transition cursor-pointer hover:shadow-md relative group ${domColor.bg} border-l-4 ${domColor.border}`}
                          >
                            {/* Card Top */}
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${domColor.badgeBg}`}
                              >
                                {entry.subjectTitle || entry.domain}
                              </span>

                              {/* Quick status button */}
                              <button
                                onClick={(e) => handleQuickStatusToggle(e, entry)}
                                className="p-0.5 rounded hover:bg-white/80 transition"
                                title={`Statut : ${entry.status === 'completed' ? 'Réalisé' : 'Planifié'}`}
                              >
                                {entry.status === 'completed' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : entry.status === 'postponed' ? (
                                  <AlertCircle className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-white" />
                                )}
                              </button>
                            </div>

                            {/* Lesson Title */}
                            <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                              {entry.lessonTitle}
                            </h4>

                            {/* Homework preview if any */}
                            {entry.homework && (
                              <p className="text-[11px] text-slate-600 italic mt-1 line-clamp-1">
                                📝 {entry.homework}
                              </p>
                            )}

                            {/* Attached Competency Badges */}
                            {attachedCodes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {attachedCodes.slice(0, 2).map((code) => {
                                  const cat = getCategoryBadge(code.category);
                                  return (
                                    <span
                                      key={code.id}
                                      className={`text-[9px] font-bold px-1 py-0.2 rounded font-mono ${cat.bg} ${cat.text}`}
                                      title={code.title}
                                    >
                                      {code.code}
                                    </span>
                                  );
                                })}
                                {attachedCodes.length > 2 && (
                                  <span className="text-[9px] text-slate-500 font-bold bg-white/80 px-1 py-0.2 rounded">
                                    +{attachedCodes.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Hover Quick Actions */}
                            <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1 bg-white/90 p-1 rounded-md shadow-xs border border-slate-200">
                              {onOpenPrintSheet && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenPrintSheet(entry);
                                  }}
                                  className="p-1 text-slate-500 hover:text-indigo-600"
                                  title="Fiche de prépa"
                                >
                                  <FileCheck2 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateJdcEntry(entry.id, day.dayOfWeek as DayOfWeek, Math.min(7, slot.periodNumber + 1));
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-600"
                                title="Dupliquer"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Supprimer cette leçon ?')) {
                                    deleteJdcEntry(entry.id);
                                  }
                                }}
                                className="p-1 text-slate-500 hover:text-rose-600"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Empty Slot - Click to Add
                      return (
                        <div
                          key={`cell-${day.dayOfWeek}-${slot.periodNumber}`}
                          onClick={() =>
                            handleOpenNewLesson(day.dateStr, slot.periodNumber, day.dayOfWeek as DayOfWeek)
                          }
                          className="p-2 border-r border-slate-200 last:border-r-0 hover:bg-indigo-50/40 transition cursor-pointer group flex flex-col items-center justify-center"
                        >
                          <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 group-hover:border-indigo-500 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 font-medium mt-1">
                            Ajouter
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Morning Break Row */}
                  {isMorningBreakAfter && (
                    <div className="bg-amber-50/70 border-y border-amber-200/80 px-4 py-1.5 text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>Récréation du matin (10:10 - 10:25)</span>
                    </div>
                  )}

                  {/* Lunch Break Row */}
                  {isLunchBreakAfter && (
                    <div className="bg-emerald-50/70 border-y border-emerald-200/80 px-4 py-2 text-xs text-emerald-800 font-medium flex items-center justify-center gap-2">
                      <Sun className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">Temps de midi & Dîner chaud (12:05 - 13:20)</span>
                    </div>
                  )}

                  {/* Afternoon Break Row */}
                  {isAfternoonBreakAfter && (
                    <div className="bg-amber-50/50 border-y border-amber-200/60 px-4 py-1 text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
                      <Coffee className="w-3 h-3 text-amber-600" />
                      <span>Pause goûter (15:00 - 15:15)</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lesson Edit / Create Modal */}
      <LessonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entry={selectedEntry}
        initialDate={modalInitialDate}
        initialPeriod={modalInitialPeriod}
        initialDayOfWeek={modalInitialDayOfWeek}
        onPrintLesson={onOpenPrintSheet}
      />
    </div>
  );
};
