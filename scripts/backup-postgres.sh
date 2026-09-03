#!/usr/bin/env bash
# Creates a verified PostgreSQL logical backup and, optionally, copies it away
# from the VPS through a preconfigured rclone remote.
set -Eeuo pipefail
umask 077

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$PROJECT_DIR/.backup.env"

if [[ -f "$CONFIG_FILE" ]]; then
    # The file is created and owned by the VPS administrator.
    # shellcheck disable=SC1090
    source "$CONFIG_FILE"
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_RCLONE_TARGET="${BACKUP_RCLONE_TARGET:-}"

if ! [[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
    echo "BACKUP_RETENTION_DAYS must be a non-negative integer." >&2
    exit 2
fi

mkdir -p "$BACKUP_DIR"
LOCK_FILE="$BACKUP_DIR/.postgres-backup.lock"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "A PostgreSQL backup is already running; exiting." >&2
    exit 0
fi

cd "$PROJECT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/postgres-$STAMP.dump"
PARTIAL_FILE="$BACKUP_FILE.partial"
trap 'rm -f "$PARTIAL_FILE"' EXIT

docker compose exec -T db sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges' \
    > "$PARTIAL_FILE"

# A non-empty, readable custom dump protects against a silent empty backup.
test -s "$PARTIAL_FILE"
docker compose exec -T db pg_restore --list --format=custom < "$PARTIAL_FILE" > /dev/null
mv "$PARTIAL_FILE" "$BACKUP_FILE"

if [[ -n "$BACKUP_RCLONE_TARGET" ]]; then
    command -v rclone > /dev/null
    rclone copy "$BACKUP_FILE" "$BACKUP_RCLONE_TARGET"
fi

# Only files made by this script inside the configured backup directory are pruned.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'postgres-*.dump' \
    -mtime +"$BACKUP_RETENTION_DAYS" -print -delete

echo "PostgreSQL backup complete: $BACKUP_FILE"
