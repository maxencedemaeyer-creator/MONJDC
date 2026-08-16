import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Mail,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, ReasonableAdjustmentType } from '../../types';

export const StudentsView: React.FC = () => {
  const {
    students,
    activeClass,
    activeClassId,
    addStudent,
    updateStudent,
    deleteStudent,
    setStudentAttendance,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterNeeds, setFilterNeeds] = useState<string>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for new/edit student
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'X'>('M');
  const [birthDate, setBirthDate] = useState('2016-01-01');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState<ReasonableAdjustmentType[]>([]);
  const [specialNeedsNotes, setSpecialNeedsNotes] = useState('');
  const [pedagogicalNotes, setPedagogicalNotes] = useState('');

  const allSpecialNeedsTypes: ReasonableAdjustmentType[] = [
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

  const filteredStudents = students.filter((stud) => {
    const matchesClass = !activeClassId || stud.classId === activeClassId;
    const fullName = `${stud.firstName} ${stud.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (stud.specialNeedsNotes && stud.specialNeedsNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesNeeds =
      filterNeeds === 'ALL'
        ? true
        : filterNeeds === 'HAS_NEEDS'
        ? stud.specialNeeds && stud.specialNeeds.length > 0
        : stud.specialNeeds && stud.specialNeeds.includes(filterNeeds as ReasonableAdjustmentType);

    return matchesClass && matchesSearch && matchesNeeds;
  });

  const handleOpenAddModal = () => {
    setSelectedStudent(null);
    setFirstName('');
    setLastName('');
    setGender('M');
    setBirthDate('2016-01-01');
    setGuardianName('');
    setGuardianPhone('');
    setGuardianEmail('');
    setSpecialNeeds([]);
    setSpecialNeedsNotes('');
    setPedagogicalNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (stud: Student) => {
    setSelectedStudent(stud);
    setFirstName(stud.firstName);
    setLastName(stud.lastName);
    setGender(stud.gender);
    setBirthDate(stud.birthDate);
    setGuardianName(stud.guardianName);
    setGuardianPhone(stud.guardianPhone);
    setGuardianEmail(stud.guardianEmail);
    setSpecialNeeds(stud.specialNeeds || []);
    setSpecialNeedsNotes(stud.specialNeedsNotes || '');
    setPedagogicalNotes(stud.pedagogicalNotes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('Veuillez saisir le nom et le prénom de l’élève.');
      return;
    }

    const payload = {
      classId: activeClassId,
      firstName,
      lastName,
      gender,
      birthDate,
      guardianName: guardianName || 'Responsable légal',
      guardianPhone: guardianPhone || '+32 470 00 00 00',
      guardianEmail: guardianEmail || 'parents@ecole.be',
      specialNeeds,
      specialNeedsNotes,
      pedagogicalNotes,
      currentAttendance: 'present' as const,
    };

    if (selectedStudent) {
      updateStudent(selectedStudent.id, payload);
    } else {
      addStudent(payload);
    }
    setIsAddModalOpen(false);
  };

  const handleToggleNeed = (need: ReasonableAdjustmentType) => {
    setSpecialNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleViewDetail = (stud: Student) => {
    setSelectedStudent(stud);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Registre des Élèves & Aménagements Raisonnables
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeClass?.name} ({filteredStudents.length} élèves)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestion du groupe classe, protocoles PAI/PAP, suivi individualisé et coordonnées des parents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un élève</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par prénom, nom ou aménagement..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <span className="font-semibold text-slate-600 whitespace-nowrap">Besoins / PAP :</span>
          <select
            value={filterNeeds}
            onChange={(e) => setFilterNeeds(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden w-full sm:w-auto"
          >
            <option value="ALL">Tous les élèves</option>
            <option value="HAS_NEEDS">Élèves avec aménagements ({students.filter((s) => s.specialNeeds?.length > 0).length})</option>
            {allSpecialNeedsTypes.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((stud) => {
          const hasNeeds = stud.specialNeeds && stud.specialNeeds.length > 0;
          const isPresent = stud.currentAttendance === 'present' || !stud.currentAttendance;
          const isAbsent = stud.currentAttendance === 'absent';
          const isLate = stud.currentAttendance === 'late';

          return (
            <div
              key={stud.id}
              onClick={() => handleViewDetail(stud)}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition p-4 flex flex-col justify-between space-y-3 cursor-pointer group"
            >
              <div className="space-y-2.5">
                {/* Header with avatar & name */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                        stud.gender === 'F' ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                    >
                      {stud.firstName[0]}
                      {stud.lastName[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {stud.firstName} {stud.lastName}
                      </h3>
                      <p className="text-[11px] text-slate-500">Né(e) le {stud.birthDate}</p>
                    </div>
                  </div>

                  {/* Attendance status toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = isPresent ? 'absent' : isAbsent ? 'late' : 'present';
                      setStudentAttendance(stud.id, next);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                      isPresent
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isAbsent
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                    title="Cliquer pour changer le statut de présence"
                  >
                    {isPresent ? 'Présent' : isAbsent ? 'Absent' : 'En retard'}
                  </button>
                </div>

                {/* Special Needs Badges */}
                {hasNeeds && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900 uppercase">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>Aménagements Raisonnables</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {stud.specialNeeds.map((need, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium bg-white text-amber-800 px-1.5 py-0.2 rounded border border-amber-200"
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                    {stud.specialNeedsNotes && (
                      <p className="text-[11px] text-slate-600 italic line-clamp-2">
                        {stud.specialNeedsNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Pedagogical Observations preview */}
                {stud.pedagogicalNotes && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    📝 {stud.pedagogicalNotes}
                  </p>
                )}
              </div>

              {/* Footer contact & actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px]">{stud.guardianPhone}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(stud);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Supprimer l'élève ${stud.firstName} ${stud.lastName} ?`)) {
                        deleteStudent(stud.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Detail Modal (Fiche Individuelle) */}
      {isDetailModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md ${
                    selectedStudent.gender === 'F' ? 'bg-rose-500' : 'bg-blue-600'
                  }`}
                >
                  {selectedStudent.firstName[0]}
                  {selectedStudent.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {activeClass?.name} • Né(e) le {selectedStudent.birthDate}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Parents Contact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Coordonnées Parents / Tuteurs
                </div>
                <div className="font-semibold text-slate-900">{selectedStudent.guardianName}</div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStudent.guardianPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStudent.guardianEmail}</span>
                </div>
              </div>

              {/* Aménagements Raisonnables */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="font-bold text-amber-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Aménagements Raisonnables & Besoins (FWB)
                </div>

                {selectedStudent.specialNeeds && selectedStudent.specialNeeds.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {selectedStudent.specialNeeds.map((need, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white text-amber-800 font-semibold rounded border border-amber-200"
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                    {selectedStudent.specialNeedsNotes && (
                      <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                        {selectedStudent.specialNeedsNotes}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 italic">Aucun aménagement particulier enregistré.</p>
                )}
              </div>

              {/* Pedagogical Observations */}
              <div className="space-y-1">
                <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                  Observations Pédagogiques & Suivi
                </div>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedStudent.pedagogicalNotes || 'Aucune observation saisie pour le moment.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEditModal(selectedStudent);
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Modifier la fiche élève
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <h3 className="text-base font-bold text-slate-900">
              {selectedStudent ? 'Modifier la fiche élève' : 'Inscrire un nouvel élève'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Lucas"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Dubois"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Genre</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'X')}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="X">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Parents Contact */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-700 uppercase text-[10px]">
                  Contacts Responsables
                </div>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Nom des parents (ex: Claire et Marc Dubois)"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="Téléphone (+32...)"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="Email parents"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Aménagements selection */}
              <div className="space-y-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <div className="font-bold text-amber-900 uppercase text-[10px]">
                  Aménagements Raisonnables (Cocher les cas applicables)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {allSpecialNeedsTypes.map((need) => {
                    const isChecked = specialNeeds.includes(need);
                    return (
                      <label
                        key={need}
                        className="flex items-center gap-2 p-1.5 bg-white rounded border border-amber-100 cursor-pointer select-none text-[11px]"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleNeed(need)}
                          className="rounded text-indigo-600"
                        />
                        <span className="truncate">{need}</span>
                      </label>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  value={specialNeedsNotes}
                  onChange={(e) => setSpecialNeedsNotes(e.target.value)}
                  placeholder="Précisions sur les adaptations (ex: police OpenDyslexic, temps 1/3, tuteur)..."
                  className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs"
                />
              </div>

              {/* Pedagogical Observations */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">
                  Observations Pédagogiques & Points forts
                </label>
                <textarea
                  rows={2}
                  value={pedagogicalNotes}
                  onChange={(e) => setPedagogicalNotes(e.target.value)}
                  placeholder="Notes sur la participation, le comportement ou les progrès..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
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
                  {selectedStudent ? 'Enregistrer' : 'Inscrire l’élève'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
