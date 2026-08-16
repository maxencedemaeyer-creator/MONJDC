import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Info,
  Users,
  Check,
  FileText,
  AlertCircle,
  School,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Student, ReasonableAdjustmentType } from '../../types';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClassId: string;
}

interface ParsedStudentRow {
  id: string;
  selected: boolean;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F' | 'X';
  birthDate: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  specialNeeds: ReasonableAdjustmentType[];
  specialNeedsNotes: string;
  pedagogicalNotes: string;
  hasWarning?: boolean;
  warningMessage?: string;
}

const KNOWN_ADJUSTMENTS: ReasonableAdjustmentType[] = [
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

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  onClose,
  targetClassId,
}) => {
  const { classes, addMultipleStudents } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([targetClassId]);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsed' | 'importing' | 'done'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetClass = classes.find((c) => c.id === targetClassId);

  if (!isOpen) return null;

  const normalizeDate = (raw: any): string => {
    if (!raw) return '2016-01-01';
    if (typeof raw === 'number') {
      // Excel serial date to JS Date
      const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    const str = String(raw).trim();
    // Match DD/MM/YYYY or DD-MM-YYYY
    const matchFR = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (matchFR) {
      const day = matchFR[1].padStart(2, '0');
      const month = matchFR[2].padStart(2, '0');
      const year = matchFR[3];
      return `${year}-${month}-${day}`;
    }
    // Match YYYY-MM-DD
    const matchISO = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (matchISO) {
      const year = matchISO[1];
      const month = matchISO[2].padStart(2, '0');
      const day = matchISO[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return str || '2016-01-01';
  };

  const normalizeGender = (raw: any): 'M' | 'F' | 'X' => {
    if (!raw) return 'M';
    const s = String(raw).trim().toUpperCase();
    if (s.startsWith('F') || s === 'FILLE' || s === 'FEMME' || s === 'FEMININ') return 'F';
    if (s.startsWith('M') || s === 'GARCON' || s === 'GARÇON' || s === 'HOMME' || s === 'MASCULIN') return 'M';
    return 'X';
  };

  const detectAdjustments = (raw: any): { needs: ReasonableAdjustmentType[]; notes: string } => {
    if (!raw) return { needs: [], notes: '' };
    const str = String(raw).trim();
    if (!str) return { needs: [], notes: '' };

    const detected: ReasonableAdjustmentType[] = [];
    const lower = str.toLowerCase();

    if (lower.includes('dyslex') || lower.includes('dysorth')) {
      detected.push('Dyslexie / Dysorthographie');
    }
    if (lower.includes('dyscalc')) {
      detected.push('Dyscalculie');
    }
    if (lower.includes('dysprax')) {
      detected.push('Dyspraxie');
    }
    if (lower.includes('tda') || lower.includes('adhd') || lower.includes('hyperact') || lower.includes('attention')) {
      detected.push('TDA/H (Attention & Hyperactivité)');
    }
    if (lower.includes('hpi') || lower.includes('haut potentiel') || lower.includes('precoc') || lower.includes('précoce')) {
      detected.push('Haut Potentiel (HPI)');
    }
    if (lower.includes('autis') || lower.includes('tsa') || lower.includes('asperger')) {
      detected.push('Troubles du spectre de l’autisme (TSA)');
    }
    if (lower.includes('visu') || lower.includes('audit') || lower.includes('vue') || lower.includes('ouie')) {
      detected.push('Aménagement visuel / auditif');
    }
    if (lower.includes('pai') || lower.includes('allerg') || lower.includes('diabet') || lower.includes('médical')) {
      detected.push('Protocole d’Accueil Individualisé (PAI)');
    }

    if (detected.length === 0 && str.length > 2 && str.toLowerCase() !== 'non' && str.toLowerCase() !== 'aucun') {
      detected.push('Autre aménagement raisonnable');
    }

    return {
      needs: detected,
      notes: str,
    };
  };

  const handleFileProcess = (file: File) => {
    setErrorMessage(null);
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (!json || json.length === 0) {
          setErrorMessage('Le fichier sélectionné est vide ou ne contient aucune ligne de données.');
          setIsProcessing(false);
          return;
        }

        const rows: ParsedStudentRow[] = [];

        json.forEach((rawRow, idx) => {
          // Flexible key searching
          const keys = Object.keys(rawRow);
          const findVal = (keywords: string[]) => {
            for (const key of keys) {
              const cleaned = key.trim().toLowerCase();
              if (keywords.some((kw) => cleaned.includes(kw))) {
                return rawRow[key];
              }
            }
            return '';
          };

          const rawLastName = findVal(['nom', 'last', 'family']) || rawRow['Nom'] || '';
          const rawFirstName = findVal(['prénom', 'prenom', 'first']) || rawRow['Prénom'] || '';
          const rawBirthDate = findVal(['naissance', 'birth', 'date']) || rawRow['Date de naissance'] || '';
          const rawGender = findVal(['genre', 'sexe', 'gender']) || rawRow['Genre'] || '';
          const rawNeeds = findVal(['aménagement', 'amenagement', 'besoin', 'pap', 'pai', 'trouble']) || '';
          const rawGuardian = findVal(['parent', 'tuteur', 'responsable']) || '';
          const rawPhone = findVal(['téléphone', 'telephone', 'tel', 'phone', 'gsm']) || '';
          const rawEmail = findVal(['email', 'mail', 'courriel']) || '';
          const rawNotes = findVal(['note', 'observation', 'remarque']) || '';

          const firstName = String(rawFirstName).trim();
          const lastName = String(rawLastName).trim();

          // Skip completely empty rows
          if (!firstName && !lastName) return;

          let hasWarning = false;
          let warningMessage = '';
          if (!lastName) {
            hasWarning = true;
            warningMessage = 'Nom manquant';
          } else if (!firstName) {
            hasWarning = true;
            warningMessage = 'Prénom manquant';
          }

          const { needs, notes } = detectAdjustments(rawNeeds);

          rows.push({
            id: `import-${idx}-${Date.now()}`,
            selected: !hasWarning,
            firstName: firstName || 'Inconnu',
            lastName: lastName || 'Inconnu',
            gender: normalizeGender(rawGender),
            birthDate: normalizeDate(rawBirthDate),
            guardianName: String(rawGuardian).trim() || 'Responsable légal',
            guardianPhone: String(rawPhone).trim() || '+32 470 00 00 00',
            guardianEmail: String(rawEmail).trim() || 'parents@ecole.be',
            specialNeeds: needs,
            specialNeedsNotes: notes,
            pedagogicalNotes: String(rawNotes).trim(),
            hasWarning,
            warningMessage,
          });
        });

        if (rows.length === 0) {
          setErrorMessage('Aucun élève valide n’a pu être détecté. Vérifiez la présence des colonnes "Nom" et "Prénom".');
          setIsProcessing(false);
          return;
        }

        setParsedRows(rows);
        setImportStatus('parsed');
      } catch (err: any) {
        console.error('Erreur lecture fichier Excel/CSV:', err);
        setErrorMessage(`Erreur lors de la lecture du fichier : ${err.message || 'Format invalide'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Impossible de lire le fichier sélectionné.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleToggleSelectAll = (check: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: check })));
  };

  const handleToggleRow = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleToggleClassAssignment = (cId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(cId)
        ? prev.length > 1
          ? prev.filter((id) => id !== cId)
          : prev
        : [...prev, cId]
    );
  };

  const handleConfirmImport = async () => {
    const selectedRows = parsedRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      alert('Veuillez cocher au moins un élève à importer.');
      return;
    }

    if (selectedClassIds.length === 0) {
      alert('Veuillez sélectionner au moins une classe de destination.');
      return;
    }

    try {
      setImportStatus('importing');

      const newStudentsPayload: Omit<Student, 'id'>[] = selectedRows.map((r) => ({
        classId: selectedClassIds[0] || targetClassId,
        classIds: selectedClassIds,
        firstName: r.firstName,
        lastName: r.lastName,
        gender: r.gender,
        birthDate: r.birthDate,
        guardianName: r.guardianName,
        guardianPhone: r.guardianPhone,
        guardianEmail: r.guardianEmail,
        specialNeeds: r.specialNeeds,
        specialNeedsNotes: r.specialNeedsNotes,
        pedagogicalNotes: r.pedagogicalNotes,
        currentAttendance: 'present' as const,
      }));

      await addMultipleStudents(newStudentsPayload);
      setImportStatus('done');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Erreur import:', err);
      setErrorMessage(err.message || 'Échec lors de l’enregistrement Firestore.');
      setImportStatus('parsed');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Nom: 'Dubois',
        Prénom: 'Lucas',
        'Date de naissance': '2016-04-12',
        Genre: 'M',
        'Aménagements raisonnables': 'Dyslexie / Dysorthographie (Temps 1/3)',
        'Nom des parents': 'Claire & Marc Dubois',
        'Téléphone contact': '+32 472 11 22 33',
        Email: 'famille.dubois@gmail.com',
        'Observations pédagogiques': 'Très motivé en sciences et ateliers de calcul.',
      },
      {
        Nom: 'Peeters',
        Prénom: 'Emma',
        'Date de naissance': '2016-07-25',
        Genre: 'F',
        'Aménagements raisonnables': 'TDA/H (Attention & Hyperactivité)',
        'Nom des parents': 'Sophie Peeters',
        'Téléphone contact': '+32 475 44 55 66',
        Email: 'sophie.peeters@skynet.be',
        'Observations pédagogiques': 'Créative en rédaction, consignes visuelles requises.',
      },
      {
        Nom: 'Vermeulen',
        Prénom: 'Noah',
        'Date de naissance': '2016-01-19',
        Genre: 'M',
        'Aménagements raisonnables': '',
        'Nom des parents': 'Julien Vermeulen',
        'Téléphone contact': '+32 486 77 88 99',
        Email: 'j.vermeulen@proximus.be',
        'Observations pédagogiques': 'Élève autonome et tuteur en mathématiques.',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modele_Eleves_MonJDC');
    XLSX.writeFile(wb, 'modele_import_eleves_monjdc.xlsx');
  };

  const selectedCount = parsedRows.filter((r) => r.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Importer des élèves (Excel .xlsx / CSV)
              </h2>
              <p className="text-xs text-slate-300">
                Classe cible : <strong className="text-white">{targetClass?.name}</strong> • Détection automatique des colonnes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Erreur d'importation</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {importStatus === 'done' ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Importation réussie !
              </h3>
              <p className="text-slate-600 text-xs max-w-sm">
                Les élèves ont été enregistrés avec succès dans Firestore et associés à la classe {targetClass?.name}.
              </p>
            </div>
          ) : importStatus === 'idle' ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    Glissez-déposez votre fichier Excel ou CSV ici
                  </p>
                  <p className="text-xs text-slate-500">
                    Formats acceptés : <span className="font-mono font-semibold">.xlsx</span>, <span className="font-mono font-semibold">.xls</span>, <span className="font-mono font-semibold">.csv</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs"
                >
                  Parcourir mes fichiers
                </button>
              </div>

              {/* Instructions & Template Download */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <span>Colonnes recommandées pour l'import</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Nom, Prénom, Date de naissance, Genre (M/F), Aménagements raisonnables, Téléphone, Email parents.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-indigo-700 font-semibold rounded-xl border border-indigo-200 shadow-2xs transition shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger un modèle Excel</span>
                </button>
              </div>
            </div>
          ) : (
            /* Preview parsed rows table */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    Fichier : <span className="font-mono text-indigo-700">{fileName}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {parsedRows.length} lignes détectées
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Tout cocher
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 underline"
                  >
                    Tout décocher
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setImportStatus('idle');
                      setFileName('');
                    }}
                    className="ml-2 px-2.5 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-semibold"
                  >
                    Changer de fichier
                  </button>
                </div>
              </div>

              {/* Multi-classes destination selector */}
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-[11px]">
                  <School className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Assignation aux classes (Multi-classes possible) :</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => {
                    const isChecked = selectedClassIds.includes(cls.id);
                    const isTarget = cls.id === targetClassId;
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
                        {isTarget && <span className="text-[10px] opacity-80">(actuelle)</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Parsed Students Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2.5 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCount === parsedRows.length && parsedRows.length > 0}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                      </th>
                      <th className="p-2.5">Élève</th>
                      <th className="p-2.5">Genre</th>
                      <th className="p-2.5">Date Naissance</th>
                      <th className="p-2.5">Aménagements Détectés</th>
                      <th className="p-2.5">Contact Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => handleToggleRow(row.id)}
                        className={`hover:bg-slate-50 cursor-pointer transition ${
                          row.selected ? 'bg-indigo-50/30' : 'opacity-60'
                        }`}
                      >
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => handleToggleRow(row.id)}
                            className="rounded text-indigo-600"
                          />
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{row.firstName} {row.lastName}</span>
                            {row.hasWarning && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-mono">
                                {row.warningMessage}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.gender === 'F'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {row.gender === 'F' ? 'Fille' : row.gender === 'M' ? 'Garçon' : 'Autre'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          {row.birthDate}
                        </td>
                        <td className="p-2.5">
                          {row.specialNeeds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.specialNeeds.map((n, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-800 font-semibold rounded border border-amber-200"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Aucun</span>
                          )}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600">
                          <div className="font-medium text-slate-800">{row.guardianName}</div>
                          <div className="text-[10px] text-slate-400">{row.guardianPhone}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

          {importStatus === 'parsed' && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedCount === 0 || isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Confirmer l'import ({selectedCount} élève{selectedCount > 1 ? 's' : ''})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
