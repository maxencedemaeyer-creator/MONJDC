import React, { useState } from 'react';
import {
  Users,
  ArrowRightLeft,
  PlusCircle,
  CheckCircle2,
  X,
  Search,
  School,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';

interface StudentReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClassId: string;
}

export const StudentReassignModal: React.FC<StudentReassignModalProps> = ({
  isOpen,
  onClose,
  targetClassId,
}) => {
  const { students, classes, assignStudentsToClass } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceClassFilter, setSourceClassFilter] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'add' | 'transfer'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetClass = classes.find((c) => c.id === targetClassId);

  // Eligible students: students not already in targetClass (or students from other classes)
  const eligibleStudents = students.filter((s) => {
    const assignedClasses = s.classIds && s.classIds.length > 0 ? s.classIds : [s.classId];
    const isAlreadyInTarget = assignedClasses.includes(targetClassId);

    // If searching, check match
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    // Filter by source class
    const matchesSourceClass =
      sourceClassFilter === 'all' || assignedClasses.includes(sourceClassFilter);

    return matchesSearch && matchesSourceClass && (!isAlreadyInTarget || mode === 'transfer');
  });

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (check: boolean) => {
    if (check) {
      setSelectedStudentIds(eligibleStudents.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Veuillez sélectionner au moins un élève.');
      return;
    }

    try {
      setIsSubmitting(true);
      await assignStudentsToClass(selectedStudentIds, targetClassId, mode);
      onClose();
    } catch (err) {
      console.error('Erreur assignation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Assignation & Transfert d'Élèves
              </h2>
              <p className="text-xs text-slate-300">
                Classe de destination : <strong className="text-white">{targetClass?.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setMode('add')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                mode === 'add'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  mode === 'add' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Multi-classes (Ajouter)</div>
                <p className="text-[11px] text-slate-500">
                  L'élève reste dans sa classe d'origine et est également rattaché à {targetClass?.name}.
                </p>
              </div>
            </div>

            <div
              onClick={() => setMode('transfer')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                mode === 'transfer'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  mode === 'transfer' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900">Transfert direct</div>
                <p className="text-[11px] text-slate-500">
                  L'élève quitte sa classe actuelle et est déplacé vers {targetClass?.name}.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Source Class Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou prénom..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>

            <select
              value={sourceClassFilter}
              onChange={(e) => setSourceClassFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Toutes les classes sources</option>
              {classes
                .filter((c) => c.id !== targetClassId)
                .map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level || cls.cycle})
                  </option>
                ))}
            </select>
          </div>

          {/* Student selection list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>{eligibleStudents.length} élève(s) disponible(s)</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Tout cocher
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="font-semibold text-slate-600 hover:text-slate-800"
                >
                  Tout décocher
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100">
              {eligibleStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <Users className="w-6 h-6 mx-auto opacity-40 mb-1" />
                  <p className="font-semibold">Aucun élève trouvé</p>
                  <p className="text-[11px]">Modifiez vos critères de recherche ou filtre.</p>
                </div>
              ) : (
                eligibleStudents.map((stud) => {
                  const isSelected = selectedStudentIds.includes(stud.id);
                  const assignedClasses = classes.filter((c) =>
                    (stud.classIds || [stud.classId]).includes(c.id)
                  );

                  return (
                    <div
                      key={stud.id}
                      onClick={() => handleToggleStudent(stud.id)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                        isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleStudent(stud.id)}
                          className="rounded text-indigo-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            {stud.firstName} {stud.lastName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>Né(e) le {stud.birthDate}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Classes actuelles :{' '}
                              {assignedClasses.map((c) => c.name).join(', ') || 'Aucune'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {stud.specialNeeds && stud.specialNeeds.length > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                            PAP ({stud.specialNeeds.length})
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            stud.gender === 'F'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {stud.gender === 'F' ? 'F' : 'M'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={selectedStudentIds.length === 0 || isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {mode === 'add' ? 'Assigner' : 'Transférer'} {selectedStudentIds.length} élève
              {selectedStudentIds.length > 1 ? 's' : ''}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
