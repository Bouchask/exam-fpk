# FPK Exam Guard: University Invigilation Management Platform

**FPK Exam Guard** is an industrial-grade management system designed for the **Faculté Polydisciplinaire de Khouribga (FPK)**. This platform automates the complex task of scheduling exams and managing faculty invigilation duties, ensuring institutional rigor and algorithmic fairness.

---

## 👨‍💻 Creator Information
**Yahya Bouchak**  
*Master SIIA (Information System and IA)*

---

## 🏛️ Project Architecture & Design
The platform features a strictly professional **90-degree architectural aesthetic**, projecting authoritative clarity through Institutional Brown and Black-Brown tones.

### Documentation Assets
- **Database Schema:** [View Schema](./public/db.png)
- **Use Case Diagram:** [View Use Cases](./public/use%20case.png)

---

## 🚀 Key Functional Modules

### 1. Administrative Control Center
A comprehensive analytical hub for institutional management:
- **Real-time Analytics:** KPI monitoring for active staff, scheduled sessions, and salle capacity.
- **Resource Management:** Modular CRUD interfaces for Professors, Exams, Salles, and Departments.
- **Quota Visualization:** Circular data modules for tracking staff availability.

### 2. Algorithmic Assignment Engine
The core intelligence module that automates duty allocation:
- **Constraint Validation:** Enforces departmental alignment and the maximum 4-guards-per-semester quota.
- **Logistical Optimization:** Real-time identifies and resolves room/time overlaps.
- **Fairness Logic:** Randomized allocation to ensure equitable distribution of duties.

### 3. Faculty Duty Portal
A dedicated workspace for professors to manage their assignments:
- **Personalized Timeline:** Synchronized view of confirmed and pending invigilation duties.
- **Incident Reporting:** Formal digital logging system for logistical conflicts or emergency exceptions.
- **Duty Archive:** Access to historical institutional records and schedule transcripts.

---

## 🛠️ Technology Stack
- **Framework:** [React 19](https://react.dev/) (Vite)
- **Typing:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Visuals:** [Recharts](https://recharts.org/) & [Lucide React](https://lucide.dev/)
- **State/Animations:** [Framer Motion](https://www.framer.com/motion/)

---

## 🔐 Deployment & Access
The project is optimized for deployment on **Vercel** or any modern cloud provider.

- **Admin Login:** `admin / admin`
- **Professor Login:** `prof / prof`
