import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {
  TeacherProfile,
  ClassGroup,
  TimeSlotConfig,
  DefaultSlotAssignment,
  ReferentielItem,
  Student,
  JdcEntry,
  Evaluation,
  DailyNote,
  WeekType,
  DayOfWeek,
} from '../types';
import { INITIAL_REFERENTIELS } from '../data/referentielsSeGEC';
import {
  INITIAL_TEACHER_PROFILE,
  INITIAL_CLASSES,
  INITIAL_TIME_SLOTS,
  INITIAL_DEFAULT_SLOTS,
  INITIAL_STUDENTS,
  getSampleJdcEntries,
  INITIAL_EVALUATIONS,
  INITIAL_DAILY_NOTES,
} from '../data/initialData';
import { db, isFirebaseConfigured, currentProjectId, currentDatabaseId } from '../lib/firebase';
import { getWeekDates } from '../lib/utils';

export type NavigationTab =
  | 'dashboard'
  | 'schedule-config'
  | 'jdc'
  | 'referentiels'
  | 'students'
  | 'evaluations'
  | 'export';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
  docId?: string;
  timestamp: number;
}

interface AppContextType {
  // Navigation & View State
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeClassId: string;
  setActiveClassId: (id: string) => void;
  activeClass: ClassGroup | undefined;

  // Week selection
  currentReferenceDate: Date;
  activeWeekMondayStr: string;
  activeWeekDays: { dayOfWeek: number; dateStr: string; label: string }[];
  activeWeekType: WeekType;
  setActiveWeekType: (type: WeekType) => void;
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;

  // Data Collections
  profile: TeacherProfile;
  updateProfile: (profile: Partial<TeacherProfile>) => Promise<void>;
  classes: ClassGroup[];
  addClass: (cls: Omit<ClassGroup, 'id'>) => Promise<void>;
  updateClass: (id: string, cls: Partial<ClassGroup>) => Promise<void>;

  timeSlots: TimeSlotConfig[];
  updateTimeSlots: (slots: TimeSlotConfig[]) => void;
  defaultSlots: DefaultSlotAssignment[];
  addDefaultSlot: (slot: Omit<DefaultSlotAssignment, 'id'>) => Promise<void>;
  updateDefaultSlot: (id: string, slot: Partial<DefaultSlotAssignment>) => Promise<void>;
  deleteDefaultSlot: (id: string) => Promise<void>;

  referentiels: ReferentielItem[];
  addReferentiel: (item: Omit<ReferentielItem, 'id'>) => Promise<void>;
  updateReferentiel: (id: string, item: Partial<ReferentielItem>) => Promise<void>;
  deleteReferentiel: (id: string) => Promise<void>;

  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  setStudentAttendance: (id: string, status: Student['currentAttendance']) => Promise<void>;

  jdcEntries: JdcEntry[];
  addJdcEntry: (entry: Omit<JdcEntry, 'id'>) => Promise<JdcEntry>;
  updateJdcEntry: (id: string, entry: Partial<JdcEntry>) => Promise<void>;
  deleteJdcEntry: (id: string) => Promise<void>;
  duplicateJdcEntry: (id: string, targetDay: DayOfWeek, targetPeriod: number) => Promise<void>;
  moveJdcEntry: (id: string, targetDay: DayOfWeek, targetPeriod: number) => Promise<void>;
  populateWeekFromSchedule: () => Promise<void>;

  evaluations: Evaluation[];
  addEvaluation: (evalItem: Omit<Evaluation, 'id'>) => Promise<void>;
  updateEvaluation: (id: string, evalItem: Partial<Evaluation>) => Promise<void>;
  deleteEvaluation: (id: string) => Promise<void>;
  updateGrades: (evalId: string, grades: Record<string, number | null>, comments?: Record<string, string>) => Promise<void>;

