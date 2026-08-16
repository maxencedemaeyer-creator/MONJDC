import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DefaultSlotAssignment,
  SubjectDomain,
  DayOfWeek,
  WeekType,
  TimeSlotConfig,
} from '../../types';
import { getDomainColor } from '../../lib/utils';

export const TimetableConfigView: React.FC = () => {
  const {
    timeSlots,
    updateTimeSlots,
    defaultSlots,
    addDefaultSlot,
    updateDefaultSlot,
    deleteDefaultSlot,
    classes,
    activeClassId,
  } = useApp();

  const [activeWeekFilter, setActiveWeekFilter] = useState<WeekType>('ALL');
  const [editingSlot, setEditingSlot] = useState<DefaultSlotAssignment | null>(null);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

  // Form states for creating/editing default slot assignment
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(1);
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [weekType, setWeekType] = useState<WeekType>('ALL');
  const [domain, setDomain] = useState<SubjectDomain>('Français');
  const [subjectTitle, setSubjectTitle] = useState('Français');
  const [classId, setClassId] = useState(activeClassId);
  const [room, setRoom] = useState('Local 204');

  const days: { dayOfWeek: DayOfWeek; label: string }[] = [
    { dayOfWeek: 1, label: 'Lundi' },
    { dayOfWeek: 2, label: 'Mardi' },
    { dayOfWeek: 3, label: 'Mercredi' },
    { dayOfWeek: 4, label: 'Jeudi' },
    { dayOfWeek: 5, label: 'Vendredi' },
  ];

  const domains: SubjectDomain[] = [
    'Français',
    'Mathématiques',
    'Éveil & Sciences',
    'Sciences Humaines',
    'Formation Artistique',
    'FMTTN & Numérique',
    'Éducation Physique',
    'Langues Modernes',
    'Citoyenneté & Philosophie',
  ];

  const periodsOnly = timeSlots.filter((s) => !s.isBreak && s.periodNumber > 0);

  const handleOpenNewSlot = (day: DayOfWeek, period: number) => {
    setEditingSlot(null);
    setDayOfWeek(day);
    setPeriodNumber(period);
    setWeekType(activeWeekFilter === 'ALL' ? 'ALL' : activeWeekFilter);
    setDomain('Français');
    setSubjectTitle('Français');
    setClassId(activeClassId);
    setRoom('Local 204');
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot: DefaultSlotAssignment) => {
    setEditingSlot(slot);
    setDayOfWeek(slot.dayOfWeek);
    setPeriodNumber(slot.periodNumber);
    setWeekType(slot.weekType);
    setDomain(slot.domain);
    setSubjectTitle(slot.subjectTitle);
    setClassId(slot.classId);
    setRoom(slot.room || '');
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const domColor = getDomainColor(domain);

    const payload = {
      dayOfWeek,
      periodNumber,
      weekType,
      classId,
      domain,
      subjectTitle: subjectTitle || domain,
      room,
      color: domColor.bg,
    };

    if (editingSlot) {
      updateDefaultSlot(editingSlot.id, payload);
    } else {
      addDefaultSlot(payload);
    }
    setIsSlotModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Configuration de la Grille Horaire Type
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Définissez l’horaire récurrent de vos cours. Ces créneaux permettent de pré-remplir votre journal de classe en un clic.
          </p>
        </div>

        {/* Week A / B Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Afficher :</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            {(['ALL', 'A', 'B'] as WeekType[]).map((w) => (
              <button
                key={w}
                onClick={() => setActiveWeekFilter(w)}
                className={`px-3 py-1 rounded-lg transition ${
                  activeWeekFilter === w
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {w === 'ALL' ? 'Toutes semaines' : `Semaine ${w}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Weekly Default Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Grille Hebdomadaire Fixe (Lundi - Vendredi)
          </div>
          <span className="text-xs text-slate-500">
            Cliquez sur une case pour ajouter ou modifier une matière type
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Days Header */}
            <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 text-center">
              <div className="p-3 border-r border-slate-200 text-slate-400 uppercase text-[11px]">
                Période
              </div>
              {days.map((d) => (
                <div key={d.dayOfWeek} className="p-3 border-r border-slate-200 last:border-r-0">
                  {d.label}
                </div>
              ))}
            </div>

            {/* Periods Rows */}
            <div className="divide-y divide-slate-100">
              {periodsOnly.map((slot) => (
                <div key={slot.periodNumber} className="grid grid-cols-6 min-h-[85px]">
                  {/* Time info */}
                  <div className="p-2.5 border-r border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shadow-2xs mb-0.5">
                      P{slot.periodNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">{slot.startTime}</span>
                    <span className="text-[10px] text-slate-400">{slot.endTime}</span>
                  </div>

                  {/* Day cells */}
                  {days.map((day) => {
                    // Find slots matching this day and period and class
                    const matchingSlots = defaultSlots.filter(
                      (s) =>
                        s.dayOfWeek === day.dayOfWeek &&
                        s.periodNumber === slot.periodNumber &&
                        (activeWeekFilter === 'ALL' || s.weekType === 'ALL' || s.weekType === activeWeekFilter)
                    );

                    // Wednesday afternoon blank
                    if (day.dayOfWeek === 3 && slot.periodNumber >= 5 && matchingSlots.length === 0) {
                      return (
                        <div
                          key={`def-${day.dayOfWeek}-${slot.periodNumber}`}
                          className="p-2 border-r border-slate-200 last:border-r-0 bg-slate-50/60 flex items-center justify-center text-[11px] text-slate-400 font-medium"
                        >
                          Après-midi libre
                        </div>
                      );
                    }

                    if (matchingSlots.length > 0) {
                      const firstSlot = matchingSlots[0];
                      const domColor = getDomainColor(firstSlot.domain);

                      return (
                        <div
                          key={`def-${day.dayOfWeek}-${slot.periodNumber}`}
                          onClick={() => handleOpenEditSlot(firstSlot)}
                          className={`p-2 border-r border-slate-200 last:border-r-0 cursor-pointer hover:shadow-xs transition relative group ${domColor.bg} border-l-4 ${domColor.border}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${domColor.badgeBg}`}>
                              {firstSlot.domain}
                            </span>
                            {firstSlot.weekType !== 'ALL' && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-100 text-indigo-800">
                                Sem. {firstSlot.weekType}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-900 line-clamp-1">
                            {firstSlot.subjectTitle}
                          </div>
                          {firstSlot.room && (
                            <div className="text-[10px] text-slate-500 mt-0.5">{firstSlot.room}</div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Supprimer ce créneau par défaut ?')) {
                                deleteDefaultSlot(firstSlot.id);
                              }
                            }}
                            className="absolute top-1 right-1 hidden group-hover:block p-1 text-slate-400 hover:text-rose-600 bg-white/90 rounded shadow-2xs"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`def-${day.dayOfWeek}-${slot.periodNumber}`}
                        onClick={() => handleOpenNewSlot(day.dayOfWeek, slot.periodNumber)}
                        className="p-2 border-r border-slate-200 last:border-r-0 hover:bg-indigo-50/40 transition cursor-pointer flex items-center justify-center group"
                      >
                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Period Timetable Slot Customizer (Start & End Times) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          Horaires des Périodes & Récréations (Structure FWB)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl border text-xs space-y-2 ${
                slot.isBreak
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>{slot.isBreak ? slot.breakLabel : `Période ${slot.periodNumber}`}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-mono border border-slate-200">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => {
                    const updated = [...timeSlots];
                    updated[index].startTime = e.target.value;
                    updateTimeSlots(updated);
                  }}
                  className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono"
                />
                <span>à</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => {
                    const updated = [...timeSlots];
                    updated[index].endTime = e.target.value;
                    updateTimeSlots(updated);
                  }}
                  className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Default Slot Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              {editingSlot ? 'Modifier le créneau type' : 'Nouveau créneau type'}
            </h3>

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Jour</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value) as DayOfWeek)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {days.map((d) => (
                      <option key={d.dayOfWeek} value={d.dayOfWeek}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Période</label>
                  <select
                    value={periodNumber}
                    onChange={(e) => setPeriodNumber(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {periodsOnly.map((p) => (
                      <option key={p.periodNumber} value={p.periodNumber}>
                        P{p.periodNumber} ({p.startTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Alternance Semaine</label>
                <select
                  value={weekType}
                  onChange={(e) => setWeekType(e.target.value as WeekType)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="ALL">Toutes les semaines (Standard)</option>
                  <option value="A">Semaine A uniquement</option>
                  <option value="B">Semaine B uniquement</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Discipline FWB</label>
                <select
                  value={domain}
                  onChange={(e) => {
                    const d = e.target.value as SubjectDomain;
                    setDomain(d);
                    if (!subjectTitle || subjectTitle === domain) setSubjectTitle(d);
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Intitulé du cours</label>
                <input
                  type="text"
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                  placeholder="Ex: Lecture & Écriture, Géométrie, Gym..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Local / Salle</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Ex: Local 204, Salle de sport..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
