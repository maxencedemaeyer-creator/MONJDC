import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Layers,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JdcEntry, LessonPhase, SubjectDomain, DayOfWeek, WeekType } from '../../types';
import { CompetencyPickerModal } from './CompetencyPickerModal';
import { getDomainColor, getCategoryBadge, formatDateFrench } from '../../lib/utils';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JdcEntry | null;
  initialDate?: string;
  initialPeriod?: number;
  initialDayOfWeek?: DayOfWeek;
  onPrintLesson?: (entry: JdcEntry) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  entry,
  initialDate,
  initialPeriod = 1,
  initialDayOfWeek = 1,
  onPrintLesson,
}) => {
  const {
    activeClassId,
    classes,
    profile,
    referentiels,
    addJdcEntry,
    updateJdcEntry,
    deleteJdcEntry,
    duplicateJdcEntry,
    activeWeekType,
    timeSlots,
  } = useApp();

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Form states
  const [domain, setDomain] = useState<SubjectDomain>('Français');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [classId, setClassId] = useState(activeClassId);
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [periodNumber, setPeriodNumber] = useState(initialPeriod);
  const [weekType, setWeekType] = useState<WeekType>(activeWeekType);
  const [objectives, setObjectives] = useState('');
  const [materialsText, setMaterialsText] = useState('');
  const [differentiation, setDifferentiation] = useState('');
  const [homework, setHomework] = useState('');
  const [notesForInspection, setNotesForInspection] = useState('');
  const [status, setStatus] = useState<JdcEntry['status']>('planned');
  const [linkedReferentielIds, setLinkedReferentielIds] = useState<string[]>([]);
  const [phases, setPhases] = useState<LessonPhase[]>([
    {
      id: 'p1',
      title: 'Mise en situation / Découverte',
      durationMinutes: 10,
      teacherAction: 'Présentation de la situation problème au TBI et questionnement.',
      studentAction: 'Observation, réflexion individuelle et émission d’hypothèses.',
    },
    {
      id: 'p2',
      title: 'Institutionnalisation & Structuration',
      durationMinutes: 20,
      teacherAction: 'Accompagnement de la synthèse et élaboration de la règle commune.',
      studentAction: 'Construction de la trace écrite dans le cahier.',
    },
    {
      id: 'p3',
      title: 'Exercisation & Pratique autonome',
      durationMinutes: 20,
      teacherAction: 'Circulation en îlots et différenciation pour les élèves à besoins spécifiques.',
      studentAction: 'Résolution des exercices d’application en autonomie.',
    },
  ]);

  // Load existing entry or set defaults
  useEffect(() => {
    if (entry) {
      setDomain(entry.domain);
      setSubjectTitle(entry.subjectTitle);
      setLessonTitle(entry.lessonTitle);
      setClassId(entry.classId);
      setDate(entry.date);
      setPeriodNumber(entry.periodNumber);
      setWeekType(entry.weekType);
      setObjectives(entry.objectives);
      setMaterialsText((entry.materials || []).join('\n'));
      setDifferentiation(entry.differentiation || '');
      setHomework(entry.homework || '');
      setNotesForInspection(entry.notesForInspection || '');
      setStatus(entry.status);
      setLinkedReferentielIds(entry.linkedReferentielIds || []);
      setPhases(
        entry.phases && entry.phases.length > 0
          ? entry.phases
          : [
              {
                id: 'p1',
                title: 'Mise en situation',
                durationMinutes: 10,
                teacherAction: '',
                studentAction: '',
              },
            ]
      );
    } else {
      setDomain('Français');
      setSubjectTitle('Français');
      setLessonTitle('');
      setClassId(activeClassId);
      if (initialDate) setDate(initialDate);
      setPeriodNumber(initialPeriod);
      setWeekType(activeWeekType);
      setObjectives('');
      setMaterialsText('Manuel de classe\nCahier d’exercices');
      setDifferentiation('Aménagements prévus selon les profils (temps majoré, police adaptée)');
      setHomework('');
      setNotesForInspection('');
      setStatus('planned');
      setLinkedReferentielIds([]);
    }
  }, [entry, isOpen, initialDate, initialPeriod, activeClassId, activeWeekType]);

  if (!isOpen) return null;

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

  const handleToggleReferentiel = (id: string) => {
    setLinkedReferentielIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddPhase = () => {
    const newPhase: LessonPhase = {
      id: `phase-${Date.now()}`,
      title: 'Nouvelle étape',
      durationMinutes: 10,
      teacherAction: '',
      studentAction: '',
    };
    setPhases((prev) => [...prev, newPhase]);
  };

  const handleUpdatePhase = (id: string, updated: Partial<LessonPhase>) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const handleDeletePhase = (id: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    if (!lessonTitle.trim()) {
      alert('Veuillez saisir un intitulé pour la leçon.');
      return;
    }

    const domColor = getDomainColor(domain);
    const materialsArray = materialsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const calculatedDayOfWeek = (new Date(date).getDay() || 7) as DayOfWeek;

    const payload = {
      userId: profile.id,
      classId,
      date,
      dayOfWeek: calculatedDayOfWeek <= 5 ? calculatedDayOfWeek : initialDayOfWeek,
      periodNumber,
      weekType,
      domain,
      subjectTitle: subjectTitle || domain,
      lessonTitle,
      objectives,
      materials: materialsArray,
      phases,
      differentiation,
      homework,
      linkedReferentielIds,
      status,
      notesForInspection,
      color: domColor.bg,
    };

    if (entry) {
      updateJdcEntry(entry.id, payload);
    } else {
      addJdcEntry(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (entry && confirm('Êtes-vous sûr de vouloir supprimer cette préparation de leçon ?')) {
      deleteJdcEntry(entry.id);
      onClose();
    }
  };

  const attachedReferentiels = referentiels.filter((r) => linkedReferentielIds.includes(r.id));
  const currentSlotTime = timeSlots.find((s) => s.periodNumber === periodNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              P{periodNumber}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {entry ? 'Modifier la fiche de préparation' : 'Nouvelle préparation de leçon'}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDateFrench(date)} • {currentSlotTime ? `${currentSlotTime.startTime} - ${currentSlotTime.endTime}` : `Période ${periodNumber}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {entry && onPrintLesson && (
              <button
                type="button"
                onClick={() => onPrintLesson(entry)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition"
                title="Imprimer la fiche conforme inspection"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimer fiche</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Row 1: Domain, Subject, Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Discipline / Domaine FWB *
              </label>
              <select
                value={domain}
                onChange={(e) => {
                  const newDom = e.target.value as SubjectDomain;
                  setDomain(newDom);
                  if (!subjectTitle) setSubjectTitle(newDom);
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Sous-matière / Intitulé court
              </label>
              <input
                type="text"
                value={subjectTitle}
                onChange={(e) => setSubjectTitle(e.target.value)}
                placeholder="Ex: Grammaire, Géométrie..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Statut de réalisation
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JdcEntry['status'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              >
                <option value="planned">⚪ Prévue / Planifiée</option>
                <option value="completed">🟢 Réalisée</option>
                <option value="postponed">🟡 Reportée</option>
                <option value="cancelled">🔴 Annulée</option>
              </select>
            </div>
          </div>

          {/* Lesson Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Intitulé de la séquence / Titre de la leçon *
            </label>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="Ex: Les accords dans le groupe nominal : Nom, Déterminant et Adjectif"
              className="w-full px-3.5 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
          </div>

          {/* Section: FWB / SeGEC Competencies */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Référentiels & Compétences associés (FWB / SeGEC)
                </h4>
                <p className="text-xs text-indigo-700/80">
                  Alignez cette leçon sur les Savoirs (S), Savoir-Faire (SF) et Compétences (C)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Associer un code FWB</span>
              </button>
            </div>

            {/* Chips list */}
            {attachedReferentiels.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">
                Aucun code référentiel attaché. Cliquez sur le bouton ci-dessus pour parcourir le programme officiel.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachedReferentiels.map((ref) => {
                  const cat = getCategoryBadge(ref.category);
                  return (
                    <div
                      key={ref.id}
                      className="flex items-center gap-2 bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs"
                    >
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${cat.bg} ${cat.text}`}>
                        {ref.code}
                      </span>
                      <span className="text-slate-800 font-medium max-w-xs truncate">{ref.title}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleReferentiel(ref.id)}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                        title="Retirer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Objectif(s) opérationnel(s) (L'élève sera capable de...)
            </label>
            <textarea
              rows={2}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Ex: Identifier le noyau du groupe nominal et accorder correctement l'adjectif qualificatif en genre et en nombre."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Lesson Phases (Déroulement pédagogique) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Déroulement par étapes (Fiche de préparation)
                </h4>
                <p className="text-xs text-slate-500">
                  Découpez votre séance en phases clés (durée, rôle enseignant, activité élève)
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddPhase}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une phase</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {phases.map((phase, idx) => (
                <div
                  key={phase.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Phase {idx + 1} :</span>
                    <input
                      type="text"
                      value={phase.title}
                      onChange={(e) => handleUpdatePhase(phase.id, { title: e.target.value })}
                      placeholder="Nom de la phase..."
                      className="flex-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                    <div className="flex items-center gap-1 bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <input
                        type="number"
                        min={5}
                        max={60}
                        step={5}
                        value={phase.durationMinutes}
                        onChange={(e) =>
                          handleUpdatePhase(phase.id, { durationMinutes: Number(e.target.value) })
                        }
                        className="w-10 text-center focus:outline-hidden font-medium"
                      />
                      <span>min</span>
                    </div>
                    {phases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeletePhase(phase.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Supprimer la phase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-slate-600 block mb-1">Rôle / Consigne Enseignant :</span>
                      <textarea
                        rows={2}
                        value={phase.teacherAction}
                        onChange={(e) => handleUpdatePhase(phase.id, { teacherAction: e.target.value })}
                        placeholder="Consigne, questions de relance, étayage..."
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <span className="font-medium text-slate-600 block mb-1">Activité / Production Élève :</span>
                      <textarea
                        rows={2}
                        value={phase.studentAction}
                        onChange={(e) => handleUpdatePhase(phase.id, { studentAction: e.target.value })}
                        placeholder="Manipulation, trace écrite, binôme..."
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Differentiation & Special Needs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Différenciation & Aménagements Raisonnables (PAP)
              </label>
              <textarea
                rows={2}
                value={differentiation}
                onChange={(e) => setDifferentiation(e.target.value)}
                placeholder="Ex: Police OpenDyslexic pour Lucas, table de Pythagore pour Léa, défi d'enrichissement pour Arthur."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Matériel & Supports
              </label>
              <textarea
                rows={2}
                value={materialsText}
                onChange={(e) => setMaterialsText(e.target.value)}
                placeholder="Ex: TBI, manuel p. 44, étiquettes de mots, fiche d'exercices..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Homework & Inspection note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Devoirs & Leçons (Journal de classe de l'élève)
              </label>
              <input
                type="text"
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="Ex: Relire la synthèse p.12 + signer le bilan"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Remarques pédagogiques / Auto-évaluation
              </label>
              <input
                type="text"
                value={notesForInspection}
                onChange={(e) => setNotesForInspection(e.target.value)}
                placeholder="Ex: Notions bien assimilées par l'ensemble du groupe, revoir l'accord avec 2 élèves."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {entry && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer cette leçon</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
            >
              {entry ? 'Enregistrer les modifications' : 'Ajouter au journal de classe'}
            </button>
          </div>
        </div>
      </div>

      {/* Competency Picker Sub-Modal */}
      <CompetencyPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedIds={linkedReferentielIds}
        onToggleId={handleToggleReferentiel}
        defaultDomain={domain}
      />
    </div>
  );
};
