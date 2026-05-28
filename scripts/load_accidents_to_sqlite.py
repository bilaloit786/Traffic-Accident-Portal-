"""Replace SQLite accident records from backend/data/accidents.csv."""

from __future__ import annotations

import csv
import sqlite3
from datetime import UTC, datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "backend" / "data" / "accidents.csv"
DB_PATH = ROOT / "backend" / "traffic_db.db"


def normalize_date(value: str) -> str:
    return datetime.strptime(value, "%m/%d/%Y").date().isoformat()


def main() -> None:
    rows = []
    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            rows.append(
                (
                    int(row["id"]),
                    float(row["latitude"]),
                    float(row["longitude"]),
                    row["datetime"],
                    normalize_date(row["date"]),
                    row["time"],
                    row["day_of_week"],
                    int(row["hour"]),
                    row["weather"],
                    row["road_type"],
                    row["severity"],
                    int(row["injuries"]),
                    int(row["fatalities"]),
                    int(row["vehicles_involved"]),
                    row["description"],
                    datetime.now(UTC).isoformat(timespec="seconds"),
                )
            )

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA foreign_keys = OFF")
        conn.execute("DELETE FROM accidents")
        conn.executemany(
            """
            INSERT INTO accidents (
                id, latitude, longitude, datetime, date, time, day_of_week, hour,
                weather, road_type, severity, injuries, fatalities,
                vehicles_involved, description, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
        conn.commit()

        total = conn.execute("SELECT COUNT(*) FROM accidents").fetchone()[0]
        min_date, max_date = conn.execute("SELECT MIN(date), MAX(date) FROM accidents").fetchone()
        print(f"SQLite accidents replaced: {total:,}")
        print(f"Date range: {min_date} to {max_date}")


if __name__ == "__main__":
    main()
