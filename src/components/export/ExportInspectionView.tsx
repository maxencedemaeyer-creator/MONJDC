import React, { useState } from 'react';
import {
  FileCheck2,
  Printer,
  Download,
  Calendar,
  BookOpen,
  School,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateFrench, getDomainColor, getCategoryBadge } from '../../lib/utils';
import { JdcEntry } from '../../types';

export const ExportInspectionView: React.FC = () => {
  const {
    profile,
    activeClass,
    activeWeekDays,
    activeWeekType,
    timeSlots,
    jdcEntries,
    referentiels,
    students,
    evaluations,
  } = useApp();

  const [exportMode, setExportMode] = useState<'weekly' | 'single_lesson'>('weekly');
  const [selectedLessonIdForExport, setSelectedLessonIdForExport] = useState<string>(
    jdcEntries[0]?.id || ''
  );

  const periodsOnly = timeSlots.filter((s) => !s.isBreak && s.periodNumber > 0);
  const selectedLesson = jdcEntries.find((e) => e.id === selectedLessonIdForExport) || jdcEntries[0];

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Control Panel (Hidden during print) */}
      <div className="print:hidden bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              Export & Dossier d'Inspection Pédagogique (FWB)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Conforme FWB / SeGEC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Générez et imprimez des documents officiels prêts pour la visite de l'inspection ou la direction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setExportMode('weekly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                exportMode === 'weekly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Planning Hebdomadaire
            </button>
            <button
              onClick={() => setExportMode('single_lesson')}
              className={`px-3 py-1.5 rounded-lg transition ${
                exportMode === 'single_lesson'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fiche de Prépa Détaillée
            </button>
          </div>

          <button
            onClick={handleTriggerPrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / Sauvegarder PDF</span>
          </button>
        </div>
      </div>

      {/* Lesson Selector when in single_lesson mode */}
      {exportMode === 'single_lesson' && (
        <div className="print:hidden bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Choisir la leçon à exporter :</span>
          </div>
          <select
            value={selectedLesson?.id || ''}
            onChange={(e) => setSelectedLessonIdForExport(e.target.value)}
            className="p-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
          >
            {jdcEntries.map((l) => (
              <option key={l.id} value={l.id}>
                {l.date} • P{l.periodNumber} : {l.subjectTitle} - {l.lessonTitle}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Printable Paper Canvas (Styled for A4 / Letter Print) */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-lg print:border-none print:shadow-none print:p-0 print:m-0 space-y-6 text-slate-900 font-sans">
        {/* Official Belgian School Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Fédération Wallonie-Bruxelles • Enseignement Fondamental / Secondaire
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              {profile.schoolName}
            </h2>
            <div className="text-xs text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Enseignant(e) :</strong> {profile.name}</span>
              <span><strong>Classe :</strong> {activeClass?.name}</span>
              <span><strong>Cycle :</strong> {profile.selectedCycle}</span>
              <span><strong>Année :</strong> {profile.schoolYear}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-slate-100 rounded border border-slate-300 text-xs font-bold font-mono">
              {exportMode === 'weekly' ? 'JOURNAL DE CLASSE HEBDOMADAIRE' : 'FICHE PÉDAGOGIQUE OFFICIELLE'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Semaine du {activeWeekDays[0]?.label} au {activeWeekDays[4]?.label} (Semaine {activeWeekType})
            </p>
          </div>
        </div>

        {/* View Mode 1: Weekly Overview for Inspector */}
        {exportMode === 'weekly' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
                    <th className="border border-slate-300 p-2 w-16 text-center">Période</th>
                    {activeWeekDays.map((day) => (
                      <th key={day.dayOfWeek} className="border border-slate-300 p-2 text-center">
                        <div className="font-bold">{day.label.split(' ')[0]}</div>
                        <div className="text-[10px] font-normal text-slate-600">{day.label.split(' ')[1]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodsOnly.map((slot) => (
                    <tr key={slot.periodNumber} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 bg-slate-50 text-center font-bold">
                        <div>P{slot.periodNumber}</div>
                        <div className="text-[9px] text-slate-500 font-normal">{slot.startTime}</div>
                      </td>

                      {activeWeekDays.map((day) => {
                        const entry = jdcEntries.find(
                          (e) => e.date === day.dateStr && e.periodNumber === slot.periodNumber
                        );

                        if (!entry) {
                          return (
                            <td
                              key={day.dayOfWeek}
                              className="border border-slate-300 p-1.5 text-center text-slate-300 italic text-[10px]"
                            >
                              -
                            </td>
                          );
                        }

                        const attachedCodes = referentiels.filter((r) =>
                          entry.linkedReferentielIds?.includes(r.id)
                        );

                        return (
                          <td
                            key={day.dayOfWeek}
                            className="border border-slate-300 p-2 align-top space-y-1 bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-indigo-950 uppercase">
                                {entry.subjectTitle}
                              </span>
                              <span className="text-[9px] text-slate-500">
                                {entry.status === 'completed' ? '✓ Fait' : 'Prévu'}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {entry.lessonTitle}
                            </div>
                            {entry.objectives && (
                              <div className="text-[10px] text-slate-600 leading-tight">
                                🎯 {entry.objectives}
                              </div>
                            )}
                            {attachedCodes.length > 0 && (
                              <div className="text-[9px] font-mono font-bold text-slate-700 pt-0.5">
                                Ref: {attachedCodes.map((c) => c.code).join(', ')}
                              </div>
                            )}
                            {entry.homework && (
                              <div className="text-[9px] text-slate-700 italic">
                                Devoir: {entry.homework}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Weekly summary & signatures box */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
              <div className="border border-slate-300 p-3 rounded-lg space-y-1">
                <div className="font-bold text-slate-800 uppercase text-[10px]">
                  Visa de la Direction / Pouvoir Organisateur
                </div>
                <p className="text-[10px] text-slate-500">Date et signature :</p>
                <div className="h-10" />
              </div>
              <div className="border border-slate-300 p-3 rounded-lg space-y-1">
                <div className="font-bold text-slate-800 uppercase text-[10px]">
                  Visa de l’Inspecteur(trice) Pédagogique FWB
                </div>
                <p className="text-[10px] text-slate-500">Observations & avis :</p>
                <div className="h-10" />
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Detailed Lesson Plan Preparation Sheet */}
        {exportMode === 'single_lesson' && selectedLesson && (
          <div className="space-y-5 text-xs">
            {/* Title Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-indigo-900 text-xs">
                  Discipline : {selectedLesson.domain} ({selectedLesson.subjectTitle})
                </span>
                <span className="font-mono text-slate-600">
                  {formatDateFrench(selectedLesson.date)} • Période {selectedLesson.periodNumber}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">{selectedLesson.lessonTitle}</h3>
            </div>

            {/* Objectives and Attached FWB Standards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-300 p-3.5 rounded-xl space-y-1">
                <div className="font-bold uppercase text-slate-800 text-[10px] tracking-wider">
                  Objectif(s) Opérationnel(s) d'Apprentissage
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedLesson.objectives || 'Non précisé'}
                </p>
              </div>

              <div className="border border-slate-300 p-3.5 rounded-xl space-y-1.5">
                <div className="font-bold uppercase text-slate-800 text-[10px] tracking-wider">
                  Référentiels & Compétences du Tronc Commun (FWB)
                </div>
                {referentiels
                  .filter((r) => selectedLesson.linkedReferentielIds?.includes(r.id))
                  .map((ref) => {
                    const cat = getCategoryBadge(ref.category);
                    return (
                      <div key={ref.id} className="text-[11px] text-slate-800 flex items-start gap-1.5">
                        <span className="font-bold font-mono text-indigo-700 shrink-0">
                          [{ref.code}]
                        </span>
                        <span>{ref.title}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Phases Breakdown Table */}
            <div className="space-y-1">
              <div className="font-bold uppercase text-slate-800 text-[10px] tracking-wider">
                Déroulement Didactique par Phases
              </div>
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
                    <th className="border border-slate-300 p-2 w-36">Phase & Durée</th>
                    <th className="border border-slate-300 p-2">Rôle / Consignes Enseignant</th>
                    <th className="border border-slate-300 p-2">Activités & Productions Élèves</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedLesson.phases || []).map((phase, i) => (
                    <tr key={phase.id || i} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 font-bold bg-slate-50">
                        <div>{phase.title}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{phase.durationMinutes} min</div>
                      </td>
                      <td className="border border-slate-300 p-2 leading-relaxed">
                        {phase.teacherAction || '-'}
                      </td>
                      <td className="border border-slate-300 p-2 leading-relaxed">
                        {phase.studentAction || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Differentiation & Materials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-300 p-3.5 rounded-xl space-y-1 bg-amber-50/40">
                <div className="font-bold uppercase text-amber-900 text-[10px] tracking-wider">
                  Différenciation & Aménagements Raisonnables
                </div>
                <p className="text-slate-800 leading-relaxed">
                  {selectedLesson.differentiation || 'Différenciation standard en classe.'}
                </p>
              </div>

              <div className="border border-slate-300 p-3.5 rounded-xl space-y-1">
                <div className="font-bold uppercase text-slate-800 text-[10px] tracking-wider">
                  Matériel & Supports Didactiques
                </div>
                <p className="text-slate-800 leading-relaxed">
                  {(selectedLesson.materials || []).join(', ') || 'Manuel et cahier standard.'}
                </p>
              </div>
            </div>

            {/* Inspection Remark */}
            {selectedLesson.notesForInspection && (
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl">
                <div className="font-bold uppercase text-slate-700 text-[10px]">
                  Bilan / Auto-évaluation de la séance :
                </div>
                <p className="text-slate-800 italic mt-0.5">{selectedLesson.notesForInspection}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
