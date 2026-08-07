create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_net" with schema extensions;
create extension if not exists "wrappers" with schema extensions;
create extension if not exists "pg_cron";
-- pgmq owns its own schema (do not force into extensions).
create extension if not exists pgmq;