  dailyNotes: DailyNote[];
  addDailyNote: (note: Omit<DailyNote, 'id'>) => Promise<void>;
  updateDailyNote: (id: string, note: Partial<DailyNote>) => Promise<void>;
  deleteDailyNote: (id: string) => Promise<void>;

  // Selected entry for detailed modal
  selectedLessonId: string | null;
  setSelectedLessonId: (id: string | null) => void;

  // Firebase status & Toasts
  isFirebaseCloud: boolean;
  firebaseProjectId: string;
  firestoreDatabaseId: string;
  isSyncing: boolean;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  resetAllToInitial: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CURRENT_USER_ID = 'teacher-01';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [currentReferenceDate, setCurrentReferenceDate] = useState<Date>(new Date());
  const [activeWeekType, setActiveWeekType] = useState<WeekType>('A');

  // Calculate Monday of reference date
  const activeWeekDays = getWeekDates(currentReferenceDate);
  const activeWeekMondayStr = activeWeekDays[0]?.dateStr || '';

  // Data states (synchronized via Firestore onSnapshot)
  const [profile, setProfile] = useState<TeacherProfile>(INITIAL_TEACHER_PROFILE);
  const [classes, setClasses] = useState<ClassGroup[]>(INITIAL_CLASSES);
  const [activeClassId, setActiveClassIdState] = useState<string>('class-3a');
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>(INITIAL_TIME_SLOTS);
  const [defaultSlots, setDefaultSlots] = useState<DefaultSlotAssignment[]>(INITIAL_DEFAULT_SLOTS);
  const [referentiels, setReferentiels] = useState<ReferentielItem[]>(INITIAL_REFERENTIELS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [jdcEntries, setJdcEntries] = useState<JdcEntry[]>(() => getSampleJdcEntries(activeWeekMondayStr));
  const [evaluations, setEvaluations] = useState<Evaluation[]>(INITIAL_EVALUATIONS);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>(INITIAL_DAILY_NOTES);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Firestore sync indicator & toasts
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, docId?: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, docId, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logFirestoreSuccess = useCallback((action: string, docId: string) => {
    console.log(`Donnée enregistrée sur Firestore avec succès :`, docId);
    addToast(`${action}`, docId, 'success');
  }, [addToast]);

  // Track if initial seeding happened during this session
  const isInitializedRef = useRef(false);

  // =========================================================================
  // Real-time Firestore Listeners (onSnapshot)
  // =========================================================================
  useEffect(() => {
    if (!db) return;

    // 1. JDC Entries Listener
    const unsubJdc = onSnapshot(
      collection(db, 'jdc_entries'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: JdcEntry[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as JdcEntry;
            items.push({ ...data, id: docSnap.id });
          });
          setJdcEntries(items);
        } else if (!isInitializedRef.current) {
          // Seed initial entries on first load if collection is empty
          seedInitialJdcEntries(activeWeekMondayStr);
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot jdc_entries notice:', error.message);
      }
    );

    // 2. Students Listener
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: Student[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Student;
            items.push({ ...data, id: docSnap.id });
          });
          // Sort alphabetically by lastName
          items.sort((a, b) => a.lastName.localeCompare(b.lastName));
          setStudents(items);
        } else if (!isInitializedRef.current) {
          seedInitialStudents();
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot students notice:', error.message);
      }
    );

    // 3. Evaluations Listener
    const unsubEvals = onSnapshot(
      collection(db, 'evaluations'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: Evaluation[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Evaluation;
            items.push({ ...data, id: docSnap.id });
          });
          setEvaluations(items);
        } else if (!isInitializedRef.current) {
          seedInitialEvaluations();
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot evaluations notice:', error.message);
      }
    );

    // 4. Schedule (Timetable) Listener
    const unsubSchedule = onSnapshot(
      collection(db, 'schedule'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: DefaultSlotAssignment[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as DefaultSlotAssignment;
            items.push({ ...data, id: docSnap.id });
          });
          setDefaultSlots(items);
        } else if (!isInitializedRef.current) {
          seedInitialSchedule();
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot schedule notice:', error.message);
      }
    );

    // 5. Daily Notes Listener
    const unsubNotes = onSnapshot(
      collection(db, 'notes'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: DailyNote[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as DailyNote;
            items.push({ ...data, id: docSnap.id });
          });
          setDailyNotes(items);
        } else if (!isInitializedRef.current) {
          seedInitialNotes();
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot notes notice:', error.message);
      }
    );

    // 6. Classes Listener
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: ClassGroup[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ClassGroup;
            items.push({ ...data, id: docSnap.id });
          });
          setClasses(items);
        } else if (!isInitializedRef.current) {
          seedInitialClasses();
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot classes notice:', error.message);
      }
    );

    // 7. Referentiels Listener
    const unsubReferentiels = onSnapshot(
      collection(db, 'referentiels'),
      (snapshot) => {
        if (!snapshot.empty) {
          const items: ReferentielItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as ReferentielItem;
            items.push({ ...data, id: docSnap.id });
          });
          setReferentiels(items);
        } else if (!isInitializedRef.current) {
          seedInitialReferentiels();
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot referentiels notice:', error.message);
      }
    );

    // 8. Teacher Profile Listener
    const unsubProfile = onSnapshot(
      doc(db, 'teacher_profile', CURRENT_USER_ID),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as TeacherProfile);
        } else if (!isInitializedRef.current) {
          setDoc(doc(db, 'teacher_profile', CURRENT_USER_ID), {
            ...INITIAL_TEACHER_PROFILE,
            userId: CURRENT_USER_ID,
            updatedAt: new Date().toISOString(),
          }).catch(console.error);
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot teacher_profile notice:', error.message);
      }
    );

    isInitializedRef.current = true;

    return () => {
      unsubJdc();
      unsubStudents();
      unsubEvals();
      unsubSchedule();
      unsubNotes();
      unsubClasses();
      unsubReferentiels();
      unsubProfile();
    };
  }, [activeWeekMondayStr]);

  // =========================================================================
  // Seeding Helpers for Initial Data directly into Firestore
  // =========================================================================
  const seedInitialJdcEntries = async (mondayStr: string) => {
    try {
      const sampleEntries = getSampleJdcEntries(mondayStr);
      const batch = writeBatch(db);
      sampleEntries.forEach((entry) => {
        const docRef = doc(db, 'jdc_entries', entry.id);
        batch.set(docRef, {
          ...entry,
          userId: CURRENT_USER_ID,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log("Donnée enregistrée sur Firestore avec succès :", `batch-initial-jdc (${sampleEntries.length} leçons)`);
    } catch (err) {
      console.error('Erreur initialisation Firestore JDC:', err);
    }
  };

  const seedInitialStudents = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_STUDENTS.forEach((student) => {
        const docRef = doc(db, 'students', student.id);
        batch.set(docRef, {
          ...student,
          userId: CURRENT_USER_ID,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log("Donnée enregistrée sur Firestore avec succès :", `batch-initial-students (${INITIAL_STUDENTS.length} élèves)`);
    } catch (err) {
      console.error('Erreur initialisation Firestore Students:', err);
    }
  };

  const seedInitialEvaluations = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_EVALUATIONS.forEach((evaluation) => {
        const docRef = doc(db, 'evaluations', evaluation.id);
        batch.set(docRef, {
          ...evaluation,
          userId: CURRENT_USER_ID,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log("Donnée enregistrée sur Firestore avec succès :", `batch-initial-evals (${INITIAL_EVALUATIONS.length} évaluations)`);
    } catch (err) {
      console.error('Erreur initialisation Firestore Evals:', err);
    }
  };

  const seedInitialSchedule = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_DEFAULT_SLOTS.forEach((slot) => {
        const docRef = doc(db, 'schedule', slot.id);
        batch.set(docRef, {
          ...slot,
          userId: CURRENT_USER_ID,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log("Donnée enregistrée sur Firestore avec succès :", `batch-initial-schedule (${INITIAL_DEFAULT_SLOTS.length} créneaux)`);
    } catch (err) {
      console.error('Erreur initialisation Firestore Schedule:', err);
    }
  };

  const seedInitialNotes = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_DAILY_NOTES.forEach((note) => {
        const docRef = doc(db, 'notes', note.id);
        batch.set(docRef, {
          ...note,
          userId: CURRENT_USER_ID,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log("Donnée enregistrée sur Firestore avec succès :", `batch-initial-notes (${INITIAL_DAILY_NOTES.length} notes)`);
    } catch (err) {
      console.error('Erreur initialisation Firestore Notes:', err);
    }
  };

  const seedInitialClasses = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_CLASSES.forEach((cls) => {
        const docRef = doc(db, 'classes', cls.id);
        batch.set(docRef, {
          ...cls,
          userId: CURRENT_USER_ID,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log("Donnée enregistrée sur Firestore avec succès :", `batch-initial-classes (${INITIAL_CLASSES.length} classes)`);
    } catch (err) {
      console.error('Erreur initialisation Firestore Classes:', err);
    }
  };

  const seedInitialReferentiels = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_REFERENTIELS.forEach((ref) => {
        const docRef = doc(db, 'referentiels', ref.id);
        batch.set(docRef, {
          ...ref,
          userId: CURRENT_USER_ID,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log("Donnée enregistrée sur Firestore avec succès :", `batch-initial-referentiels (${INITIAL_REFERENTIELS.length} compétences)`);
    } catch (err) {
      console.error('Erreur initialisation Firestore Referentiels:', err);
    }
  };

  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0];

  const setActiveClassId = (id: string) => {
    setActiveClassIdState(id);
    updateProfile({ activeClassId: id });
  };

  // Week navigation
  const goToNextWeek = () => {
    const next = new Date(currentReferenceDate);
    next.setDate(next.getDate() + 7);
    setCurrentReferenceDate(next);
    setActiveWeekType((prev) => (prev === 'A' ? 'B' : 'A'));
  };

  const goToPreviousWeek = () => {
    const prev = new Date(currentReferenceDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentReferenceDate(prev);
    setActiveWeekType((prev) => (prev === 'A' ? 'B' : 'A'));
  };

  const goToCurrentWeek = () => {
    setCurrentReferenceDate(new Date());
  };

  // =========================================================================
  // Profile Actions (Firestore Direct)
  // =========================================================================
  const updateProfile = async (updated: Partial<TeacherProfile>) => {
    try {
      setIsSyncing(true);
      const merged = { ...profile, ...updated, userId: CURRENT_USER_ID, updatedAt: new Date().toISOString() };
      setProfile(merged);
      await setDoc(doc(db, 'teacher_profile', CURRENT_USER_ID), merged, { merge: true });
      logFirestoreSuccess('Profil enseignant mis à jour', CURRENT_USER_ID);
    } catch (err) {
      console.error('Erreur updateProfile Firestore:', err);
      addToast('Erreur lors de la sauvegarde du profil', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // Class Actions (Firestore Direct)
  // =========================================================================
  const addClass = async (cls: Omit<ClassGroup, 'id'>) => {
    try {
      setIsSyncing(true);
      const docId = `class-${Date.now()}`;
      const payload: ClassGroup = {
        ...cls,
        id: docId,
      };
      await setDoc(doc(db, 'classes', docId), {
        ...payload,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Classe ${cls.name} créée`, docId);
      setActiveClassId(docId);
    } catch (err) {
      console.error('Erreur addClass Firestore:', err);
      addToast('Erreur création classe', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateClass = async (id: string, updated: Partial<ClassGroup>) => {
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'classes', id), {
        ...updated,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Classe mise à jour`, id);
    } catch (err) {
      console.error('Erreur updateClass Firestore:', err);
      addToast('Erreur mise à jour classe', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // Timetable Slot Actions (Firestore Direct: 'schedule')
  // =========================================================================
  const updateTimeSlots = (slots: TimeSlotConfig[]) => {
    setTimeSlots(slots);
  };

  const addDefaultSlot = async (slot: Omit<DefaultSlotAssignment, 'id'>) => {
    try {
      setIsSyncing(true);
      const docId = `slot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const payload: DefaultSlotAssignment = {
        ...slot,
        id: docId,
      };
      await setDoc(doc(db, 'schedule', docId), {
        ...payload,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Créneau ${slot.subjectTitle} ajouté à la grille`, docId);
    } catch (err) {
      console.error('Erreur addDefaultSlot Firestore:', err);
      addToast('Erreur ajout créneau', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateDefaultSlot = async (id: string, slot: Partial<DefaultSlotAssignment>) => {
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'schedule', id), {
        ...slot,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Créneau mis à jour`, id);
    } catch (err) {
      console.error('Erreur updateDefaultSlot Firestore:', err);
      addToast('Erreur mise à jour créneau', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteDefaultSlot = async (id: string) => {
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'schedule', id));
      logFirestoreSuccess(`Créneau supprimé de la grille`, id);
    } catch (err) {
      console.error('Erreur deleteDefaultSlot Firestore:', err);
      addToast('Erreur suppression créneau', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // Referentiel Actions (Firestore Direct: 'referentiels')
  // =========================================================================
  const addReferentiel = async (item: Omit<ReferentielItem, 'id'>) => {
    try {
      setIsSyncing(true);
      const docId = `ref-custom-${Date.now()}`;
      const payload: ReferentielItem = {
        ...item,
        id: docId,
      };
      await setDoc(doc(db, 'referentiels', docId), {
        ...payload,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Compétence ${item.code} enregistrée`, docId);
    } catch (err) {
      console.error('Erreur addReferentiel Firestore:', err);
      addToast('Erreur ajout compétence', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateReferentiel = async (id: string, item: Partial<ReferentielItem>) => {
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'referentiels', id), {
        ...item,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Compétence mise à jour`, id);
    } catch (err) {
      console.error('Erreur updateReferentiel Firestore:', err);
      addToast('Erreur mise à jour compétence', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteReferentiel = async (id: string) => {
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'referentiels', id));
      logFirestoreSuccess(`Compétence supprimée`, id);
    } catch (err) {
      console.error('Erreur deleteReferentiel Firestore:', err);
      addToast('Erreur suppression compétence', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // Student Actions (Firestore Direct: 'students')
  // =========================================================================
  const addStudent = async (student: Omit<Student, 'id'>) => {
    try {
      setIsSyncing(true);
      const docId = `stud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const payload: Student = {
        ...student,
        id: docId,
      };
      await setDoc(doc(db, 'students', docId), {
        ...payload,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Élève ${student.firstName} ${student.lastName} ajouté`, docId);

      // Increment class studentCount
      const targetClass = classes.find((c) => c.id === student.classId);
      if (targetClass) {
        await updateClass(targetClass.id, { studentCount: targetClass.studentCount + 1 });
      }
    } catch (err) {
      console.error('Erreur addStudent Firestore:', err);
      addToast('Erreur ajout élève', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateStudent = async (id: string, student: Partial<Student>) => {
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'students', id), {
        ...student,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Fiche élève mise à jour`, id);
    } catch (err) {
      console.error('Erreur updateStudent Firestore:', err);
      addToast('Erreur mise à jour élève', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setIsSyncing(true);
      const target = students.find((s) => s.id === id);
      await deleteDoc(doc(db, 'students', id));
      logFirestoreSuccess(`Élève supprimé`, id);

      if (target) {
        const targetClass = classes.find((c) => c.id === target.classId);
        if (targetClass) {
          await updateClass(targetClass.id, { studentCount: Math.max(0, targetClass.studentCount - 1) });
        }
      }
    } catch (err) {
      console.error('Erreur deleteStudent Firestore:', err);
      addToast('Erreur suppression élève', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const setStudentAttendance = async (id: string, status: Student['currentAttendance']) => {
    try {
      await updateDoc(doc(db, 'students', id), {
        currentAttendance: status,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Présence mise à jour`, id);
    } catch (err) {
      console.error('Erreur setStudentAttendance Firestore:', err);
      addToast('Erreur pointage présence', id, 'error');
    }
  };

  // =========================================================================
  // JDC Entry Actions (Firestore Direct: 'jdc_entries')
  // =========================================================================
  const addJdcEntry = async (entry: Omit<JdcEntry, 'id'>): Promise<JdcEntry> => {
    try {
      setIsSyncing(true);
      const docId = `jdc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const payload: JdcEntry = {
        ...entry,
        id: docId,
      };

      await setDoc(doc(db, 'jdc_entries', docId), {
        ...payload,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Séance "${entry.lessonTitle}" enregistrée`, docId);
      return payload;
    } catch (err) {
      console.error('Erreur addJdcEntry Firestore:', err);
      addToast('Erreur enregistrement leçon', undefined, 'error');
      const fallback: JdcEntry = { ...entry, id: `jdc-temp-${Date.now()}` };
      return fallback;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateJdcEntry = async (id: string, entry: Partial<JdcEntry>) => {
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'jdc_entries', id), {
        ...entry,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Séance mise à jour`, id);
    } catch (err) {
      console.error('Erreur updateJdcEntry Firestore:', err);
      addToast('Erreur mise à jour leçon', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteJdcEntry = async (id: string) => {
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'jdc_entries', id));
      logFirestoreSuccess(`Séance supprimée`, id);
    } catch (err) {
      console.error('Erreur deleteJdcEntry Firestore:', err);
      addToast('Erreur suppression séance', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const duplicateJdcEntry = async (id: string, targetDay: DayOfWeek, targetPeriod: number) => {
    const source = jdcEntries.find((e) => e.id === id);
    if (!source) return;
    const targetDayObj = activeWeekDays.find((d) => d.dayOfWeek === targetDay);
    if (!targetDayObj) return;

    try {
      setIsSyncing(true);
      const newDocId = `jdc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const duplicated: JdcEntry = {
        ...source,
        id: newDocId,
        date: targetDayObj.dateStr,
        dayOfWeek: targetDay,
        periodNumber: targetPeriod,
        lessonTitle: `${source.lessonTitle} (Copie)`,
        status: 'planned',
      };
      await setDoc(doc(db, 'jdc_entries', newDocId), {
        ...duplicated,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Séance dupliquée vers Période ${targetPeriod}`, newDocId);
    } catch (err) {
      console.error('Erreur duplicateJdcEntry Firestore:', err);
      addToast('Erreur duplication leçon', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const moveJdcEntry = async (id: string, targetDay: DayOfWeek, targetPeriod: number) => {
    const targetDayObj = activeWeekDays.find((d) => d.dayOfWeek === targetDay);
    if (!targetDayObj) return;

    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'jdc_entries', id), {
        date: targetDayObj.dateStr,
        dayOfWeek: targetDay,
        periodNumber: targetPeriod,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Séance déplacée vers le ${targetDayObj.label}`, id);
    } catch (err) {
      console.error('Erreur moveJdcEntry Firestore:', err);
      addToast('Erreur déplacement séance', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Populate week automatically from schedule slots directly with Firestore writeBatch
  const populateWeekFromSchedule = async () => {
    try {
      setIsSyncing(true);
      const batch = writeBatch(db);
      let count = 0;

      activeWeekDays.forEach((day) => {
        const slotsForDay = defaultSlots.filter(
          (s) =>
            s.dayOfWeek === day.dayOfWeek &&
            (s.weekType === 'ALL' || s.weekType === activeWeekType) &&
            (!activeClassId || s.classId === activeClassId)
        );

        slotsForDay.forEach((slot) => {
          const exists = jdcEntries.some(
            (e) => e.date === day.dateStr && e.periodNumber === slot.periodNumber && e.classId === slot.classId
          );
          if (!exists) {
            const newDocId = `jdc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            const newEntry: JdcEntry = {
              id: newDocId,
              userId: CURRENT_USER_ID,
              classId: slot.classId,
              date: day.dateStr,
              dayOfWeek: slot.dayOfWeek,
              periodNumber: slot.periodNumber,
              weekType: activeWeekType,
              domain: slot.domain,
              subjectTitle: slot.subjectTitle,
              lessonTitle: `Séance : ${slot.subjectTitle}`,
              objectives: `Objectifs d’apprentissage en ${slot.domain} selon le programme FWB/SeGEC.`,
              materials: ['Manuel de cours', 'Cahier de l’élève'],
              phases: [
                {
                  id: 'p1',
                  title: 'Mise en route & Rappel',
                  durationMinutes: 10,
                  teacherAction: 'Vérification des prérequis et lancement de la consigne.',
                  studentAction: 'Participation active et rappel des notions antérieures.',
                },
                {
                  id: 'p2',
                  title: 'Apprentissage & Pratique',
                  durationMinutes: 30,
                  teacherAction: 'Guidage des élèves et différenciation.',
                  studentAction: 'Recherche et exercices individuels/duo.',
                },
                {
                  id: 'p3',
                  title: 'Synthèse & Devoirs',
                  durationMinutes: 10,
                  teacherAction: 'Institutionnalisation et notation au JDC.',
                  studentAction: 'Copie de la synthèse et des devoirs.',
                },
              ],
              differentiation: 'Aide méthodologique pour les élèves à besoins spécifiques.',
              homework: '',
              linkedReferentielIds: [],
              status: 'planned',
              color: slot.color,
            };

            const docRef = doc(db, 'jdc_entries', newDocId);
            batch.set(docRef, {
              ...newEntry,
              updatedAt: new Date().toISOString(),
            });
            count++;
          }
        });
      });

      if (count > 0) {
        await batch.commit();
        logFirestoreSuccess(`Semainier complété (${count} séances créées)`, `batch-schedule-sync`);
      } else {
        addToast('Toutes les séances de la grille sont déjà créées pour cette semaine.', undefined, 'info');
      }
    } catch (err) {
      console.error('Erreur populateWeekFromSchedule Firestore:', err);
      addToast('Erreur génération semainier', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // Evaluation Actions (Firestore Direct: 'evaluations')
  // =========================================================================
  const addEvaluation = async (evalItem: Omit<Evaluation, 'id'>) => {
    try {
      setIsSyncing(true);
      const docId = `eval-${Date.now()}`;
      const payload: Evaluation = {
        ...evalItem,
        id: docId,
      };
      await setDoc(doc(db, 'evaluations', docId), {
        ...payload,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Évaluation "${evalItem.title}" enregistrée`, docId);
    } catch (err) {
      console.error('Erreur addEvaluation Firestore:', err);
      addToast('Erreur création évaluation', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateEvaluation = async (id: string, evalItem: Partial<Evaluation>) => {
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'evaluations', id), {
        ...evalItem,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Évaluation mise à jour`, id);
    } catch (err) {
      console.error('Erreur updateEvaluation Firestore:', err);
      addToast('Erreur mise à jour évaluation', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteEvaluation = async (id: string) => {
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'evaluations', id));
      logFirestoreSuccess(`Évaluation supprimée`, id);
    } catch (err) {
      console.error('Erreur deleteEvaluation Firestore:', err);
      addToast('Erreur suppression évaluation', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateGrades = async (
    evalId: string,
    grades: Record<string, number | null>,
    comments?: Record<string, string>
  ) => {
    try {
      setIsSyncing(true);
      const targetEval = evaluations.find((e) => e.id === evalId);
      const updatedGrades = { ...(targetEval?.grades || {}), ...grades };
      const updatedComments = comments ? { ...(targetEval?.comments || {}), ...comments } : targetEval?.comments || {};

      await updateDoc(doc(db, 'evaluations', evalId), {
        grades: updatedGrades,
        comments: updatedComments,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Notes et appréciations enregistrées`, evalId);
    } catch (err) {
      console.error('Erreur updateGrades Firestore:', err);
      addToast('Erreur enregistrement notes', evalId, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // Daily Notes Actions (Firestore Direct: 'notes')
  // =========================================================================
  const addDailyNote = async (note: Omit<DailyNote, 'id'>) => {
    try {
      setIsSyncing(true);
      const docId = `note-${Date.now()}`;
      const payload: DailyNote = {
        ...note,
        id: docId,
      };
      await setDoc(doc(db, 'notes', docId), {
        ...payload,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Note enregistrée`, docId);
    } catch (err) {
      console.error('Erreur addDailyNote Firestore:', err);
      addToast('Erreur création note', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateDailyNote = async (id: string, note: Partial<DailyNote>) => {
    try {
      setIsSyncing(true);
      await updateDoc(doc(db, 'notes', id), {
        ...note,
        userId: CURRENT_USER_ID,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Note mise à jour`, id);
    } catch (err) {
      console.error('Erreur updateDailyNote Firestore:', err);
      addToast('Erreur mise à jour note', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteDailyNote = async (id: string) => {
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'notes', id));
      logFirestoreSuccess(`Note supprimée`, id);
    } catch (err) {
      console.error('Erreur deleteDailyNote Firestore:', err);
      addToast('Erreur suppression note', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Re-seed all collections on demand
  const resetAllToInitial = async () => {
    try {
      setIsSyncing(true);
      await Promise.all([
        seedInitialJdcEntries(activeWeekMondayStr),
        seedInitialStudents(),
        seedInitialEvaluations(),
        seedInitialSchedule(),
        seedInitialNotes(),
        seedInitialClasses(),
        seedInitialReferentiels(),
      ]);
      addToast('Base de données Firestore réinitialisée avec le programme FWB.', undefined, 'success');
    } catch (err) {
      console.error('Erreur réinitialisation globale Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeClassId,
        setActiveClassId,
        activeClass,
        currentReferenceDate,
        activeWeekMondayStr,
        activeWeekDays,
        activeWeekType,
        setActiveWeekType,
        goToNextWeek,
        goToPreviousWeek,
        goToCurrentWeek,
        profile,
        updateProfile,
        classes,
        addClass,
        updateClass,
        timeSlots,
        updateTimeSlots,
        defaultSlots,
        addDefaultSlot,
        updateDefaultSlot,
        deleteDefaultSlot,
        referentiels,
        addReferentiel,
        updateReferentiel,
        deleteReferentiel,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        setStudentAttendance,
        jdcEntries,
        addJdcEntry,
        updateJdcEntry,
        deleteJdcEntry,
        duplicateJdcEntry,
        moveJdcEntry,
        populateWeekFromSchedule,
        evaluations,
        addEvaluation,
        updateEvaluation,
        deleteEvaluation,
        updateGrades,
        dailyNotes,
        addDailyNote,
        updateDailyNote,
        deleteDailyNote,
        selectedLessonId,
        setSelectedLessonId,
        isFirebaseCloud: isFirebaseConfigured,
        firebaseProjectId: currentProjectId,
        firestoreDatabaseId: currentDatabaseId,
        isSyncing,
        toasts,
        removeToast,
        resetAllToInitial,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
