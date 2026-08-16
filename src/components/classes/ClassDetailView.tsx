import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Plus,
  FileSpreadsheet,
  ArrowRightLeft,
  Search,
  School,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Edit2,
  Trash2,
  UserCheck,
  Eye,
  Check,
  X,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, ClassGroup, ReasonableAdjustmentType } from '../../types';
import { StudentImportModal } from './StudentImportModal';
import { StudentReassignModal } from './StudentReassignModal';

interface ClassDetailViewProps {
  classGroup: ClassGroup;
  onBack: () => void;
}

const REASONABLE_ADJUSTMENTS: ReasonableAdjustmentType[] = [
  'Dyslexie / Dysorthographie',
  'Dyscalculie',
  'Dyspraxie',
  'TDA/H (Attention & Hyperactivité)',
  'Haut Potentiel (HPI)',
  'Troubles du spectre de l’autisme (TSA)',
  'Aménagement visuel / auditif',
  'Protocole d’Accueil Individualisé (PAI)',
  'Autre aménagement raisonnable',
];

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({ classGroup, onBack }) => {
  const {
    students,
    classes,
    addStudent,
    updateStudent,
    removeStudentFromClass,
    deleteStudent,
    setStudentAttendance,
    activeClassId,
    setActiveClassId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAdjustment, setFilterAdjustment] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Form State for manual student add/edit
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    gender: 'M' | 'F' | 'X';
    birthDate: string;
    classIds: string[];
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    specialNeeds: ReasonableAdjustmentType[];
    specialNeedsNotes: string;
    pedagogicalNotes: string;
  }>({
    firstName: '',
    lastName: '',
    gender: 'M',
    birthDate: '2016-01-01',
    classIds: [classGroup.id],
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    specialNeeds: [],
    specialNeedsNotes: '',
    pedagogicalNotes: '',
  });

  // Filter students belonging to this class
  const classStudents = students.filter((s) => {
    const assigned = s.classIds && s.classIds.length > 0 ? s.classIds : [s.classId];
    return assigned.includes(classGroup.id);
  });

  // Filtered view by search & criteria
  const filteredStudents = classStudents.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    const matchesGender = filterGender === 'all' || s.gender === filterGender;

    let matchesAdjustment = true;
    if (filterAdjustment === 'with_needs') {
      matchesAdjustment = !!s.specialNeeds && s.specialNeeds.length > 0;
    } else if (filterAdjustment !== 'all') {
      matchesAdjustment = !!s.specialNeeds && s.specialNeeds.includes(filterAdjustment as any);
    }

    return matchesSearch && matchesGender && matchesAdjustment;
  });

  // Attendance counts
  const presentCount = classStudents.filter((s) => s.currentAttendance === 'present' || !s.currentAttendance).length;
  const absentCount = classStudents.filter((s) => s.currentAttendance === 'absent').length;
  const lateCount = classStudents.filter((s) => s.currentAttendance === 'late').length;
  const withNeedsCount = classStudents.filter((s) => s.specialNeeds && s.specialNeeds.length > 0).length;

  const handleOpenNewStudent = () => {
    setEditingStudent(null);
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'M',
      birthDate: '2016-01-01',
      classIds: [classGroup.id],
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      specialNeeds: [],
      specialNeedsNotes: '',
      pedagogicalNotes: '',
    });
    setIsStudentFormOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    const assigned = student.classIds && student.classIds.length > 0 ? student.classIds : [student.classId];
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender || 'M',
      birthDate: student.birthDate || '2016-01-01',
      classIds: assigned,
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      guardianEmail: student.guardianEmail || '',
      specialNeeds: student.specialNeeds || [],
      specialNeedsNotes: student.specialNeedsNotes || '',
      pedagogicalNotes: student.pedagogicalNotes || '',
    });
    setIsStudentFormOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Veuillez renseigner le nom et le prénom.');
      return;
    }

    const payload: Omit<Student, 'id'> = {
      classId: formData.classIds[0] || classGroup.id,
      classIds: formData.classIds.length > 0 ? formData.classIds : [classGroup.id],
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      gender: formData.gender,
      birthDate: formData.birthDate,
      guardianName: formData.guardianName.trim() || 'Parent / Tuteur',
      guardianPhone: formData.guardianPhone.trim(),
      guardianEmail: formData.guardianEmail.trim(),
      specialNeeds: formData.specialNeeds,
      specialNeedsNotes: formData.specialNeedsNotes.trim(),
      pedagogicalNotes: formData.pedagogicalNotes.trim(),
      currentAttendance: editingStudent?.currentAttendance || 'present',
    };

    if (editingStudent) {
      await updateStudent(editingStudent.id, payload);
    } else {
      await addStudent(payload);
    }

    setIsStudentFormOpen(false);
  };

  const handleToggleAdjustment = (type: ReasonableAdjustmentType) => {
    setFormData((prev) => {
      const exists = prev.specialNeeds.includes(type);
      return {
        ...prev,
        specialNeeds: exists
          ? prev.specialNeeds.filter((t) => t !== type)
          : [...prev.specialNeeds, type],
      };
    });
  };

  const handleToggleClassAssignment = (cId: string) => {
    setFormData((prev) => {
      const exists = prev.classIds.includes(cId);
      if (exists) {
        // keep at least 1 class
        return prev.classIds.length > 1
          ? { ...prev, classIds: prev.classIds.filter((id) => id !== cId) }
          : prev;
      } else {
        return { ...prev, classIds: [...prev.classIds, cId] };
      }
    });
  };

  const handleRemoveStudent = async (student: Student) => {
    const assigned = student.classIds && student.classIds.length > 0 ? student.classIds : [student.classId];
    if (assigned.length > 1) {
      if (
        confirm(
          `Cet élève est inscrit dans plusieurs classes. Voulez-vous le retirer uniquement de "${classGroup.name}" ?`
        )
      ) {
        await removeStudentFromClass(student.id, classGroup.id);
      }
    } else {
      if (
        confirm(
          `Supprimer définitivement l'élève ${student.firstName} ${student.lastName} du système ?`
        )
      ) {
        await deleteStudent(student.id);
      }
    }
  };

  const isActiveClass = activeClassId === classGroup.id;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Class Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Toutes les classes</span>
          </button>

          <div className="flex items-center gap-2">
            {!isActiveClass ? (
              <button
                onClick={() => setActiveClassId(classGroup.id)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition"
              >
                Définir comme classe active
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                Classe active actuelle
              </span>
            )}
          </div>
        </div>

        {/* Class Banner Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2 border-t border-slate-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: classGroup.color || '#6366f1' }}
              />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {classGroup.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                {classGroup.level ? `Niveau ${classGroup.level}` : classGroup.cycle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Année {classGroup.academicYear || '2026-2027'}
              </span>
              {classGroup.room && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {classGroup.room}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 max-w-2xl">
              {classGroup.description ||
                `Gestion pédagogique, liste des élèves inscrits et suivi des aménagements raisonnables FWB.`}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center min-w-[80px]">
              <div className="text-xl font-black text-slate-900">{classStudents.length}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Élèves</div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center min-w-[80px]">
              <div className="text-xl font-black text-emerald-700">{presentCount}</div>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase">Présents</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center min-w-[80px]">
              <div className="text-xl font-black text-amber-700">{withNeedsCount}</div>
              <div className="text-[10px] font-semibold text-amber-600 uppercase">PAP / DYS</div>
            </div>
          </div>
        </div>

        {/* 3 Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleOpenNewStudent}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ajouter un élève (Manuel)</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>📥 Importer Excel (.xlsx) / CSV</span>
          </button>

          <button
            onClick={() => setIsReassignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition"
          >
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <span>🔄 Transférer / Assigner existants</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un élève par nom, prénom..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Aménagements Filter */}
          <select
            value={filterAdjustment}
            onChange={(e) => setFilterAdjustment(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tous les aménagements</option>
            <option value="with_needs">Avec aménagements (PAP)</option>
            {REASONABLE_ADJUSTMENTS.map((adj) => (
              <option key={adj} value={adj}>
                {adj}
              </option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tous les genres</option>
            <option value="M">Garçons</option>
            <option value="F">Filles</option>
          </select>
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Aucun élève trouvé dans {classGroup.name}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ajoutez manuellement votre premier élève ou importez la liste complète depuis un fichier Excel (.xlsx) ou CSV.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={handleOpenNewStudent}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              + Ajouter un élève
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-white text-slate-700 border border-slate-300 font-bold text-xs rounded-xl"
            >
              Importer un fichier Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((stud) => {
            const isPresent = stud.currentAttendance === 'present' || !stud.currentAttendance;
            const isAbsent = stud.currentAttendance === 'absent';
            const isLate = stud.currentAttendance === 'late';

            const assignedClassList = classes.filter((c) =>
              (stud.classIds || [stud.classId]).includes(c.id)
            );
            const otherClasses = assignedClassList.filter((c) => c.id !== classGroup.id);

            return (
              <div
                key={stud.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-4 space-y-3.5 flex flex-col justify-between"
              >
                {/* Student Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          stud.gender === 'F'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {stud.firstName[0]}
                        {stud.lastName[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {stud.firstName} {stud.lastName}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>Né(e) le {stud.birthDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Toggle */}
                    <button
                      onClick={() => {
                        const next = isPresent ? 'absent' : isAbsent ? 'late' : 'present';
                        setStudentAttendance(stud.id, next);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition flex items-center gap-1 ${
                        isPresent
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : isAbsent
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title="Cliquer pour basculer la présence"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPresent ? 'bg-emerald-500' : isAbsent ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{isPresent ? 'Présent' : isAbsent ? 'Absent' : 'En retard'}</span>
                    </button>
                  </div>

                  {/* Multi-classes Tags if enrolled in multiple */}
                  {otherClasses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Aussi en :</span>
                      {otherClasses.map((c) => (
                        <span
                          key={c.id}
                          className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Special Needs Badges */}
                  {stud.specialNeeds && stud.specialNeeds.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {stud.specialNeeds.map((need, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            {need}
                          </span>
                        ))}
                      </div>
                      {stud.specialNeedsNotes && (
                        <p className="text-[11px] text-slate-600 italic line-clamp-1 bg-amber-50/40 p-1.5 rounded-lg">
                          "{stud.specialNeedsNotes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Parent Contact */}
                  {(stud.guardianPhone || stud.guardianEmail || stud.guardianName) && (
                    <div className="pt-1 text-[11px] text-slate-600 space-y-0.5">
                      <div className="font-semibold text-slate-800">{stud.guardianName}</div>
                      <div className="flex flex-wrap gap-2 text-slate-500 text-[10px]">
                        {stud.guardianPhone && (
                          <a
                            href={`tel:${stud.guardianPhone}`}
                            className="flex items-center gap-1 text-indigo-600 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{stud.guardianPhone}</span>
                          </a>
                        )}
                        {stud.guardianEmail && (
                          <a
                            href={`mailto:${stud.guardianEmail}`}
                            className="flex items-center gap-1 text-indigo-600 hover:underline"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{stud.guardianEmail}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <button
                    onClick={() => setViewingStudent(stud)}
                    className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-indigo-600 font-semibold rounded-lg hover:bg-slate-100 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Fiche</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditStudent(stud)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveStudent(stud)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Retirer de la classe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Manual Add / Edit Student */}
      {isStudentFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col max-h-[90vh]">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    {editingStudent ? "Modifier la fiche de l'élève" : 'Nouvel élève'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Classe : <strong className="text-white">{classGroup.name}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsStudentFormOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Name & First Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ex: Dubois"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ex: Lucas"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Gender & BirthDate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Genre</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'X' })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="M">Garçon (M)</option>
                    <option value="F">Fille (F)</option>
                    <option value="X">Autre (X)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date de naissance</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Multi-classes checkboxes */}
              <div className="space-y-1.5 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Classes associées (Multi-classes possible)</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {classes.map((cls) => {
                    const isChecked = formData.classIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        onClick={() => handleToggleClassAssignment(cls.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="hidden"
                        />
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: isChecked ? '#fff' : cls.color || '#6366f1' }}
                        />
                        <span>{cls.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contacts parents */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="font-bold text-slate-800">Contacts Responsables légaux</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="Nom des parents"
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    placeholder="Téléphone / GSM"
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="email"
                    value={formData.guardianEmail}
                    onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                    placeholder="Email de contact"
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Aménagements raisonnables FWB */}
              <div className="space-y-2 p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Aménagements raisonnables FWB (Décret / PAP)</span>
                  </label>
                  <span className="text-[10px] text-amber-700 font-semibold">
                    {formData.specialNeeds.length} sélectionné(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {REASONABLE_ADJUSTMENTS.map((adj) => {
                    const isChecked = formData.specialNeeds.includes(adj);
                    return (
                      <label
                        key={adj}
                        onClick={() => handleToggleAdjustment(adj)}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-amber-100/80 border-amber-300 text-amber-900 font-semibold shadow-2xs'
                            : 'bg-white border-amber-100 text-slate-700 hover:bg-amber-50/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-amber-600"
                        />
                        <span className="text-[11px] leading-tight">{adj}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="font-semibold text-amber-900 text-[11px]">
                    Détails du PAP / Adaptations en classe
                  </label>
                  <textarea
                    value={formData.specialNeedsNotes}
                    onChange={(e) => setFormData({ ...formData, specialNeedsNotes: e.target.value })}
                    placeholder="Ex: Tiers-temps lors des bilans, police Arial 14, surlignage des consignes, écouteurs anti-bruit..."
                    rows={2}
                    className="w-full mt-1 p-2 bg-white border border-amber-200 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Observations pédagogiques */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Observations pédagogiques</label>
                <textarea
                  value={formData.pedagogicalNotes}
                  onChange={(e) => setFormData({ ...formData, pedagogicalNotes: e.target.value })}
                  placeholder="Remarques sur le comportement, l'autonomie, points forts ou axes de progrès..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              {/* Submit footer */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStudentFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {editingStudent ? 'Enregistrer les modifications' : "Ajouter l'élève"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Student Full Dossier */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col">
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                    viewingStudent.gender === 'F'
                      ? 'bg-rose-500 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {viewingStudent.firstName[0]}
                  {viewingStudent.lastName[0]}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    {viewingStudent.firstName} {viewingStudent.lastName}
                  </h2>
                  <p className="text-xs text-slate-300">
                    Fiche individuelle d'élève • MonJDC
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* General info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Date de naissance</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{viewingStudent.birthDate}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Genre</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {viewingStudent.gender === 'F' ? 'Fille' : viewingStudent.gender === 'M' ? 'Garçon' : 'Autre'}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Classes inscrites</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {classes
                      .filter((c) =>
                        (viewingStudent.classIds || [viewingStudent.classId]).includes(c.id)
                      )
                      .map((c) => (
                        <span
                          key={c.id}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-semibold"
                        >
                          {c.name}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Aménagements */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Aménagements & Besoins spécifiques</span>
                </div>
                {viewingStudent.specialNeeds && viewingStudent.specialNeeds.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {viewingStudent.specialNeeds.map((n, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-amber-900 border border-amber-200 shadow-2xs"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                    {viewingStudent.specialNeedsNotes && (
                      <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-amber-200 text-[11px]">
                        {viewingStudent.specialNeedsNotes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Aucun aménagement particulier enregistré.</p>
                )}
              </div>

              {/* Parents */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Contacts Responsables</span>
                <div className="font-bold text-slate-900">{viewingStudent.guardianName}</div>
                {viewingStudent.guardianPhone && (
                  <div className="text-slate-600">📞 {viewingStudent.guardianPhone}</div>
                )}
                {viewingStudent.guardianEmail && (
                  <div className="text-slate-600">✉️ {viewingStudent.guardianEmail}</div>
                )}
              </div>

              {/* Observations */}
              {viewingStudent.pedagogicalNotes && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Observations de l'enseignant</span>
                  <p className="text-slate-700 whitespace-pre-wrap">{viewingStudent.pedagogicalNotes}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const toEdit = viewingStudent;
                  setViewingStudent(null);
                  handleOpenEditStudent(toEdit);
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Modifier la fiche
              </button>
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-2 bg-white text-slate-700 font-semibold text-xs rounded-xl border border-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetClassId={classGroup.id}
      />

      {/* Reassign Modal */}
      <StudentReassignModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        targetClassId={classGroup.id}
      />
    </div>
  );
};
