import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SubjectDomain, CompetencyCategory } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateFrench(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDateFrench(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function getDayNameFrench(dayOfWeek: number): string {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  return days[dayOfWeek - 1] || '';
}

// Get dates for Monday to Friday for a given week date (ISO string or Date)
export function getWeekDates(referenceDate: Date): { dayOfWeek: number; dateStr: string; label: string }[] {
  const curr = new Date(referenceDate);
  // Get Monday of current week
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(curr.setDate(diff));

  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayOfMonth}`;
    const dayName = getDayNameFrench(i + 1);
    weekDays.push({
      dayOfWeek: i + 1,
      dateStr,
      label: `${dayName} ${dayOfMonth}/${month}`,
    });
  }
  return weekDays;
}

export function getDomainColor(domain: SubjectDomain): { bg: string; text: string; border: string; badgeBg: string } {
  switch (domain) {
    case 'Français':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badgeBg: 'bg-rose-100 text-rose-800',
      };
    case 'Mathématiques':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        badgeBg: 'bg-blue-100 text-blue-800',
      };
    case 'Éveil & Sciences':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badgeBg: 'bg-emerald-100 text-emerald-800',
      };
    case 'Sciences Humaines':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800',
      };
    case 'Formation Artistique':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        badgeBg: 'bg-purple-100 text-purple-800',
      };
    case 'FMTTN & Numérique':
      return {
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
        badgeBg: 'bg-cyan-100 text-cyan-800',
      };
    case 'Éducation Physique':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        badgeBg: 'bg-orange-100 text-orange-800',
      };
    case 'Langues Modernes':
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        badgeBg: 'bg-indigo-100 text-indigo-800',
      };
    case 'Citoyenneté & Philosophie':
    default:
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        badgeBg: 'bg-teal-100 text-teal-800',
      };
  }
}

export function getCategoryBadge(category: CompetencyCategory): { label: string; bg: string; text: string; full: string } {
  switch (category) {
    case 'S':
      return { label: 'S', full: 'Savoir', bg: 'bg-sky-100', text: 'text-sky-800' };
    case 'SF':
      return { label: 'SF', full: 'Savoir-Faire', bg: 'bg-emerald-100', text: 'text-emerald-800' };
    case 'C':
      return { label: 'C', full: 'Compétence', bg: 'bg-purple-100', text: 'text-purple-800' };
    default:
      return { label: category, full: 'Code', bg: 'bg-slate-100', text: 'text-slate-700' };
  }
}
