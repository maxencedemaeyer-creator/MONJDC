export type EducationCycle = 'Maternelle' | 'P1-P2' | 'P3-P4' | 'P5-P6' | 'Secondaire (S1-S3)';

export type SubjectDomain =
  | 'Français'
  | 'Mathématiques'
  | 'Éveil & Sciences'
  | 'Sciences Humaines'
  | 'Formation Artistique'
  | 'FMTTN & Numérique'
  | 'Éducation Physique'
  | 'Langues Modernes'
  | 'Citoyenneté & Philosophie';

export type CompetencyCategory = 'S' | 'SF' | 'C'; // S = Savoir, SF = Savoir-Faire, C = Compétence

export interface ReferentielItem {
  id: string;
  code: string; // e.g. "FR-P34-SF.01" or "MATH-P34-S.12"
  title: string;
  description?: string;
  cycle: EducationCycle;
  domain: SubjectDomain;
  category: CompetencyCategory; // S, SF, C
  officialSource?: string; // "FWB Troncs Communs" | "SeGEC Programme Intégré"
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  schoolName: string;
  schoolYear: string;
  role: string;
  selectedCycle: EducationCycle;
  activeClassId: string;
}

export interface ClassGroup {
  id: string;
  name: string; // e.g., "3e Primaire A"
  cycle: EducationCycle;
  room: string;
  academicYear: string;
  studentCount: number;
  color: string;
}

export type ReasonableAdjustmentType =
  | 'Dyslexie / Dysorthographie'
  | 'Dyscalculie'
  | 'Dyspraxie'
  | 'TDA/H (Attention & Hyperactivité)'
  | 'Haut Potentiel (HPI)'
  | 'Troubles du spectre de l’autisme (TSA)'
  | 'Aménagement visuel / auditif'
  | 'Protocole d’Accueil Individualisé (PAI)'
  | 'Autre aménagement raisonnable';

export interface Student {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F' | 'X';
  birthDate: string;
  avatarUrl?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  specialNeeds: ReasonableAdjustmentType[];
  specialNeedsNotes?: string;
  pedagogicalNotes?: string;
  currentAttendance?: 'present' | 'absent' | 'late' | 'excused';
}

export interface TimeSlotConfig {
  periodNumber: number; // 1 to 8
  label: string; // "P1", "P2", etc.
  startTime: string; // "08:30"
  endTime: string; // "09:20"
  isBreak?: boolean;
  breakLabel?: string; // "Récréation du matin", "Pause midi"
}

export type DayOfWeek = 1 | 2 | 3 | 4 | 5; // 1: Lundi, 2: Mardi, 3: Mercredi, 4: Jeudi, 5: Vendredi
export type WeekType = 'A' | 'B' | 'ALL';

export interface DefaultSlotAssignment {
  id: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  weekType: WeekType;
  classId: string;
  domain: SubjectDomain;
  subjectTitle: string;
  room?: string;
  color: string;
}

export interface LessonPhase {
  id: string;
  title: string; // "Mise en situation", "Recherche", "Institutionnalisation", "Exercisation", "Synthèse"
  durationMinutes: number;
  teacherAction: string;
  studentAction: string;
}

export interface JdcEntry {
  id: string;
  userId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  weekType: WeekType;
  domain: SubjectDomain;
  subjectTitle: string;
  lessonTitle: string;
  objectives: string;
  materials: string[];
  phases: LessonPhase[];
  differentiation: string; // Aménagements / Remédiation
  homework: string; // Devoirs & leçons
  linkedReferentielIds: string[]; // references to ReferentielItem.id
  status: 'planned' | 'completed' | 'postponed' | 'cancelled';
  notesForInspection?: string;
  color: string;
}

export type EvaluationType = 'formatif' | 'sommatif' | 'diagnostique';

export interface Evaluation {
  id: string;
  classId: string;
  title: string;
  domain: SubjectDomain;
  date: string; // YYYY-MM-DD
  type: EvaluationType;
  maxScore: number;
  linkedReferentielIds: string[];
  weight: number; // coefficient (e.g., 1, 2)
  grades: Record<string, number | null>; // studentId -> score
  comments: Record<string, string>; // studentId -> comment
}

export interface DailyNote {
  id: string;
  date: string;
  title: string;
  content: string;
  isImportant: boolean;
  category: 'rappel' | 'reunion' | 'remarque' | 'materiel';
}
