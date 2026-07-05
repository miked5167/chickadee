#!/usr/bin/env bash
#
# backup-database.sh — take a full logical backup of the Postgres database
# BEFORE any destructive or bulk-write operation (migrations, backfills).
#
# Ground rule: run this before ANY database write. It exits non-zero on failure
# so callers can `set -e` / check the exit code and STOP.
#
# Connection is taken from SUPABASE_DB_URL (a full Postgres connection string),
# falling back to DATABASE_URL. Get it from Supabase:
#   Project Settings -> Database -> Connection string -> URI  (use the pooler or
#   direct connection). Example:
#     export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres"
#
# Usage:
#   scripts/backup-database.sh                 # -> backups/backup-YYYYmmdd-HHMMSS.sql.gz
#   BACKUP_DIR=/tmp/x scripts/backup-database.sh
#
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
  echo "❌ backup-database.sh: SUPABASE_DB_URL (or DATABASE_URL) is not set." >&2
  echo "   Refusing to proceed — a write without a backup is not allowed." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "❌ backup-database.sh: pg_dump not found on PATH. Install PostgreSQL client tools." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$BACKUP_DIR"

TS="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/backup-$TS.sql.gz"

echo "🗄️  Backing up database to $OUT ..."
# --no-owner/--no-privileges keep the dump portable across roles.
if pg_dump "$DB_URL" --no-owner --no-privileges | gzip > "$OUT"; then
  # Guard against a truncated/empty dump.
  SIZE="$(wc -c < "$OUT" | tr -d ' ')"
  if [ "$SIZE" -lt 1000 ]; then
    echo "❌ backup-database.sh: backup file is suspiciously small ($SIZE bytes). Aborting." >&2
    exit 1
  fi
  echo "✅ Backup complete ($SIZE bytes): $OUT"
else
  echo "❌ backup-database.sh: pg_dump failed. STOP — do not run the write." >&2
  exit 1
fi
