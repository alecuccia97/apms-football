-- ============================================================
-- APMS Football — Schema iniziale (Fase 1)
-- Predisposto per Fase 2 (team_id), Fase 3 (integrations), Fase 4 (AI)
-- ============================================================

-- Abilita estensioni utili
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- per ricerca full-text atleti

-- ============================================================
-- ENUMS
-- ============================================================

create type dominant_foot as enum ('destro', 'sinistro', 'ambidestro');
create type athlete_role as enum (
  'portiere', 'difensore_centrale', 'terzino', 'centrocampista_difensivo',
  'centrocampista', 'centrocampista_offensivo', 'ala', 'attaccante', 'trequartista'
);
create type category as enum (
  'serie_a', 'serie_b', 'serie_c', 'u19', 'u17', 'u15', 'u14', 'altro'
);
create type benchmark_level as enum ('elite', 'serie_a', 'serie_b', 'u19', 'u17', 'u15');
create type data_source as enum ('manual', 'myjump', 'meloq', 'import_csv');

-- ============================================================
-- TEAMS (predisposto Fase 2 — per ora 1 team per utente)
-- ============================================================

create table teams (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  owner_id      uuid references auth.users(id) on delete cascade not null,
  logo_url      text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ============================================================
-- ATHLETES
-- ============================================================

create table athletes (
  id                uuid primary key default uuid_generate_v4(),
  team_id           uuid references teams(id) on delete cascade not null,
  user_id           uuid references auth.users(id) on delete cascade not null, -- owner
  -- Anagrafica
  first_name        text not null,
  last_name         text not null,
  date_of_birth     date not null,
  height_cm         numeric(5,1),
  weight_kg         numeric(5,2),
  dominant_foot     dominant_foot default 'destro',
  role              athlete_role,
  category          category,
  photo_url         text,
  notes             text,
  -- Computed (aggiornato via trigger)
  bmi               numeric(5,2) generated always as (
                      case when height_cm > 0 and weight_kg > 0
                        then round((weight_kg / ((height_cm/100)^2))::numeric, 2)
                      else null end
                    ) stored,
  is_active         boolean default true,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

-- Indice per ricerca per nome (trigram)
create index athletes_name_trgm on athletes
  using gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- ============================================================
-- TEST CMJ
-- ============================================================

create table tests_cmj (
  id                      uuid primary key default uuid_generate_v4(),
  athlete_id              uuid references athletes(id) on delete cascade not null,
  tested_at               timestamptz not null default now(),
  source                  data_source default 'manual',
  -- Metriche principali
  jump_height_cm          numeric(6,2),        -- cm
  peak_power_w            numeric(8,1),        -- Watt
  peak_power_w_per_kg     numeric(6,2),        -- W/kg
  rsi_modified            numeric(5,3),        -- adimensionale
  peak_velocity_prop_ms   numeric(5,3),        -- m/s (propulsiva)
  peak_velocity_brake_ms  numeric(5,3),        -- m/s (braking, valore negativo)
  -- Metadati salto
  contact_time_ms         numeric(7,1),
  flight_time_ms          numeric(7,1),
  body_weight_kg          numeric(5,2),        -- peso al momento del test
  n_jumps                 smallint default 3,
  best_jump               boolean default true,
  -- Benchmark al momento del test
  benchmark_level         benchmark_level,
  -- Note
  notes                   text,
  created_at              timestamptz default now() not null,
  -- Predisposizione Fase 3: external ID dal device
  external_id             text,
  external_source         text
);

create index tests_cmj_athlete_date on tests_cmj(athlete_id, tested_at desc);

-- ============================================================
-- TEST IMTP
-- ============================================================

create table tests_imtp (
  id                  uuid primary key default uuid_generate_v4(),
  athlete_id          uuid references athletes(id) on delete cascade not null,
  tested_at           timestamptz not null default now(),
  source              data_source default 'manual',
  body_weight_kg      numeric(5,2),
  -- Forza massima
  peak_force_n        numeric(8,1),
  peak_force_n_per_kg numeric(6,3),
  -- RFD
  early_rfd_n_per_s   numeric(10,1),   -- 0–50ms
  max_rfd_n_per_s     numeric(10,1),
  late_rfd_n_per_s    numeric(10,1),   -- 150–250ms
  -- Finestre temporali
  force_at_100ms_n    numeric(8,1),
  force_at_150ms_n    numeric(8,1),
  force_at_200ms_n    numeric(8,1),
  -- Metadati
  test_duration_ms    numeric(7,1) default 5000,
  n_attempts          smallint default 2,
  benchmark_level     benchmark_level,
  notes               text,
  created_at          timestamptz default now() not null,
  external_id         text,
  external_source     text
);

create index tests_imtp_athlete_date on tests_imtp(athlete_id, tested_at desc);

-- ============================================================
-- TEST SPRINT
-- ============================================================

create table tests_sprint (
  id            uuid primary key default uuid_generate_v4(),
  athlete_id    uuid references athletes(id) on delete cascade not null,
  tested_at     timestamptz not null default now(),
  source        data_source default 'manual',
  -- Tempi
  time_10m_s    numeric(5,3),
  time_30m_s    numeric(5,3),
  time_5m_s     numeric(5,3),   -- opzionale
  time_20m_s    numeric(5,3),   -- opzionale
  -- Metadati
  surface       text,           -- erba, sintetico, tartano
  wind_ms       numeric(4,1),
  timing_system text,           -- Brower, Microgate, foto cellula…
  n_attempts    smallint default 2,
  benchmark_level benchmark_level,
  notes         text,
  created_at    timestamptz default now() not null
);

create index tests_sprint_athlete_date on tests_sprint(athlete_id, tested_at desc);

-- ============================================================
-- TEST VBT (Velocity Based Training)
-- Ogni riga = una sessione VBT con più carichi
-- ============================================================

create table tests_vbt_sessions (
  id              uuid primary key default uuid_generate_v4(),
  athlete_id      uuid references athletes(id) on delete cascade not null,
  tested_at       timestamptz not null default now(),
  source          data_source default 'manual',
  exercise        text not null default 'squat', -- squat, bench, deadlift…
  -- 1RM
  estimated_1rm_kg  numeric(6,2),   -- dalla regressione
  actual_1rm_kg     numeric(6,2),   -- misurato realmente
  r_squared         numeric(5,4),   -- R² della retta di regressione
  -- Metadati
  device          text,             -- Vitruve, Push Band, Tendo…
  benchmark_level benchmark_level,
  notes           text,
  created_at      timestamptz default now() not null
);

-- Singoli punti carico-velocità di una sessione VBT
create table tests_vbt_sets (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid references tests_vbt_sessions(id) on delete cascade not null,
  load_kg     numeric(6,2) not null,
  load_pct    numeric(5,2),          -- % del 1RM stimato
  velocity_ms numeric(5,3) not null,  -- mean propulsive velocity
  rpe         smallint check (rpe between 1 and 10),
  set_number  smallint,
  created_at  timestamptz default now() not null
);

create index tests_vbt_athlete_date on tests_vbt_sessions(athlete_id, tested_at desc);

-- ============================================================
-- READINESS GIORNALIERO
-- ============================================================

create table readiness_logs (
  id              uuid primary key default uuid_generate_v4(),
  athlete_id      uuid references athletes(id) on delete cascade not null,
  logged_date     date not null default current_date,
  -- Parametri soggettivi (scala 1–10)
  sleep_quality   smallint check (sleep_quality between 1 and 10),
  energy_level    smallint check (energy_level between 1 and 10),
  doms            smallint check (doms between 1 and 10),
  stress          smallint check (stress between 1 and 10),
  rpe_prev        smallint check (rpe_prev between 1 and 10), -- RPE sessione precedente
  -- Oggettivi
  weight_kg       numeric(5,2),
  -- Score composito (calcolato automaticamente)
  readiness_score numeric(5,2) generated always as (
    round((
      coalesce(sleep_quality, 5) * 0.25 +
      coalesce(energy_level, 5) * 0.25 +
      (10 - coalesce(doms, 5)) * 0.20 +
      (10 - coalesce(stress, 5)) * 0.15 +
      (10 - greatest(0, (coalesce(rpe_prev, 5) - 7) * 2)) * 0.15
    ) * 10, 2)
  ) stored,
  notes           text,
  created_at      timestamptz default now() not null,
  -- Un solo log per atleta per giorno
  unique (athlete_id, logged_date)
);

create index readiness_athlete_date on readiness_logs(athlete_id, logged_date desc);

-- ============================================================
-- BENCHMARK DATABASE (da letteratura peer-reviewed)
-- Tabella piatta — popolata via seed
-- ============================================================

create table benchmarks (
  id            uuid primary key default uuid_generate_v4(),
  test_type     text not null,         -- 'cmj', 'imtp', 'sprint', 'vbt'
  metric_key    text not null,         -- 'jump_height_cm', 'peak_force_n', …
  metric_label  text not null,
  category      benchmark_level not null,
  mean          numeric(12,4),
  std_dev       numeric(12,4),
  p25           numeric(12,4),
  p50           numeric(12,4),
  p75           numeric(12,4),
  p90           numeric(12,4),
  unit          text,
  higher_is_better boolean default true,
  source_refs   text[],               -- array di citazioni
  updated_at    timestamptz default now() not null,
  unique (test_type, metric_key, category)
);

-- ============================================================
-- TABELLA PREDISPOSTA FASE 3: integrazioni esterne
-- ============================================================

create table integration_sync_log (
  id            uuid primary key default uuid_generate_v4(),
  athlete_id    uuid references athletes(id) on delete cascade,
  source        text not null,         -- 'myjump', 'meloq'
  external_id   text,
  test_type     text,
  synced_at     timestamptz default now(),
  status        text default 'ok',     -- 'ok', 'error', 'duplicate'
  payload       jsonb                  -- raw data dal device
);

-- ============================================================
-- TABELLA PREDISPOSTA FASE 4: AI insights
-- ============================================================

create table ai_insights (
  id            uuid primary key default uuid_generate_v4(),
  athlete_id    uuid references athletes(id) on delete cascade not null,
  generated_at  timestamptz default now() not null,
  insight_type  text not null,         -- 'performance_trend', 'fatigue_alert', 'transfer_gap'
  window_days   smallint default 42,
  content       text not null,
  data_snapshot jsonb,                 -- snapshot dei dati usati per generarlo
  model_version text                   -- versione del prompt/modello usato
);

create index ai_insights_athlete on ai_insights(athlete_id, generated_at desc);

-- ============================================================
-- RLS (Row Level Security) — ogni utente vede solo i suoi dati
-- ============================================================

alter table teams enable row level security;
alter table athletes enable row level security;
alter table tests_cmj enable row level security;
alter table tests_imtp enable row level security;
alter table tests_sprint enable row level security;
alter table tests_vbt_sessions enable row level security;
alter table tests_vbt_sets enable row level security;
alter table readiness_logs enable row level security;
alter table benchmarks enable row level security;
alter table integration_sync_log enable row level security;
alter table ai_insights enable row level security;

-- Policy teams
create policy "owner can manage team"
  on teams for all
  using (owner_id = auth.uid());

-- Policy athletes (tramite team)
create policy "user can manage own athletes"
  on athletes for all
  using (user_id = auth.uid());

-- Policies test (tramite athlete user_id)
create policy "user can manage cmj"
  on tests_cmj for all
  using (athlete_id in (select id from athletes where user_id = auth.uid()));

create policy "user can manage imtp"
  on tests_imtp for all
  using (athlete_id in (select id from athletes where user_id = auth.uid()));

create policy "user can manage sprint"
  on tests_sprint for all
  using (athlete_id in (select id from athletes where user_id = auth.uid()));

create policy "user can manage vbt sessions"
  on tests_vbt_sessions for all
  using (athlete_id in (select id from athletes where user_id = auth.uid()));

create policy "user can manage vbt sets"
  on tests_vbt_sets for all
  using (session_id in (
    select s.id from tests_vbt_sessions s
    join athletes a on a.id = s.athlete_id
    where a.user_id = auth.uid()
  ));

create policy "user can manage readiness"
  on readiness_logs for all
  using (athlete_id in (select id from athletes where user_id = auth.uid()));

-- Benchmarks leggibili da tutti gli autenticati
create policy "benchmarks readable by authenticated"
  on benchmarks for select
  using (auth.role() = 'authenticated');

create policy "user sync log"
  on integration_sync_log for all
  using (athlete_id in (select id from athletes where user_id = auth.uid()));

create policy "user ai insights"
  on ai_insights for all
  using (athlete_id in (select id from athletes where user_id = auth.uid()));

-- ============================================================
-- TRIGGER: updated_at automatico
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger athletes_updated_at before update on athletes
  for each row execute function update_updated_at();
create trigger teams_updated_at before update on teams
  for each row execute function update_updated_at();

-- ============================================================
-- FUNCTION: crea team default all'iscrizione
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into teams (name, owner_id)
  values ('Il mio staff', new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- VIEWS UTILI
-- ============================================================

-- Vista atleta con ultimo test per ogni tipo
create or replace view athletes_summary as
select
  a.*,
  (select tested_at from tests_cmj where athlete_id = a.id order by tested_at desc limit 1) as last_cmj_date,
  (select jump_height_cm from tests_cmj where athlete_id = a.id order by tested_at desc limit 1) as last_cmj_height,
  (select tested_at from tests_imtp where athlete_id = a.id order by tested_at desc limit 1) as last_imtp_date,
  (select peak_force_n from tests_imtp where athlete_id = a.id order by tested_at desc limit 1) as last_imtp_force,
  (select tested_at from tests_sprint where athlete_id = a.id order by tested_at desc limit 1) as last_sprint_date,
  (select time_10m_s from tests_sprint where athlete_id = a.id order by tested_at desc limit 1) as last_sprint_10m,
  (select readiness_score from readiness_logs where athlete_id = a.id order by logged_date desc limit 1) as today_readiness,
  (select logged_date from readiness_logs where athlete_id = a.id order by logged_date desc limit 1) as last_readiness_date
from athletes a
where a.is_active = true;
