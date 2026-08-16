import React, { useState } from 'react';
import {
  BookMarked,
  Search,
  Plus,
  Filter,
  Trash2,
  Edit3,
  Download,
  BookOpen,
  Check,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReferentielItem, SubjectDomain, CompetencyCategory, EducationCycle } from '../../types';
import { getDomainColor, getCategoryBadge } from '../../lib/utils';

export const ReferentielsView: React.FC = () => {
  const { referentiels, addReferentiel, deleteReferentiel, updateReferentiel } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<string>('P3-P4');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New item form states
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCycle, setNewCycle] = useState<EducationCycle>('P3-P4');
  const [newDomain, setNewDomain] = useState<SubjectDomain>('Français');
  const [newCategory, setNewCategory] = useState<CompetencyCategory>('SF');
  const [newSource, setNewSource] = useState('Programme Établissement');

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

  const cycles: EducationCycle[] = ['Maternelle', 'P1-P2', 'P3-P4', 'P5-P6', 'Secondaire (S1-S3)'];

  const filteredReferentiels = referentiels.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCycle = selectedCycle === 'ALL' || item.cycle === selectedCycle;
    const matchesDomain = selectedDomain === 'ALL' || item.domain === selectedDomain;
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    return matchesSearch && matchesCycle && matchesDomain && matchesCategory;
  });

  const handleCreateReferentiel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Veuillez saisir un intitulé pour la compétence.');
      return;
    }

    const autoCode =
      newCode.trim() ||
      `${newDomain.slice(0, 3).toUpperCase()}-${newCycle.replace(/\s+/g, '')}-${newCategory}.${Math.floor(
        Math.random() * 90 + 10
      )}`;

    addReferentiel({
      code: autoCode,
      title: newTitle,
      description: newDescription,
      cycle: newCycle,
      domain: newDomain,
      category: newCategory,
      officialSource: newSource,
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewCode('');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(referentiels, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `referentiels-fwb-segec-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-600" />
              Référentiels & Compétences Belges (FWB / SeGEC)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Tronc Commun
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Banque officielle des Savoirs (S), Savoir-Faire (SF) et Compétences (C) pour l'enseignement fondamental et secondaire.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une compétence</span>
          </button>
        </div>
      </div>

      {/* Cycle Quick Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Cycle :
        </span>
        <button
          onClick={() => setSelectedCycle('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCycle === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tous ({referentiels.length})
        </button>
        {cycles.map((c) => {
          const count = referentiels.filter((r) => r.cycle === c).length;
          return (
            <button
              key={c}
              onClick={() => setSelectedCycle(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCycle === c
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Domain / Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par code (ex: MATH-P34-S.01), verbe d'action, notion clé..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Domain selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Discipline :</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Toutes les disciplines</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Category selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Type de code :</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Savoirs, SF & Compétences</option>
              <option value="S">S - Savoirs (Connaissances déclaratives)</option>
              <option value="SF">SF - Savoir-Faire (Procédures & Méthodes)</option>
              <option value="C">C - Compétences (Tâches complexes)</option>
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-500 font-medium">
            Affichage de <strong>{filteredReferentiels.length}</strong> standard(s)
          </div>
        </div>
      </div>

      {/* Competencies Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredReferentiels.map((item) => {
          const cat = getCategoryBadge(item.category);
          const domColor = getDomainColor(item.domain);

          return (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded font-mono ${cat.bg} ${cat.text}`}>
                      {item.code}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${domColor.badgeBg}`}>
                      {item.domain}
                    </span>
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {item.cycle}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                    {cat.full}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>

                {item.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{item.officialSource || 'FWB Tronc Commun'}</span>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer la compétence ${item.code} ?`)) {
                      deleteReferentiel(item.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Competency Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">
              Ajouter une compétence / standard personnalisé
            </h3>

            <form onSubmit={handleCreateReferentiel} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Cycle</label>
                  <select
                    value={newCycle}
                    onChange={(e) => setNewCycle(e.target.value as EducationCycle)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {cycles.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CompetencyCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="S">S - Savoir</option>
                    <option value="SF">SF - Savoir-Faire</option>
                    <option value="C">C - Compétence</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Code FWB (optionnel)</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Ex: FR-P34-SF.08"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Discipline</label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value as SubjectDomain)}
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
                <label className="font-semibold text-slate-600 block mb-1">Intitulé officiel *</label>
                <textarea
                  rows={2}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Identifier le sujet et le verbe dans une phrase simple..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Précisions pédagogiques / Critères</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Préciser les modalités d'évaluation ou d'observation..."
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
                  Ajouter au référentiel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
