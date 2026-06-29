# APMS Football
**Athlete Performance Management System — Football**

Sistema di gestione performance per calciatori basato su test neuromuscolari.

---

## Stack tecnico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Grafici | Recharts |
| Deploy | Vercel |

---

## Setup rapido (30 minuti)

### 1. Crea il progetto Supabase

1. Vai su [app.supabase.com](https://app.supabase.com) → **New project**
2. Scegli un nome (es. `apms-football`) e una password DB
3. Aspetta che il progetto sia pronto (~2 min)

### 2. Esegui le migration SQL

Nel pannello Supabase → **SQL Editor** → **New query**:

```sql
-- Incolla il contenuto di: supabase/migrations/001_initial_schema.sql
-- Esegui
-- Poi incolla: supabase/migrations/002_benchmark_seed.sql
-- Esegui
```

### 3. Configura le variabili d'ambiente

```bash
cp .env.local.example .env.local
```

Apri `.env.local` e compila:
- `NEXT_PUBLIC_SUPABASE_URL` → da Supabase → Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → da Supabase → Settings → API → anon key

### 4. Installa e avvia

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

### 5. Configura Supabase Auth (opzionale per email personalizzata)

Supabase → Authentication → Settings → `Site URL` = `http://localhost:3000`

---

## Struttura del progetto

```
src/
├── app/
│   ├── login/          # Pagina di accesso
│   ├── dashboard/      # Layout con sidebar
│   ├── athletes/       # Lista atleti
│   │   ├── new/        # Form nuovo atleta
│   │   └── [id]/       # Scheda atleta
│   │       ├── cmj/    # Form test CMJ
│   │       ├── imtp/   # Form test IMTP
│   │       ├── sprint/ # Form test Sprint
│   │       ├── vbt/    # Form sessione VBT
│   │       └── readiness/ # Log readiness
├── components/
│   ├── layout/         # Sidebar, Header
│   ├── charts/         # Grafici Recharts
│   └── ui/             # Componenti base
├── lib/
│   ├── supabase/       # Client Supabase
│   └── utils/
│       └── benchmark.ts # Calcoli percentili, Readiness Score, VBT regression
├── types/
│   └── index.ts        # TypeScript types completi
supabase/
├── migrations/
│   ├── 001_initial_schema.sql  # Schema DB completo
│   └── 002_benchmark_seed.sql  # Dati benchmark letteratura
```

---

## Schema Database

### Tabelle principali (Fase 1)

| Tabella | Descrizione |
|---------|-------------|
| `teams` | Team/staff (1 per utente in MVP) |
| `athletes` | Anagrafica atleti con BMI computed |
| `tests_cmj` | Test Counter Movement Jump |
| `tests_imtp` | Test Isometric Mid-Thigh Pull |
| `tests_sprint` | Test sprint 10m/30m |
| `tests_vbt_sessions` | Sessioni VBT con 1RM e R² |
| `tests_vbt_sets` | Coppie carico-velocità singole |
| `readiness_logs` | Log giornaliero soggettivo |
| `benchmarks` | Database benchmark da letteratura |

### Tabelle predisposte per fasi future

| Tabella | Fase | Descrizione |
|---------|------|-------------|
| `integration_sync_log` | Fase 3 | Log sync MyJump Lab / Meloq |
| `ai_insights` | Fase 4 | Output interpretazioni AI |

---

## Readiness Score — Formula

```
score = (
  sleep_quality  × 0.25 +   # 1–10, diretta
  energy_level   × 0.25 +   # 1–10, diretta
  (10 - doms)    × 0.20 +   # invertita
  (10 - stress)  × 0.15 +   # invertita
  rpe_adj        × 0.15      # penalizza RPE > 7
) × 10

rpe_adj = 10 - max(0, (rpe - 7) × 2)
```

**Semaforo:**
- 🟢 75–100: Pronto
- 🟡 50–74: Attenzione
- 🔴 0–49: Recupero

*Basato su: Hooper & Mackinnon (1995), McLean et al. (2010)*

---

## Benchmark — Fonti principali

| Test | Fonti |
|------|-------|
| CMJ | Loturco et al. (2015), Haugen et al. (2018), Rago et al. (2020) |
| IMTP | Thomas et al. (2015), Dos'Santos et al. (2017), Tillin et al. (2012) |
| Sprint | Haugen et al. (2014), Faude et al. (2012), Deprez et al. (2015) |
| VBT | Gonzalez-Badillo & Sanchez-Medina (2010), Pareja-Blanco et al. (2017) |

Categorie disponibili: Elite/Serie A, Serie B, U19, U17, U15

---

## Deploy su Vercel

```bash
npx vercel
```

Aggiungi le variabili d'ambiente nel pannello Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

In Supabase → Authentication → Settings → `Site URL` = il tuo dominio Vercel.

---

## Roadmap

| Fase | Stato | Contenuto |
|------|-------|-----------|
| 1 — MVP | ✅ In sviluppo | Dashboard, schede atleta, 4 test, readiness, report PDF |
| 2 — Team | 🔲 Pianificata | Dashboard squadra, confronti, heatmap |
| 3 — Integrazioni | 🔲 Pianificata | MyJump Lab, Meloq API |
| 4 — AI | 🔲 Pianificata | Interpretazioni automatiche pattern, alert |
