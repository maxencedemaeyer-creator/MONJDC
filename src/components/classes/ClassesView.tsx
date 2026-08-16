import React, { useState } from 'react';
import {
  School,
  Plus,
  Users,
  Search,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassGroup, ClassLevel } from '../../types';
import { ClassDetailView } from './ClassDetailView';

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#059669', // Emerald
  '#d97706', // Amber
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#475569', // Slate
];

const LEVELS: ClassLevel[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Maternelle', 'Autre'];

export const ClassesView: React.FC = () => {
  const {
    classes,
    students,
    activeClassId,
    setActiveClassId,
    addClass,
    updateClass,
    deleteClass,
    profile,
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Modal State for Add / Edit Class
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    level: ClassLevel;
    cycle: string;
    description: string;
    academicYear: string;
    room: string;
    color: string;
  }>({
    name: '',
    level: 'P3',
    cycle: 'Cycle 3 (P3-P4)',
    description: '',
    academicYear: profile.schoolYear || '2026-2027',
    room: 'Local 204',
    color: '#4f46e5',
  });

  // If a class is chosen to inspect, render ClassDetailView
  const currentSelectedClass = classes.find((c) => c.id === selectedClassId);
  if (selectedClassId && currentSelectedClass) {
    return (
      <ClassDetailView
        classGroup={currentSelectedClass}
        onBack={() => setSelectedClassId(null)}
      />
    );
  }

  // Filter classes
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cls.room && cls.room.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLevel = levelFilter === 'all' || cls.level === levelFilter;
    const matchesYear = yearFilter === 'all' || cls.academicYear === yearFilter;

    return matchesSearch && matchesLevel && matchesYear;
  });

  // Calculate global metrics
  const totalStudentsCount = students.length;
  const totalPAPCount = students.filter((s) => s.specialNeeds && s.specialNeeds.length > 0).length;

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      level: 'P3',
      cycle: 'Cycle 3 (P3-P4)',
      description: '',
      academicYear: profile.schoolYear || '2026-2027',
      room: '',
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditModal = (cls: ClassGroup) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      level: (cls.level as ClassLevel) || 'P3',
      cycle: cls.cycle,
      description: cls.description || '',
      academicYear: cls.academicYear || profile.schoolYear || '2026-2027',
      room: cls.room || '',
      color: cls.color || '#4f46e5',
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Veuillez renseigner le nom de la classe.');
      return;
    }

    // Auto deduce cycle if not specified
    let cycle = formData.cycle;
    if (!cycle) {
      if (formData.level === 'P1' || formData.level === 'P2') cycle = 'Cycle 2 (P1-P2)';
      else if (formData.level === 'P3' || formData.level === 'P4') cycle = 'Cycle 3 (P3-P4)';
      else if (formData.level === 'P5' || formData.level === 'P6') cycle = 'Cycle 4 (P5-P6)';
      else if (formData.level === 'Maternelle') cycle = 'Maternelle';
      else cycle = 'Cycle Primaire';
    }

    if (editingClass) {
      await updateClass(editingClass.id, {
        name: formData.name.trim(),
        level: formData.level,
        cycle,
        description: formData.description.trim(),
        academicYear: formData.academicYear.trim(),
        room: formData.room.trim(),
        color: formData.color,
      });
    } else {
      await addClass({
        name: formData.name.trim(),
        level: formData.level,
        cycle,
        description: formData.description.trim(),
        academicYear: formData.academicYear.trim(),
        room: formData.room.trim(),
        color: formData.color,
        studentCount: 0,
      });
    }

    setIsClassModalOpen(false);
  };

  const handleDeleteClass = async (cls: ClassGroup) => {
    const studentsInClass = students.filter((s) =>
      (s.classIds || [s.classId]).includes(cls.id)
    );

    const message =
      studentsInClass.length > 0
        ? `Attention : ${studentsInClass.length} élève(s) sont inscrit(s) dans la classe "${cls.name}". Supprimer cette classe ?`
        : `Êtes-vous sûr de vouloir supprimer la classe "${cls.name}" ?`;

    if (confirm(message)) {
      await deleteClass(cls.id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-950/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
              <School className="w-3.5 h-3.5" />
              <span>Organisation Pédagogique FWB</span>
              <span className="text-white/40">•</span>
              <span>Année {profile.schoolYear || '2026-2027'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gestion des Classes & Groupes
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Créez vos classes (P1 à P6), gérez les listes d'élèves, encodez les aménagements raisonnables (PAP) et importez directement vos listes via Excel (.xlsx) ou CSV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajouter une classe</span>
            </button>
          </div>
        </div>

        {/* Global summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-white">{classes.length}</div>
              <div className="text-[11px] text-slate-400">Classes enregistrées</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-white">{totalStudentsCount}</div>
              <div className="text-[11px] text-slate-400">Élèves au total</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/5 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-white">{totalPAPCount}</div>
              <div className="text-[11px] text-slate-400">Aménagements (PAP / DYS)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une classe, un local, une description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tous les niveaux</option>
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                Niveau {lvl}
              </option>
            ))}
          </select>

          {/* Academic Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Toutes les années scolaires</option>
            <option value="2026-2027">2026-2027</option>
            <option value="2025-2026">2025-2026</option>
          </select>
        </div>
      </div>

      {/* Class Cards Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <School className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Aucune classe trouvée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Créez votre première classe pour commencer à organiser vos élèves et planifier vos séances de cours.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            + Créer une classe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const isActive = activeClassId === cls.id;
            const classStudents = students.filter((s) =>
              (s.classIds || [s.classId]).includes(cls.id)
            );
            const withNeedsCount = classStudents.filter(
              (s) => s.specialNeeds && s.specialNeeds.length > 0
            ).length;

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-3xl border transition duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isActive ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200'
                }`}
              >
                {/* Colored Top Bar */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: cls.color || '#4f46e5' }}
                />

                <div className="p-5 space-y-4 flex-1">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cls.color || '#4f46e5' }}
                        />
                        <h3 className="font-extrabold text-slate-900 text-lg">{cls.name}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {cls.level ? `Niveau ${cls.level}` : cls.cycle}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {cls.academicYear || '2026-2027'}
                        </span>
                        {cls.room && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {cls.room}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                        title="Modifier les infos de la classe"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Supprimer la classe"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                    {cls.description || 'Classe d’enseignement primaire en Fédération Wallonie-Bruxelles.'}
                  </p>

                  {/* Metrics Badge Group */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{classStudents.length} élèves</div>
                        <div className="text-[10px] text-slate-400">Inscrits</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="font-bold text-amber-900">{withNeedsCount} PAP / DYS</div>
                        <div className="text-[10px] text-amber-700/80">Aménagements</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isActive ? (
                    <button
                      onClick={() => setActiveClassId(cls.id)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition"
                    >
                      Définir active
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}

                  <button
                    onClick={() => setSelectedClassId(cls.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <span>Gérer les élèves ({classStudents.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Ajouter / Modifier une classe */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    {editingClass ? 'Modifier la classe' : 'Ajouter une nouvelle classe'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Configuration de la classe & année scolaire
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4 text-xs">
              {/* Nom de la classe */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nom de la classe *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: 3e Primaire A, P3-B, Classe d'accueil..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Niveau & Année scolaire */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Niveau / Année (P1 à P6) *</label>
                  <select
                    value={formData.level}
                    onChange={(e) => {
                      const lvl = e.target.value as ClassLevel;
                      let cycle = 'Cycle 3 (P3-P4)';
                      if (lvl === 'P1' || lvl === 'P2') cycle = 'Cycle 2 (P1-P2)';
                      else if (lvl === 'P3' || lvl === 'P4') cycle = 'Cycle 3 (P3-P4)';
                      else if (lvl === 'P5' || lvl === 'P6') cycle = 'Cycle 4 (P5-P6)';
                      else if (lvl === 'Maternelle') cycle = 'Maternelle';
                      setFormData({ ...formData, level: lvl, cycle });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Niveau {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Année scolaire *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="Ex: 2026-2027"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Cycle & Local */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cycle FWB</label>
                  <input
                    type="text"
                    value={formData.cycle}
                    onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                    placeholder="Ex: Cycle 3 (P3-P4)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Local / Salle de classe</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Ex: Local 204, Bâtiment B..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description / Remarques</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Classe titulaire principale, co-enseignement le vendredi matin..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              {/* Identification Color */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700">Couleur d'identification</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-7 h-7 rounded-xl transition flex items-center justify-center ${
                        formData.color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formData.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {editingClass ? 'Enregistrer les modifications' : 'Créer la classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
