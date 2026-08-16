import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile as updateAuthProfile,
  type User,
} from 'firebase/auth';
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
  INITIAL_TIME_SLOTS,
  INITIAL_CLASSES,
  INITIAL_DEFAULT_SLOTS,
  INITIAL_STUDENTS,
  getSampleJdcEntries,
  INITIAL_EVALUATIONS,
  INITIAL_DAILY_NOTES,
} from '../data/initialData';
import { db, auth, isFirebaseConfigured, currentProjectId, currentDatabaseId } from '../lib/firebase';
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
  docId?: string;
  type: 'success' | 'info' | 'error';
  timestamp: number;
}

interface AppContextType {
  // Navigation & View State
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeClassId: string;
  setActiveClassId: (id: string) => void;
  activeClass: ClassGroup | undefined;

  // Mobile Drawer & Navigation
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Firebase Auth State
  currentUser: User | null;
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

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
  deleteClass: (id: string) => Promise<void>;

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [currentReferenceDate, setCurrentReferenceDate] = useState<Date>(new Date());
  const [activeWeekType, setActiveWeekType] = useState<WeekType>('A');

  // Calculate Monday of reference date
  const activeWeekDays = getWeekDates(currentReferenceDate);
  const activeWeekMondayStr = activeWeekDays[0]?.dateStr || '';

  // Firebase Auth State & Loading
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Derive dynamic user ID
  const activeUserId = currentUser ? currentUser.uid : 'guest-teacher';

  // Dynamic initial profile based on authenticated user or guest
  const getInitialProfile = (user: User | null): TeacherProfile => {
    const name = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Enseignant');
    const email = user?.email || 'enseignant@ecole.be';
    return {
      id: user?.uid || 'guest-teacher',
      name,
      email,
      schoolName: 'École Fondamentale (FWB / SeGEC)',
      schoolYear: '2025-2026',
      role: 'Enseignant Titulaire',
      selectedCycle: 'P3-P4',
      activeClassId: '',
    };
  };

  // Data states (synchronized via Firestore onSnapshot strictly filtered by userId)
  const [profile, setProfile] = useState<TeacherProfile>(() => getInitialProfile(null));
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [activeClassId, setActiveClassIdState] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlotConfig[]>(INITIAL_TIME_SLOTS);
  const [defaultSlots, setDefaultSlots] = useState<DefaultSlotAssignment[]>([]);
  const [referentiels, setReferentiels] = useState<ReferentielItem[]>(INITIAL_REFERENTIELS);
  const [students, setStudents] = useState<Student[]>([]);
  const [jdcEntries, setJdcEntries] = useState<JdcEntry[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Firestore sync indicator & toasts
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Toast Helpers
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

  // =========================================================================
  // 1. Listen to Firebase Auth state
  // =========================================================================
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const dynamicName = user.displayName || (user.email ? user.email.split('@')[0] : 'Enseignant');
        const dynamicEmail = user.email || '';
        setProfile((prev) => ({
          ...prev,
          id: user.uid,
          name: dynamicName,
          email: dynamicEmail,
        }));
      } else {
        // Reset profile to clean guest state
        setProfile(getInitialProfile(null));
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Auth Operations
  const loginWithEmail = async (emailStr: string, passStr: string) => {
    if (!auth) throw new Error('Firebase Auth non disponible');
    await signInWithEmailAndPassword(auth, emailStr, passStr);
  };

  const registerWithEmail = async (emailStr: string, passStr: string, nameStr: string) => {
    if (!auth) throw new Error('Firebase Auth non disponible');
    const userCredential = await createUserWithEmailAndPassword(auth, emailStr, passStr);
    if (userCredential.user && nameStr) {
      await updateAuthProfile(userCredential.user, { displayName: nameStr });
      setProfile((prev) => ({
        ...prev,
        id: userCredential.user.uid,
        name: nameStr,
        email: emailStr,
      }));
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth non disponible');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    // Clear all in-memory user collections cleanly
    setClasses([]);
    setActiveClassIdState('');
    setStudents([]);
    setJdcEntries([]);
    setEvaluations([]);
    setDefaultSlots([]);
    setDailyNotes([]);
    setProfile(getInitialProfile(null));
    addToast('Déconnexion réussie', undefined, 'info');
  };

  // =========================================================================
  // 2. Real-time Firestore Listeners (Strictly filtered by activeUserId)
  // =========================================================================
  useEffect(() => {
    if (!db || isAuthLoading) return;

    // 1. JDC Entries Listener: strictly filter by userId
    const qJdc = query(collection(db, 'jdc_entries'), where('userId', '==', activeUserId));
    const unsubJdc = onSnapshot(
      qJdc,
      (snapshot) => {
        const items: JdcEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as JdcEntry;
          items.push({ ...data, id: docSnap.id });
        });
        setJdcEntries(items);
      },
      (error) => {
        console.warn('Firestore onSnapshot jdc_entries notice:', error.message);
      }
    );

    // 2. Students Listener: strictly filter by userId
    const qStudents = query(collection(db, 'students'), where('userId', '==', activeUserId));
    const unsubStudents = onSnapshot(
      qStudents,
      (snapshot) => {
        const items: Student[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Student;
          items.push({ ...data, id: docSnap.id });
        });
        items.sort((a, b) => a.lastName.localeCompare(b.lastName));
        setStudents(items);
      },
      (error) => {
        console.warn('Firestore onSnapshot students notice:', error.message);
      }
    );

    // 3. Evaluations Listener: strictly filter by userId
    const qEvals = query(collection(db, 'evaluations'), where('userId', '==', activeUserId));
    const unsubEvals = onSnapshot(
      qEvals,
      (snapshot) => {
        const items: Evaluation[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Evaluation;
          items.push({ ...data, id: docSnap.id });
        });
        setEvaluations(items);
      },
      (error) => {
        console.warn('Firestore onSnapshot evaluations notice:', error.message);
      }
    );

