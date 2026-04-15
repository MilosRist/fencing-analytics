# ⚔️ AFA Fencing Analytics

A full-stack web application for the **Alberta Fencing Association** that provides tournament data analytics, player rankings, ELO ratings, club standings, and head-to-head statistics.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Astro + React + Tailwind CSS |
| Charts | Recharts |
| ORM | Prisma |
| Database | Supabase (PostgreSQL) |

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your Supabase credentials from **Project Settings → API**:

```
DATABASE_URL      = pooled connection string (port 6543)
DIRECT_URL        = direct connection string (port 5432)
PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY = your anon/public key
```

### 4. Push the database schema

```bash
npm run db:generate   # generates Prisma client
npm run db:push       # creates tables in Supabase
```

### 5. Import your data

Place your Excel files in the `data/` folder:

```
data/
  combined_paired_matches.xlsx
  combined_bout_orders.xlsx
  combined_fencing_results.xlsx
  combined_pool_sheets.xlsx
  ftest.xlsx
```

Then run:

```bash
npm install xlsx     # one-time: SheetJS for Excel parsing
npm run db:import
```

The import script will:
1. Load tournament classifications and membership from `ftest.xlsx`
2. Import all point entries (LV0–LV4 sheets)
3. Import tournament results and podium finishes
4. Import pool sheets with win/loss/indicator stats
5. Import individual bout results
6. Import elimination-round paired matches
7. **Compute ELO ratings** for every member from all recorded matches

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

---

## 📄 Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats overview |
| `/rankings` | Points rankings with filters (season, weapon, sex, category) |
| `/elo` | ELO leaderboard by weapon |
| `/clubs` | Club rankings by aggregated points |
| `/tournaments` | All tournaments with level/date info |
| `/tournaments/[id]` | Tournament detail with event podiums |
| `/fencer` | Fencer search |
| `/fencer/[id]` | Full fencer profile: ELO, charts, results, point history |
| `/h2h` | Head-to-head comparison between two fencers |

---

## 🗄️ Database Schema

```
members          ← registered fencers
tournaments      ← each tournament event (AFA Provincials, AB Cup, etc.)
events           ← weapon/category events within a tournament
pools            ← pool groups within an event
pool_entries     ← fencer stats within a pool
matches          ← individual bouts (pool + elimination)
bout_results     ← per-fencer result within a match
tournament_results ← final placements
point_entries    ← points awarded per fencer per event
elo_ratings      ← current ELO per fencer per weapon
elo_history      ← ELO change log per match
```

---

## 📈 ELO System

- Default starting rating: **1200**
- K-factor: **32**
- Ratings computed from all recorded pool bouts and elimination matches
- Separate ratings per weapon (Epee, Foil, Saber)

### Tier thresholds

| Tier | Rating |
|------|--------|
| Master | 2000+ |
| Diamond | 1800+ |
| Platinum | 1600+ |
| Gold | 1400+ |
| Silver | 1200+ |
| Bronze | < 1200 |

---

## 🔮 Future Enhancements

- [ ] Per-weapon separate ELO computation (requires event→weapon linking in import)
- [ ] Season-over-season performance trends
- [ ] Predicted match outcomes
- [ ] Player comparison radar charts
- [ ] Public-facing embeddable widget
- [ ] Admin panel for manual data corrections
- [ ] CSV export of rankings

---

## 🛠️ Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run db:generate  # regenerate Prisma client
npm run db:push      # push schema changes to DB
npm run db:migrate   # create a named migration
npm run db:import    # import Excel data files
```
