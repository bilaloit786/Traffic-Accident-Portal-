"""Generate emergency accident records at a target daily average.

This keeps the app's existing accidents.csv schema and writes matching data to:
- data/accidents.csv
- backend/data/accidents.csv
"""

from __future__ import annotations

import csv
import random
from collections import Counter
from datetime import date, datetime, time, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
START_DATE = date(2020, 1, 1)
END_DATE = date(2025, 3, 31)
TARGET_AVERAGE_PER_DAY = 110
SEED = 20250331

WEATHER_CHOICES = [
    ("Clear", 0.52),
    ("Cloudy", 0.17),
    ("Rain", 0.18),
    ("Fog", 0.08),
    ("Heavy Rain", 0.04),
    ("Snow", 0.01),
]

ROAD_TYPE_CHOICES = [
    ("Highway", 0.25),
    ("Arterial", 0.28),
    ("Residential", 0.22),
    ("Intersection", 0.18),
    ("Rural", 0.07),
]

SEVERITY_CHOICES = [
    ("Minor", 0.50),
    ("Moderate", 0.32),
    ("Severe", 0.14),
    ("Fatal", 0.04),
]

HOTSPOTS = [
    (32.5730725, 74.1005044),
    (32.5879280, 74.0800084),
    (32.5897189, 74.0800016),
    (32.5474000, 74.0027460),
    (32.6377717, 74.1958929),
    (32.5603176, 74.0588460),
    (32.5779143, 74.0640682),
    (32.7463785, 74.2730009),
]


