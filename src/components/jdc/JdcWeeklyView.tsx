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
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Coffee,
  Sun,
  School,
  FileCheck2,
  Columns,
  ListFilter,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JdcEntry, DayOfWeek } from '../../types';
import { LessonModal } from './LessonModal';
import { getDomainColor, getCategoryBadge } from '../../lib/utils';

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

  // Mobile selected day index (0 = Monday, 1 = Tuesday, etc.)
  const [mobileSelectedDayIndex, setMobileSelectedDayIndex] = useState<number>(0);
  // View mode: 'day' (stacked list for mobile/responsive) or 'week' (full 5-column table)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const periodsOnly = timeSlots.filter((s) => !s.isBreak && s.periodNumber > 0);
  const currentMobileDay = activeWeekDays[mobileSelectedDayIndex] || activeWeekDays[0];

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
      {/* Top Banner & Week Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Journal de Classe</h1>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {activeClass?.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Semaine du {activeWeekDays[0]?.label} au {activeWeekDays[4]?.label} (Semaine {activeWeekType})
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={populateWeekFromSchedule}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition shadow-2xs cursor-pointer"
              title="Générer les cours à partir de votre grille horaire type"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Remplir depuis grille</span>
            </button>

            <button
              onClick={() =>
                handleOpenNewLesson(currentMobileDay?.dateStr || activeWeekDays[0]?.dateStr || '', 1, (mobileSelectedDayIndex + 1) as DayOfWeek)
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer leçon</span>
            </button>
          </div>
        </div>

        {/* Mobile / Desktop View Mode Switcher + Week Navigator for Mobile */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Mobile week navigation */}
          <div className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={goToPreviousWeek}
              className="p-1 hover:bg-white rounded-lg text-slate-700 transition"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-2 py-0.5 font-semibold text-slate-800"
            >
              Sem. {activeWeekType}
            </button>
            <button
              onClick={goToNextWeek}
              className="p-1 hover:bg-white rounded-lg text-slate-700 transition"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle: Day vs Full Table */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'day'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Vue Jour (Optimisé)</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'week'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Vue Grille (5 jours)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DAY VIEW (Perfect for smartphones & responsive single column) */}
      {/* ========================================================================= */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Day Tabs Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {activeWeekDays.map((day, idx) => {
              const isSelected = mobileSelectedDayIndex === idx;
              // Count lessons for this day
              const dayLessonsCount = jdcEntries.filter(
                (e) => e.date === day.dateStr && (!activeClassId || e.classId === activeClassId)
              ).length;

              return (
                <button
                  key={day.dayOfWeek}
                  onClick={() => setMobileSelectedDayIndex(idx)}
                  className={`flex-1 min-w-[65px] sm:min-w-[90px] py-2 px-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {day.label.split(' ')[0]}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {day.label.split(' ')[1]}
                  </span>
                  {dayLessonsCount > 0 && (
                    <span
                      className={`mt-1 text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {dayLessonsCount} cours
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Single Column Stacked Period List */}
          <div className="space-y-3">
            {periodsOnly.map((slot) => {
              const entry = jdcEntries.find(
                (e) =>
                  e.date === currentMobileDay?.dateStr &&
                  e.periodNumber === slot.periodNumber &&
                  (!activeClassId || e.classId === activeClassId)
              );

              const isWednesdayAfternoon = currentMobileDay?.dayOfWeek === 3 && slot.periodNumber >= 5;

              // Break notifications
              const isMorningBreakAfter = slot.periodNumber === 2;
              const isLunchBreakAfter = slot.periodNumber === 4;
              const isAfternoonBreakAfter = slot.periodNumber === 6;

              return (
                <React.Fragment key={`mobile-slot-${slot.periodNumber}`}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Period Badge & Time */}
                    <div className="flex items-center sm:flex-col items-start sm:items-center justify-between sm:justify-center sm:min-w-[80px] pb-2 sm:pb-0 sm:border-r border-slate-100 sm:pr-3">
                      <div className="flex items-center sm:flex-col gap-2 sm:gap-1">
                        <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shadow-2xs">
                          P{slot.periodNumber}
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      {!entry && !isWednesdayAfternoon && (
                        <button
                          onClick={() =>
                            handleOpenNewLesson(
                              currentMobileDay.dateStr,
                              slot.periodNumber,
                              currentMobileDay.dayOfWeek as DayOfWeek
                            )
                          }
                          className="sm:hidden flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </button>
                      )}
                    </div>

                    {/* Main Period Content */}
                    <div className="flex-1 min-w-0">
                      {isWednesdayAfternoon && !entry ? (
                        <div className="py-2 text-center text-slate-400 text-xs flex items-center justify-center gap-2 bg-slate-50 rounded-xl">
                          <Sun className="w-4 h-4 opacity-50" />
                          <span>Après-midi libre (Mercredi)</span>
                        </div>
                      ) : entry ? (
                        (() => {
                          const domColor = getDomainColor(entry.domain);
                          const attachedCodes = referentiels.filter((r) =>
                            entry.linkedReferentielIds?.includes(r.id)
                          );

                          return (
                            <div
                              onClick={() => handleOpenEditLesson(entry)}
                              className={`p-3 rounded-xl border-l-4 transition cursor-pointer hover:shadow-xs ${domColor.bg} ${domColor.border}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded leading-none ${domColor.badgeBg}`}
                                  >
                                    {entry.subjectTitle || entry.domain}
                                  </span>
                                  {entry.classId && (
                                    <span className="text-[10px] text-slate-500 font-medium bg-white/70 px-1.5 py-0.5 rounded">
                                      {classes.find((c) => c.id === entry.classId)?.name}
                                    </span>
                                  )}
                                </div>

                                {/* Status button */}
                                <button
                                  onClick={(e) => handleQuickStatusToggle(e, entry)}
                                  className="p-1 rounded-lg hover:bg-white/80 transition"
                                  title={`Statut: ${entry.status === 'completed' ? 'Réalisé' : 'Planifié'}`}
                                >
                                  {entry.status === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  ) : entry.status === 'postponed' ? (
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 bg-white" />
                                  )}
                                </button>
                              </div>

                              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                {entry.lessonTitle}
                              </h3>

                              {entry.objective && (
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  <span className="font-semibold text-slate-700">Obj :</span> {entry.objective}
                                </p>
                              )}

                              {entry.homework && (
                                <p className="text-xs text-indigo-900 bg-indigo-50/60 p-1.5 rounded-lg italic mt-1.5">
                                  📝 Devoir / Tâche : {entry.homework}
                                </p>
                              )}

                              {/* Competency Badges */}
                              {attachedCodes.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {attachedCodes.map((code) => {
                                    const cat = getCategoryBadge(code.category);
                                    return (
                                      <span
                                        key={code.id}
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${cat.bg} ${cat.text}`}
                                      >
                                        {code.code} : {code.title}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Action Footer */}
                              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-200/60">
                                {onOpenPrintSheet && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenPrintSheet(entry);
                                    }}
                                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                                  >
                                    <FileCheck2 className="w-3.5 h-3.5" />
                                    <span>Fiche prépa</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateJdcEntry(
                                      entry.id,
                                      currentMobileDay.dayOfWeek as DayOfWeek,
                                      Math.min(7, slot.periodNumber + 1)
                                    );
                                  }}
                                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Dupliquer</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Supprimer cette leçon ?')) {
                                      deleteJdcEntry(entry.id);
                                    }
                                  }}
                                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Supprimer</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        /* Empty period slot */
                        <button
                          onClick={() =>
                            handleOpenNewLesson(
                              currentMobileDay.dateStr,
                              slot.periodNumber,
                              currentMobileDay.dayOfWeek as DayOfWeek
                            )
                          }
                          className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl transition flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 text-xs font-medium cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Créer une leçon pour P{slot.periodNumber}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Morning Break */}
                  {isMorningBreakAfter && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 font-medium flex items-center justify-center gap-2">
                      <Coffee className="w-4 h-4 text-amber-600" />
                      <span>Récréation du matin (10:10 - 10:25)</span>
                    </div>
                  )}

                  {/* Lunch Break */}
                  {isLunchBreakAfter && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 font-semibold flex items-center justify-center gap-2">
                      <Sun className="w-4 h-4 text-emerald-600" />
                      <span>Temps de midi & Dîner chaud (12:05 - 13:20)</span>
                    </div>
                  )}

                  {/* Afternoon Break */}
                  {isAfternoonBreakAfter && (
                    <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2 text-xs text-amber-900 font-medium flex items-center justify-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pause goûter (15:00 - 15:15)</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FULL 5-DAY GRID TABLE VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'week' && (
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
                        const entry = jdcEntries.find(
                          (e) =>
                            e.date === day.dateStr &&
                            e.periodNumber === slot.periodNumber &&
                            (!activeClassId || e.classId === activeClassId)
                        );

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
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${domColor.badgeBg}`}
                                >
                                  {entry.subjectTitle || entry.domain}
                                </span>

                                <button
                                  onClick={(e) => handleQuickStatusToggle(e, entry)}
                                  className="p-0.5 rounded hover:bg-white/80 transition"
                                  title={`Statut: ${entry.status === 'completed' ? 'Réalisé' : 'Planifié'}`}
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

                              <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                                {entry.lessonTitle}
                              </h4>

                              {entry.homework && (
                                <p className="text-[11px] text-slate-600 italic mt-1 line-clamp-1">
                                  📝 {entry.homework}
                                </p>
                              )}

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

                    {isMorningBreakAfter && (
                      <div className="bg-amber-50/70 border-y border-amber-200/80 px-4 py-1.5 text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
                        <Coffee className="w-3.5 h-3.5 text-amber-600" />
                        <span>Récréation du matin (10:10 - 10:25)</span>
                      </div>
                    )}

                    {isLunchBreakAfter && (
                      <div className="bg-emerald-50/70 border-y border-emerald-200/80 px-4 py-2 text-xs text-emerald-800 font-medium flex items-center justify-center gap-2">
                        <Sun className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">Temps de midi & Dîner chaud (12:05 - 13:20)</span>
                      </div>
                    )}

                    {isAfternoonBreakAfter && (
                      <div className="bg-amber-50/50 border-y border-amber-200/60 px-4 py-1 text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
                        <Coffee className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pause goûter (15:00 - 15:15)</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
