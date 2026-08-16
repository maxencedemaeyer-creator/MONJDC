# MonJDC - Journal de Classe Numérique (FWB / SeGEC)

**MonJDC** est une application web complète de Journal de Classe numérique conçue spécifiquement pour le système éducatif belge (**Fédération Wallonie-Bruxelles - FWB** et **Secrétariat Général de l'Enseignement Catholique - SeGEC**).

---

## 🌟 Fonctionnalités Principales

1. **Tableau de Bord Enseignant (`/dashboard`)**
   - Vue du jour avec progression chronologique des périodes de cours (P1 à P8).
   - Appel rapide des présences et gestion des retards.
   - Checklist de conformité inspection pédagogique FWB (Tronc Commun / Pacte d'excellence).
   - Mémos et rappels didactiques.

2. **Journal de Classe Hebdomadaire (`/jdc`)**
   - Grille interactive du Lundi au Vendredi.
   - Gestion des récréations et pause midi.
   - Fiche de préparation détaillée : Intitulé, Objectifs opérationnels, Déroulement didactique par étapes (durée, rôle enseignant, activité élève), Matériel, Différenciation / PAP, et Devoirs.
   - Rattachement des codes officiels de **Savoirs (S)**, **Savoir-Faire (SF)** et **Compétences (C)**.
   - Actions rapides : Dupliquer une leçon, déplacer, générer la semaine depuis la grille type.

3. **Grille & Configuration Horaire (`/schedule-config`)**
   - Configuration des plages horaires (P1 à P8) et pauses.
   - Support de l'alternance **Semaine A / Semaine B / Toutes semaines**.
   - Grille fixe permettant de pré-remplir les cours récurrents en 1 clic.

4. **Référentiels & Compétences Belges (`/referentiels`)**
   - Moteur de recherche et filtres par Cycle (**Maternelle**, **P1-P2**, **P3-P4**, **P5-P6**, **Secondaire S1-S3**), Discipline (Français, Maths, Éveil, Sciences Humaines, FMTTN/Numérique, Arts...) et Catégorie (**S**, **SF**, **C**).
   - Possibilité d'ajouter et d'exporter des compétences d'établissement personnalisées au format JSON.

5. **Gestion des Élèves & Aménagements Raisonnables (`/students`)**
   - Registre de classe complet avec coordonnées des parents.
   - Prise en charge des aménagements raisonnables (**Dyslexie**, **TDA/H**, **Dyscalculie**, **HPI**, **Dyspraxie**, **PAI**).
   - Suivi journalier des présences et observations pédagogiques.

6. **Carnet de Cotes & Évaluations (`/evaluations`)**
   - Matrice interactive Élèves × Évaluations.
   - Calcul automatique des moyennes pondérées par discipline.
   - Génération instantanée du **Bulletin Pédagogique** imprimable pour chaque élève.

7. **Export & Dossier d'Inspection (`/export`)**
   - Export et impression conforme aux exigences des inspecteurs pédagogiques de la FWB.
   - Fiche de préparation pédagogique officielle avec cadre didactique et signatures de direction.

---

## 🚀 Configuration Firebase & Synchronisation Cloud

MonJDC fonctionne en mode **Offline-First / Local Persistant** par défaut grâce au stockage local sécurisé.

Pour activer la synchronisation Firestore Cloud et Firebase Auth :

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com/).
2. Activez **Firestore Database** et **Authentication** (Email/Mot de passe et Google).
3. Ajoutez les variables d'environnement dans votre fichier `.env` ou `.env.local` :

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="votre-projet.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="votre-projet"
VITE_FIREBASE_STORAGE_BUCKET="votre-projet.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

---

## 🛠️ Déploiement & Intégration Continue (GitHub Actions)

Le projet inclut deux flux de travail automatisés :
- `.github/workflows/ci.yml` : Validation TypeScript et compilation de production à chaque push/PR.
- `.github/workflows/deploy.yml` : Déploiement automatique vers Firebase Hosting ou Vercel.

### Commandes utiles :
```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Vérification du typage
npm run lint

# Compiler pour la production
npm run build
```
