#!/usr/bin/env python3
"""Import the local SQLite traffic database directly into PostgreSQL/Neon."""

from __future__ import annotations

import argparse
import os
import sqlite3
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

from export_sqlite_to_postgres import INDEXES, TABLES, create_table_sql, quote_identifier


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import SQLite traffic portal data directly into PostgreSQL."
    )
    parser.add_argument(
        "--sqlite-db",
        default="traffic_db.db",
        help="Path to SQLite DB, relative to backend/ by default.",
    )
    parser.add_argument(
        "--database-url-env",
        default="NEON_DATABASE_URL",
        help="Environment variable containing the PostgreSQL connection URL.",
    )
    parser.add_argument(
        "--drop-existing",
        action="store_true",
        help="Drop and recreate the traffic portal tables before import.",
    )
    parser.add_argument(
        "--exclude-auth",
        action="store_true",
        help="Exclude users and login_audit tables.",
    )
    parser.add_argument("--batch-size", type=int, default=5000)
    return parser.parse_args()


def resolve_backend_path(value: str) -> Path:
    backend_dir = Path(__file__).resolve().parents[1]
    path = Path(value)
    return path if path.is_absolute() else backend_dir / path


def sqlite_table_exists(connection: sqlite3.Connection, table: str) -> bool:
    row = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        (table,),
    ).fetchone()
    return row is not None


def import_table(
    sqlite_connection: sqlite3.Connection,
    pg_cursor,
    table: str,
    columns: list[tuple[str, str]],
    batch_size: int,
) -> int:
    column_names = [column for column, _ in columns]
    quoted_columns = ", ".join(quote_identifier(column) for column in column_names)
    select_columns = ", ".join(quote_identifier(column) for column in column_names)
    sqlite_cursor = sqlite_connection.execute(
        f"SELECT {select_columns} FROM {quote_identifier(table)} ORDER BY id"
    )
    insert_sql = (
        f"INSERT INTO {quote_identifier(table)} ({quoted_columns}) VALUES %s"
    )

    total = 0
    while True:
        rows = sqlite_cursor.fetchmany(batch_size)
        if not rows:
            break
        execute_values(pg_cursor, insert_sql, [tuple(row) for row in rows], page_size=batch_size)
        total += len(rows)
        print(f"{table}: imported {total} rows", flush=True)
    return total


def main() -> None:
    args = parse_args()
    sqlite_db = resolve_backend_path(args.sqlite_db)
    database_url = os.getenv(args.database_url_env)

    if not sqlite_db.exists():
        raise SystemExit(f"SQLite database not found: {sqlite_db}")
    if not database_url:
        raise SystemExit(
            f"Set {args.database_url_env} to your Neon/PostgreSQL connection URL first."
        )
    if not args.drop_existing:
        raise SystemExit("Refusing to overwrite tables without --drop-existing.")

    tables = dict(TABLES)
    if args.exclude_auth:
        tables.pop("users", None)
        tables.pop("login_audit", None)

    sqlite_connection = sqlite3.connect(sqlite_db)
    sqlite_connection.row_factory = sqlite3.Row

    try:
        missing = [table for table in tables if not sqlite_table_exists(sqlite_connection, table)]
        if missing:
            raise SystemExit(f"Missing expected SQLite tables: {', '.join(missing)}")

        with psycopg2.connect(database_url) as pg_connection:
            with pg_connection.cursor() as cursor:
                print("Connected to PostgreSQL.")
                for table in reversed(tables):
                    cursor.execute(
                        f"DROP TABLE IF EXISTS {quote_identifier(table)} CASCADE"
                    )
                for table, columns in tables.items():
                    cursor.execute(create_table_sql(table, columns))

                counts: dict[str, int] = {}
                for table, columns in tables.items():
                    counts[table] = import_table(
                        sqlite_connection,
                        cursor,
                        table,
                        columns,
                        args.batch_size,
                    )

                for index_name, table, column, unique in INDEXES:
                    if table not in tables:
                        continue
                    unique_sql = "UNIQUE " if unique else ""
                    cursor.execute(
                        f"CREATE {unique_sql}INDEX {quote_identifier(index_name)} "
                        f"ON {quote_identifier(table)} ({quote_identifier(column)})"
                    )

                for table in tables:
                    sequence = f'"{table}_id_seq"'
                    cursor.execute(
                        f"SELECT setval(%s, "
                        f"COALESCE((SELECT MAX(id) FROM {quote_identifier(table)}), 1), "
                        f"(SELECT COUNT(*) > 0 FROM {quote_identifier(table)}))",
                        (sequence,),
                    )

            pg_connection.commit()

        print("Import complete.")
        for table, count in counts.items():
            print(f"{table}: {count}")
    finally:
        sqlite_connection.close()


if __name__ == "__main__":
    main()
