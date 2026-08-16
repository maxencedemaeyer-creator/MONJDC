import React, { useState } from 'react';
import { Search, X, Check, Filter, BookOpen, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReferentielItem, SubjectDomain, CompetencyCategory, EducationCycle } from '../../types';
import { getCategoryBadge, getDomainColor } from '../../lib/utils';

interface CompetencyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onToggleId: (id: string) => void;
  defaultDomain?: SubjectDomain;
}

export const CompetencyPickerModal: React.FC<CompetencyPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIds,
  onToggleId,
  defaultDomain,
}) => {
  const { referentiels } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>(defaultDomain || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCycle, setSelectedCycle] = useState<string>('ALL');

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

  const filteredReferentiels = referentiels.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDomain = selectedDomain === 'ALL' || item.domain === selectedDomain;
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesCycle = selectedCycle === 'ALL' || item.cycle === selectedCycle;

    return matchesSearch && matchesDomain && matchesCategory && matchesCycle;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Référentiel FWB / SeGEC
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Associez les codes de Savoirs (S), Savoir-Faire (SF) et Compétences (C) officiels
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par code (ex: FR-P34-SF.01) ou mot-clé (ex: fraction, verbe, vivant)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Pill filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Domain */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Tous les domaines ({referentiels.length})</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Category: S / SF / C */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Toutes catégories (S, SF, C)</option>
              <option value="S">S - Savoirs (Connaissances)</option>
              <option value="SF">SF - Savoir-Faire (Méthodes)</option>
              <option value="C">C - Compétences (Tâches globales)</option>
            </select>

            {/* Cycle */}
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Tous les cycles</option>
              <option value="Maternelle">Maternelle</option>
              <option value="P1-P2">P1-P2 (Cycle 2)</option>
              <option value="P3-P4">P3-P4 (Cycle 3)</option>
              <option value="P5-P6">P5-P6 (Cycle 4)</option>
              <option value="Secondaire (S1-S3)">Secondaire S1-S3</option>
            </select>
          </div>
        </div>

        {/* Selected count chips */}
        <div className="px-6 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-indigo-900">
            {selectedIds.length} compétence(s) sélectionnée(s)
          </span>
          <span className="text-slate-500">{filteredReferentiels.length} résultat(s) trouvé(s)</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
          {filteredReferentiels.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-sm text-slate-600">Aucun référentiel trouvé</p>
              <p className="text-xs mt-1">Modifiez vos filtres ou ajoutez une compétence personnalisée.</p>
            </div>
          ) : (
            filteredReferentiels.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const catBadge = getCategoryBadge(item.category);
              const domColor = getDomainColor(item.domain);

              return (
                <div
                  key={item.id}
                  onClick={() => onToggleId(item.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${catBadge.bg} ${catBadge.text}`}>
                        {item.code}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${domColor.badgeBg}`}>
                        {item.domain}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.cycle}
                      </span>
                      {item.officialSource && (
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">
                          {item.officialSource}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
          >
            Fermer
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
          >
            Valider la sélection ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
