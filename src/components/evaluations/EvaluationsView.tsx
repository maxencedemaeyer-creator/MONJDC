import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Award,
  TrendingUp,
  FileCheck2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Evaluation, SubjectDomain, EvaluationType } from '../../types';
import { CompetencyPickerModal } from '../jdc/CompetencyPickerModal';
import { getDomainColor, getCategoryBadge, formatDateFrench } from '../../lib/utils';

export const EvaluationsView: React.FC = () => {
  const {
    evaluations,
    students,
    activeClass,
    activeClassId,
    referentiels,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    updateGrades,
  } = useApp();

  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompetencyPickerOpen, setIsCompetencyPickerOpen] = useState(false);
  const [selectedBulletinStudentId, setSelectedBulletinStudentId] = useState<string | null>(null);

  // New evaluation form states
  const [evalTitle, setEvalTitle] = useState('');
  const [evalDomain, setEvalDomain] = useState<SubjectDomain>('Français');
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [evalType, setEvalType] = useState<EvaluationType>('sommatif');
  const [evalMaxScore, setEvalMaxScore] = useState<number>(20);
  const [evalWeight, setEvalWeight] = useState<number>(1);
  const [evalLinkedIds, setEvalLinkedIds] = useState<string[]>([]);

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

  const classStudents = students.filter((s) => !activeClassId || s.classId === activeClassId);

  const filteredEvaluations = evaluations.filter((e) => {
    const matchesClass = !activeClassId || e.classId === activeClassId;
    const matchesDomain = selectedDomain === 'ALL' || e.domain === selectedDomain;
    return matchesClass && matchesDomain;
  });

  const handleGradeChange = (evalId: string, studentId: string, value: string) => {
    const num = value.trim() === '' ? null : Number(value);
    if (num !== null && (isNaN(num) || num < 0)) return;

    const targetEval = evaluations.find((e) => e.id === evalId);
    if (num !== null && targetEval && num > targetEval.maxScore) return;

    updateGrades(evalId, { [studentId]: num });

    // Fun confetti if perfect score
    if (targetEval && num === targetEval.maxScore) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const handleCreateEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTitle.trim()) {
      alert('Veuillez saisir un titre pour l’évaluation.');
      return;
    }

    addEvaluation({
      classId: activeClassId,
      title: evalTitle,
      domain: evalDomain,
      date: evalDate,
      type: evalType,
      maxScore: Number(evalMaxScore),
      linkedReferentielIds: evalLinkedIds,
      weight: Number(evalWeight),
      grades: {},
      comments: {},
    });

    setIsAddModalOpen(false);
    setEvalTitle('');
    setEvalLinkedIds([]);
  };

  // Calculate Student Average
  const calculateStudentOverallStats = (studentId: string) => {
    let totalScore = 0;
    let totalMax = 0;
    let evalCount = 0;

    filteredEvaluations.forEach((evalItem) => {
      const grade = evalItem.grades[studentId];
      if (grade !== undefined && grade !== null) {
        totalScore += (grade / evalItem.maxScore) * 100 * evalItem.weight;
        totalMax += 100 * evalItem.weight;
        evalCount++;
      }
    });

    if (totalMax === 0) return { percentage: null, count: 0 };
    return {
      percentage: Math.round((totalScore / totalMax) * 10) / 10,
      count: evalCount,
    };
  };

  const studentForBulletin = classStudents.find((s) => s.id === selectedBulletinStudentId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Carnet de Cotes & Évaluations des Compétences
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeClass?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Matrice des résultats, pondérations, bilans formatifs/sommatifs et génération du bulletin belge.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Domain filter */}
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="ALL">Toutes les disciplines ({evaluations.length})</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle évaluation</span>
          </button>
        </div>
      </div>

      {/* Gradebook Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-700 items-center">
            {/* Student Name Col */}
            <div className="col-span-3 p-3.5 border-r border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
              Élève ({classStudents.length})
            </div>

            {/* Evaluations Columns */}
            <div className="col-span-7 flex overflow-x-auto divide-x divide-slate-200">
              {filteredEvaluations.length === 0 ? (
                <div className="p-3 text-slate-400 italic text-xs">
                  Aucune évaluation dans ce domaine. Cliquez sur "Nouvelle évaluation".
                </div>
              ) : (
                filteredEvaluations.map((item) => {
                  const domColor = getDomainColor(item.domain);
                  return (
                    <div
                      key={item.id}
                      className="min-w-[140px] max-w-[170px] p-2.5 space-y-1 text-center shrink-0"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            item.type === 'sommatif'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">/{item.maxScore}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-500">{item.date}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Average Summary Col */}
            <div className="col-span-2 p-3 text-center border-l border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[11px] bg-indigo-50/50">
              Moyenne Globale
            </div>
          </div>

          {/* Table Rows (Students) */}
          <div className="divide-y divide-slate-100">
            {classStudents.map((stud) => {
              const stats = calculateStudentOverallStats(stud.id);

              return (
                <div
                  key={stud.id}
                  className="grid grid-cols-12 items-center hover:bg-slate-50/70 transition text-xs"
                >
                  {/* Student Name */}
                  <div className="col-span-3 p-3 border-r border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                          stud.gender === 'F' ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                      >
                        {stud.firstName[0]}
                      </div>
                      <div className="truncate font-semibold text-slate-900">
                        {stud.firstName} {stud.lastName}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedBulletinStudentId(stud.id)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition"
                      title="Générer le bulletin"
                    >
                      Bulletin
                    </button>
                  </div>

                  {/* Evaluation Score Inputs */}
                  <div className="col-span-7 flex overflow-x-auto divide-x divide-slate-100">
                    {filteredEvaluations.map((item) => {
                      const grade = item.grades[stud.id];
                      const isNull = grade === null || grade === undefined;

                      return (
                        <div
                          key={item.id}
                          className="min-w-[140px] max-w-[170px] p-2 flex items-center justify-center shrink-0"
                        >
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max={item.maxScore}
                              value={isNull ? '' : grade}
                              onChange={(e) => handleGradeChange(item.id, stud.id, e.target.value)}
                              placeholder="-"
                              className={`w-14 text-center py-1 text-xs font-bold rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                                isNull
                                  ? 'bg-slate-50 border-slate-200 text-slate-400'
                                  : (grade as number) >= item.maxScore * 0.7
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : (grade as number) >= item.maxScore * 0.5
                                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                  : 'bg-rose-50 border-rose-300 text-rose-800'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400 font-mono">/{item.maxScore}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall Average */}
                  <div className="col-span-2 p-3 text-center border-l border-slate-200 font-bold bg-slate-50/40">
                    {stats.percentage !== null ? (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          stats.percentage >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : stats.percentage >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {stats.percentage}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Evaluation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Créer une évaluation pédagogique
            </h3>

            <form onSubmit={handleCreateEvaluation} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Titre de l'évaluation *</label>
                <input
                  type="text"
                  required
                  value={evalTitle}
                  onChange={(e) => setEvalTitle(e.target.value)}
                  placeholder="Ex: Bilan n°2 : Accords dans le groupe nominal"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Discipline FWB</label>
                  <select
                    value={evalDomain}
                    onChange={(e) => setEvalDomain(e.target.value as SubjectDomain)}
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
                  <label className="font-semibold text-slate-600 block mb-1">Date</label>
                  <input
                    type="date"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Type d'évaluation</label>
                  <select
                    value={evalType}
                    onChange={(e) => setEvalType(e.target.value as EvaluationType)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="sommatif">Sommatif (Certificatif)</option>
                    <option value="formatif">Formatif (Régulation)</option>
                    <option value="diagnostique">Diagnostique</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Total Points</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={evalMaxScore}
                    onChange={(e) => setEvalMaxScore(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={evalWeight}
                    onChange={(e) => setEvalWeight(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {/* Linked Competencies Button */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-indigo-950">Codes Référentiels FWB</div>
                  <div className="text-[11px] text-indigo-700">
                    {evalLinkedIds.length} compétence(s) rattachée(s)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompetencyPickerOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Sélectionner
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Créer l’évaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Bulletin Report Card Modal */}
      {selectedBulletinStudentId && studentForBulletin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Bulletin Pédagogique FWB
                </span>
                <h2 className="text-xl font-bold mt-0.5">
                  {studentForBulletin.firstName} {studentForBulletin.lastName}
                </h2>
                <p className="text-xs text-slate-400">{activeClass?.name} • Année scolaire 2025-2026</p>
              </div>

              <button
                onClick={() => setSelectedBulletinStudentId(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Bulletin Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Summary Stats Card */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-slate-500 font-medium">Moyenne Générale</div>
                  <div className="text-xl font-black text-indigo-700 mt-1">
                    {calculateStudentOverallStats(studentForBulletin.id).percentage || '-'}%
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-slate-500 font-medium">Évaluations passées</div>
                  <div className="text-xl font-black text-slate-800 mt-1">
                    {calculateStudentOverallStats(studentForBulletin.id).count}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-slate-500 font-medium">Statut présence</div>
                  <div className="text-xl font-black text-emerald-700 mt-1 uppercase text-sm">
                    {studentForBulletin.currentAttendance || 'Présent'}
                  </div>
                </div>
              </div>

              {/* Detailed Marks by Domain */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                  Détail par Discipline & Compétences
                </h4>

                <div className="space-y-2">
                  {evaluations.map((evalItem) => {
                    const grade = evalItem.grades[studentForBulletin.id];
                    const percentage =
                      grade !== null && grade !== undefined
                        ? Math.round((grade / evalItem.maxScore) * 100)
                        : null;

                    return (
                      <div
                        key={evalItem.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{evalItem.title}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                              {evalItem.domain}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{evalItem.date}</div>
                        </div>

                        <div className="text-right">
                          {grade !== null && grade !== undefined ? (
                            <div className="font-black text-sm text-slate-900">
                              {grade} / {evalItem.maxScore}{' '}
                              <span className="text-xs font-semibold text-indigo-600">
                                ({percentage}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Non noté / Absent</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Teacher Overall Remark */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
                <div className="font-bold text-indigo-950 uppercase text-[10px]">
                  Appréciation de l'Enseignant(e) Titulaire
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  {studentForBulletin.pedagogicalNotes ||
                    'Élève impliqué(e) dans les apprentissages du Tronc Commun. Poursuivre les efforts réguliers.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer le bulletin</span>
              </button>
              <button
                onClick={() => setSelectedBulletinStudentId(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Competency Picker Sub-Modal for Evaluation */}
      <CompetencyPickerModal
        isOpen={isCompetencyPickerOpen}
        onClose={() => setIsCompetencyPickerOpen(false)}
        selectedIds={evalLinkedIds}
        onToggleId={(id) =>
          setEvalLinkedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
          )
        }
        defaultDomain={evalDomain}
      />
    </div>
  );
};