def daterange(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def weighted_choice(choices):
    values, weights = zip(*choices)
    return random.choices(values, weights=weights, k=1)[0]


def emergency_count_for_day(day: date) -> int:
    base = round(random.gauss(TARGET_AVERAGE_PER_DAY, 13))
    if day.weekday() in (4, 5, 6):
        base += random.randint(5, 14)
    if day.month in (6, 7, 8):
        base += random.randint(3, 10)
    if day.month in (12, 1):
        base += random.randint(2, 8)
    return max(72, min(155, base))


def get_hour() -> int:
    weights = [1.2] * 24
    for hour in range(7, 10):
        weights[hour] = 3.5
    for hour in range(13, 15):
        weights[hour] = 2.0
    for hour in range(17, 22):
        weights[hour] = 4.1
    for hour in range(0, 5):
        weights[hour] = 0.72
    return random.choices(range(24), weights=weights, k=1)[0]


def choose_location(roads):
    if roads and random.random() < 0.64:
        road = random.choice(roads)
        lat = float(road["latitude"]) + random.uniform(-0.0018, 0.0018)
        lon = float(road["longitude"]) + random.uniform(-0.0018, 0.0018)
        road_type = road.get("type") or weighted_choice(ROAD_TYPE_CHOICES)
        name = road.get("name", "Gujrat road corridor")
        return lat, lon, road_type, name

    center_lat, center_lon = random.choice(HOTSPOTS)
    lat = center_lat + random.uniform(-0.012, 0.012)
    lon = center_lon + random.uniform(-0.012, 0.012)
    return lat, lon, weighted_choice(ROAD_TYPE_CHOICES), "Gujrat emergency corridor"


def choose_severity(weather: str, hour: int) -> str:
    severity = weighted_choice(SEVERITY_CHOICES)
    if weather in {"Fog", "Heavy Rain", "Snow"} and random.random() < 0.24:
        severity = random.choices(["Moderate", "Severe", "Fatal"], weights=[0.42, 0.43, 0.15], k=1)[0]
    if hour in range(18, 23) and severity == "Minor" and random.random() < 0.12:
        severity = "Moderate"
    return severity


def casualties_for(severity: str):
    if severity == "Minor":
        injured, dead = random.choices([0, 1, 2], weights=[0.28, 0.54, 0.18], k=1)[0], 0
    elif severity == "Moderate":
        injured, dead = random.randint(1, 4), 1 if random.random() < 0.08 else 0
    elif severity == "Severe":
        injured, dead = random.randint(2, 8), random.choices([0, 1, 2], weights=[0.66, 0.27, 0.07], k=1)[0]
    else:
        injured, dead = random.randint(0, 6), random.randint(1, 4)
    return {"injured": injured, "dead": dead, "total": injured + dead}


def description_for(severity: str, weather: str, road_type: str, road_name: str) -> str:
    templates = {
        "Minor": "Minor emergency response on {road_type} near {road_name} during {weather} conditions",
        "Moderate": "Moderate collision response on {road_type} near {road_name} in {weather} weather",
        "Severe": "Severe traffic emergency on {road_type} near {road_name} with {weather} conditions",
        "Fatal": "Fatal emergency incident on {road_type} near {road_name} during {weather} weather",
    }
    return templates[severity].format(
        road_type=road_type.lower(),
        road_name=road_name,
        weather=weather.lower(),
    )


def read_roads() -> list[dict[str, str]]:
    roads_path = ROOT / "data" / "roads.csv"
    if not roads_path.exists():
        return []
    with roads_path.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def build_daily_counts() -> list[tuple[date, int]]:
    days = list(daterange(START_DATE, END_DATE))
    counts = [(day, emergency_count_for_day(day)) for day in days]
    target_total = len(days) * TARGET_AVERAGE_PER_DAY
    current_total = sum(count for _, count in counts)
    delta = target_total - current_total

    mutable = [[day, count] for day, count in counts]
    while delta != 0:
        item = random.choice(mutable)
        if delta > 0:
            item[1] += 1
            delta -= 1
        elif item[1] > 1:
            item[1] -= 1
            delta += 1

    return [(day, count) for day, count in mutable]


def generate_rows() -> list[dict[str, object]]:
    random.seed(SEED)
    roads = read_roads()
    rows = []
    record_id = 1

    for day, count in build_daily_counts():
        used_minutes = set()
        for _ in range(count):
            hour = get_hour()
            minute = random.randint(0, 59)
            while (hour, minute) in used_minutes:
                hour = get_hour()
                minute = random.randint(0, 59)
            used_minutes.add((hour, minute))

            event_datetime = datetime.combine(day, time(hour=hour, minute=minute))
            weather = weighted_choice(WEATHER_CHOICES)
            lat, lon, road_type, road_name = choose_location(roads)
            if road_type not in {"Highway", "Arterial", "Residential", "Intersection", "Rural"}:
                road_type = weighted_choice(ROAD_TYPE_CHOICES)
            severity = choose_severity(weather, hour)
            casualties = casualties_for(severity)
            vehicles_involved = random.randint(1, 2 if severity == "Minor" else 5)

            rows.append(
                {
                    "id": record_id,
                    "latitude": round(lat, 6),
                    "longitude": round(lon, 6),
                    "datetime": event_datetime.isoformat(),
                    "date": f"{day.month}/{day.day}/{day.year}",
                    "time": event_datetime.time().strftime("%H:%M:%S"),
                    "day_of_week": day.strftime("%A"),
                    "hour": hour,
                    "weather": weather,
                    "road_type": road_type,
                    "severity": severity,
                    "casualties": str(casualties),
                    "injuries": casualties["injured"],
                    "fatalities": casualties["dead"],
                    "vehicles_involved": vehicles_involved,
                    "description": description_for(severity, weather, road_type, road_name),
                }
            )
            record_id += 1

    rows.sort(key=lambda row: (row["datetime"], row["id"]))
    for index, row in enumerate(rows, start=1):
        row["id"] = index
    return rows


def write_csv(rows: list[dict[str, object]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "id",
        "latitude",
        "longitude",
        "datetime",
        "date",
        "time",
        "day_of_week",
        "hour",
        "weather",
        "road_type",
        "severity",
        "casualties",
        "injuries",
        "fatalities",
        "vehicles_involved",
        "description",
    ]
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    rows = generate_rows()
    outputs = [
        ROOT / "data" / "accidents.csv",
        ROOT / "backend" / "data" / "accidents.csv",
    ]
    for output in outputs:
        write_csv(rows, output)

    total_days = (END_DATE - START_DATE).days + 1
    severity_counts = Counter(row["severity"] for row in rows)
    print(f"Generated {len(rows):,} emergency accident records")
    print(f"Date range: {START_DATE.isoformat()} to {END_DATE.isoformat()} ({total_days:,} days)")
    print(f"Average per day: {len(rows) / total_days:.2f}")
    print("Severity breakdown:")
    for severity in ["Minor", "Moderate", "Severe", "Fatal"]:
        print(f"  {severity}: {severity_counts[severity]:,}")
    for output in outputs:
        print(f"Wrote {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