    // 4. Schedule (Timetable) Listener: strictly filter by userId
    const qSchedule = query(collection(db, 'schedule'), where('userId', '==', activeUserId));
    const unsubSchedule = onSnapshot(
      qSchedule,
      (snapshot) => {
        const items: DefaultSlotAssignment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DefaultSlotAssignment;
          items.push({ ...data, id: docSnap.id });
        });
        setDefaultSlots(items);
      },
      (error) => {
        console.warn('Firestore onSnapshot schedule notice:', error.message);
      }
    );

    // 5. Daily Notes Listener: strictly filter by userId
    const qNotes = query(collection(db, 'notes'), where('userId', '==', activeUserId));
    const unsubNotes = onSnapshot(
      qNotes,
      (snapshot) => {
        const items: DailyNote[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DailyNote;
          items.push({ ...data, id: docSnap.id });
        });
        setDailyNotes(items);
      },
      (error) => {
        console.warn('Firestore onSnapshot notes notice:', error.message);
      }
    );

    // 6. Classes Listener: strictly filter by userId
    const qClasses = query(collection(db, 'classes'), where('userId', '==', activeUserId));
    const unsubClasses = onSnapshot(
      qClasses,
      (snapshot) => {
        const items: ClassGroup[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ClassGroup;
          items.push({ ...data, id: docSnap.id });
        });
        setClasses(items);
        if (items.length > 0) {
          setActiveClassIdState((prev) => (items.some((c) => c.id === prev) ? prev : items[0].id));
        } else {
          setActiveClassIdState('');
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot classes notice:', error.message);
      }
    );

    // 7. Custom Referentiels Listener: filtered by userId
    const qReferentiels = query(collection(db, 'referentiels'), where('userId', '==', activeUserId));
    const unsubReferentiels = onSnapshot(
      qReferentiels,
      (snapshot) => {
        const customItems: ReferentielItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ReferentielItem;
          customItems.push({ ...data, id: docSnap.id });
        });
        // Merge standard SeGEC/FWB referentiels with user's custom competencies
        const customIds = new Set(customItems.map((c) => c.id));
        const merged = [...customItems, ...INITIAL_REFERENTIELS.filter((r) => !customIds.has(r.id))];
        setReferentiels(merged);
      },
      (error) => {
        console.warn('Firestore onSnapshot referentiels notice:', error.message);
      }
    );

    // 8. Teacher Profile Listener: doc(db, 'teacher_profile', activeUserId)
    const unsubProfile = onSnapshot(
      doc(db, 'teacher_profile', activeUserId),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as TeacherProfile);
        } else if (currentUser) {
          // Initialize user's personal teacher profile doc
          const fresh = getInitialProfile(currentUser);
          setDoc(doc(db, 'teacher_profile', activeUserId), {
            ...fresh,
            userId: activeUserId,
            updatedAt: new Date().toISOString(),
          }).catch(console.error);
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot teacher_profile notice:', error.message);
      }
    );

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
  }, [activeUserId, isAuthLoading]);

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
  // 3. Profile Actions (Strict userId storage)
  // =========================================================================
  const updateProfile = async (updated: Partial<TeacherProfile>) => {
    try {
      setIsSyncing(true);
      const merged = { ...profile, ...updated, userId: activeUserId, updatedAt: new Date().toISOString() };
      setProfile(merged);
      await setDoc(doc(db, 'teacher_profile', activeUserId), merged, { merge: true });
      logFirestoreSuccess('Profil enseignant mis à jour', activeUserId);
    } catch (err) {
      console.error('Erreur updateProfile Firestore:', err);
      addToast('Erreur lors de la sauvegarde du profil', undefined, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // 4. Class Actions (Strict userId storage)
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
        userId: activeUserId,
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
        userId: activeUserId,
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

  const deleteClass = async (id: string) => {
    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'classes', id));
      logFirestoreSuccess(`Classe supprimée`, id);
    } catch (err) {
      console.error('Erreur deleteClass Firestore:', err);
      addToast('Erreur suppression classe', id, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // 5. Timetable Slot Actions (Strict userId storage)
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
        userId: activeUserId,
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
        userId: activeUserId,
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
  // 6. Referentiel Actions (Strict userId storage)
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
        userId: activeUserId,
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
        userId: activeUserId,
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
  // 7. Student Actions (Strict userId storage)
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
        userId: activeUserId,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Élève ${student.firstName} ${student.lastName} ajouté`, docId);

      // Increment class studentCount
      const targetClass = classes.find((c) => c.id === student.classId);
      if (targetClass) {
        await updateClass(targetClass.id, { studentCount: (targetClass.studentCount || 0) + 1 });
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
        userId: activeUserId,
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
          await updateClass(targetClass.id, { studentCount: Math.max(0, (targetClass.studentCount || 1) - 1) });
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
        userId: activeUserId,
        updatedAt: new Date().toISOString(),
      });
      logFirestoreSuccess(`Présence mise à jour`, id);
    } catch (err) {
      console.error('Erreur setStudentAttendance Firestore:', err);
      addToast('Erreur pointage présence', id, 'error');
    }
  };

  // =========================================================================
  // 8. JDC Entry Actions (Strict userId storage)
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
        userId: activeUserId,
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
        userId: activeUserId,
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
        userId: activeUserId,
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
        userId: activeUserId,
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

  // Populate week automatically from user's schedule slots directly with Firestore writeBatch
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
              userId: activeUserId,
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
  // 9. Evaluation Actions (Strict userId storage)
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
        userId: activeUserId,
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
        userId: activeUserId,
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
        userId: activeUserId,
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
  // 10. Daily Notes Actions (Strict userId storage)
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
        userId: activeUserId,
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
        userId: activeUserId,
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

  // =========================================================================
  // 11. Explicit On-Demand Demo Data Seeding (With current user's userId)
  // =========================================================================
  const resetAllToInitial = async () => {
    try {
      setIsSyncing(true);
      const batch = writeBatch(db);

      // Classes
      INITIAL_CLASSES.forEach((cls) => {
        const docRef = doc(db, 'classes', cls.id);
        batch.set(docRef, { ...cls, userId: activeUserId, updatedAt: new Date().toISOString() });
      });

      // Schedule slots
      INITIAL_DEFAULT_SLOTS.forEach((slot) => {
        const docRef = doc(db, 'schedule', slot.id);
        batch.set(docRef, { ...slot, userId: activeUserId, updatedAt: new Date().toISOString() });
      });

      // Students
      INITIAL_STUDENTS.forEach((stud) => {
        const docRef = doc(db, 'students', stud.id);
        batch.set(docRef, { ...stud, userId: activeUserId, updatedAt: new Date().toISOString() });
      });

      // Sample JDC Entries for the active week
      const samples = getSampleJdcEntries(activeWeekMondayStr);
      samples.forEach((entry) => {
        const docRef = doc(db, 'jdc_entries', entry.id);
        batch.set(docRef, { ...entry, userId: activeUserId, updatedAt: new Date().toISOString() });
      });

      // Evaluations
      INITIAL_EVALUATIONS.forEach((evaluation) => {
        const docRef = doc(db, 'evaluations', evaluation.id);
        batch.set(docRef, { ...evaluation, userId: activeUserId, updatedAt: new Date().toISOString() });
      });

      // Daily notes
      INITIAL_DAILY_NOTES.forEach((note) => {
        const docRef = doc(db, 'notes', note.id);
        batch.set(docRef, { ...note, userId: activeUserId, updatedAt: new Date().toISOString() });
      });

      // Profile
      const profileDoc = doc(db, 'teacher_profile', activeUserId);
      batch.set(profileDoc, {
        ...profile,
        activeClassId: 'class-3a',
        userId: activeUserId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await batch.commit();
      addToast('Données de démonstration FWB chargées avec succès dans votre espace.', undefined, 'success');
    } catch (err) {
      console.error('Erreur réinitialisation globale Firestore:', err);
      addToast('Erreur lors du chargement des exemples', undefined, 'error');
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
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        currentUser,
        isAuthLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
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
        deleteClass,
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
