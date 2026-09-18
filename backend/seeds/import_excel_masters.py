#!/usr/bin/env python3
"""Import HealthFix masters from Desktop Excel workbooks into Postgres."""

from __future__ import annotations

import os
import re
import sys
from datetime import datetime, date
from pathlib import Path

import psycopg2
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "seeds" / "data"
DOCTORS_DIR = DATA / "doctors"

CANONICAL_HQS = ["HUBLI", "GADAG", "BELAGAVI", "BELAGAVI2", "SIRSI", "GOA"]

HQ_ALIASES = {
    "HUBLI": "HUBLI",
    "HUBBALLI": "HUBLI",
    "GADAG": "GADAG",
    "BELAGAVI": "BELAGAVI",
    "BELAGAUM": "BELAGAVI",
    "BELAGAVI1": "BELAGAVI",
    "BELAGAVI 1": "BELAGAVI",
    "BELAGAVI ONE": "BELAGAVI",
    "BELAGAVI2": "BELAGAVI2",
    "BELAGAVI 2": "BELAGAVI2",
    "BELAGAVI TWO": "BELAGAVI2",
    "BELAGAUM-2": "BELAGAVI2",
    "BELAGAUM2": "BELAGAVI2",
    "SIRSI": "SIRSI",
    "GOA": "GOA",
    "MADGOAN": "GOA",
    "MADGAON": "GOA",
    "MADGOAN (GOA)": "GOA",
    "MADGAON (GOA)": "GOA",
}


def cell(v):
    if v is None:
        return ""
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, date):
        return v.isoformat()
    return str(v).strip()


def norm_key(s: str) -> str:
    s = cell(s).upper().replace(".", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def map_hq(raw: str) -> str | None:
    key = norm_key(raw)
    if not key:
        return None
    if key in HQ_ALIASES:
        return HQ_ALIASES[key]
    # strip trailing punctuation
    key = key.rstrip(".")
    if key in HQ_ALIASES:
        return HQ_ALIASES[key]
    # fuzzy contains
    for alias, canon in HQ_ALIASES.items():
        if alias in key or key in alias:
            return canon
    return None


def mobile10(v) -> str:
    digits = re.sub(r"\D", "", cell(v))
    if len(digits) > 10:
        digits = digits[-10:]
    return digits


def as_int(v, default=0) -> int:
    if v is None or v == "":
        return default
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return default


def connect():
    # Prefer DATABASE_URL / .env style used by the Go API
    env_path = ROOT / ".env"
    dsn = os.environ.get("DB_CONNECTION_STRING", "").strip().strip('"')
    if not dsn and env_path.exists():
        for line in env_path.read_text().splitlines():
            if "DB_CONNECTION_STRING" in line and "=" in line:
                dsn = line.split("=", 1)[1].strip().strip('"')
                break
    if not dsn:
        dsn = "host=localhost user=postgres password=postpass dbname=healthfix port=5432 sslmode=disable"
    # psycopg2 wants libpq keywords; Go string already matches
    return psycopg2.connect(dsn)


def ensure_hqs(cur) -> dict[str, int]:
    ids = {}
    for name in CANONICAL_HQS:
        cur.execute(
            """
            INSERT INTO area_masters (name, status, created_at, updated_at)
            VALUES (%s, 'active', NOW(), NOW())
            ON CONFLICT (name) DO UPDATE SET status = 'active', updated_at = NOW()
            RETURNING id
            """,
            (name,),
        )
        row = cur.fetchone()
        if row:
            ids[name] = row[0]
        else:
            cur.execute("SELECT id FROM area_masters WHERE LOWER(name)=LOWER(%s)", (name,))
            ids[name] = cur.fetchone()[0]
    # Also resolve any case-variant unique index issues
    cur.execute("SELECT id, name FROM area_masters")
    for id_, name in cur.fetchall():
        mapped = map_hq(name)
        if mapped and mapped not in ids:
            ids[mapped] = id_
        if mapped:
            ids[mapped] = id_
    return {k: ids[k] for k in CANONICAL_HQS}


def header_map(row) -> dict[str, int]:
    out = {}
    for i, v in enumerate(row or []):
        key = norm_key(v).replace(" ", "_")
        if key:
            out[key] = i
    return out


def get(row, hmap, *keys, default=""):
    for k in keys:
        k2 = norm_key(k).replace(" ", "_")
        if k2 in hmap:
            return cell(row[hmap[k2]]) if hmap[k2] < len(row) else default
    return default


def import_doctors(cur, hq_ids: dict[str, int]):
    file_hq = {
        "Hubli.xlsx": "HUBLI",
        "Gadag.xlsx": "GADAG",
        "Belagavi.xlsx": "BELAGAVI",
        "Belagavi2.xlsx": "BELAGAVI2",
        "Sirsi.xlsx": "SIRSI",
        "Goa.xlsx": "GOA",
    }
    cur.execute("DELETE FROM doctor_masters")
    total = 0
    for fname, hq in file_hq.items():
        path = DOCTORS_DIR / fname
        if not path.exists():
            raise FileNotFoundError(path)
        wb = load_workbook(path, data_only=True)
        ws = wb[wb.sheetnames[0]]  # Sheet1
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue
        hmap = header_map(rows[0])
        area_id = hq_ids[hq]
        n = 0
        sno_idx = hmap.get("S.NO") or hmap.get("S_NO") or hmap.get("SNO") or 0
        for row in rows[1:]:
            name = get(row, hmap, "DOCTOR FULL NAME", "DOCTOR_FULL_NAME")
            if not name:
                continue
            # skip summary / area-section rows (no serial number)
            sno_val = row[sno_idx] if sno_idx is not None and sno_idx < len(row) else None
            if sno_val is None or cell(sno_val) == "":
                continue
            try:
                float(sno_val)
            except (TypeError, ValueError):
                continue
            visits = as_int(get(row, hmap, "NO OF VISIT", "NO_OF_VISIT"), 0)
            # TYPE OF ACTIVITY may be non-string in some sheets
            idx = hmap.get("TYPE_OF_ACTIVITY")
            activity = ""
            if idx is not None and idx < len(row) and row[idx] is not None:
                activity = cell(row[idx])
                # numeric noise like 30 / 0.3 is not a real activity label
                try:
                    float(activity)
                    activity = ""
                except ValueError:
                    pass
            mobile = mobile10(get(row, hmap, "MOBILE NO", "MOBILE_NO", "MOBILE"))
            dob = get(row, hmap, "BIRTH DAY", "BIRTH_DAY", "DATE OF BIRTH")
            ann = get(row, hmap, "ANNIVERSARY DATE", "ANNIVERSARY_DATE")
            cur.execute(
                """
                INSERT INTO doctor_masters (
                  full_name, degree, department, type_of_activity, number_of_visits,
                  city, mobile, address_line1, address_line2, postal_code, state,
                  hospital_number, date_of_birth, wedding_anniversary,
                  area_id, status, created_at, updated_at
                ) VALUES (
                  %s,%s,%s,%s,%s,
                  %s,%s,%s,%s,%s,%s,
                  %s,%s,%s,
                  %s,'active',NOW(),NOW()
                )
                """,
                (
                    name,
                    get(row, hmap, "DEGREE"),
                    get(row, hmap, "SPECIALITY", "SPECIALITY_", "DEPARTMENT"),
                    activity,
                    visits,
                    get(row, hmap, "AREA"),
                    mobile,
                    get(row, hmap, "ADDRESS 1", "ADDRESS_1"),
                    get(row, hmap, "ADDRESS 2", "ADDRESS_2"),
                    get(row, hmap, "PINCODE"),
                    get(row, hmap, "STATE"),
                    get(row, hmap, "HOSPITAL NO", "HOSPITAL_NO", "HOSPITAL NUMBER"),
                    dob,
                    ann,
                    area_id,
                ),
            )
            n += 1
        print(f"  doctors {fname}: {n} -> {hq}")
        total += n
    print(f"Doctors imported: {total}")


def import_chemists(cur, hq_ids: dict[str, int]):
    path = DATA / "CHEMIST LIST.xlsx"
    wb = load_workbook(path, data_only=True)
    cur.execute("DELETE FROM chemist_masters")
    total = 0
    for sheet_name in wb.sheetnames:
        hq = map_hq(sheet_name)
        if not hq:
            print(f"  skip chemist sheet {sheet_name!r}: unknown HQ")
            continue
        area_id = hq_ids[hq]
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        # find header row with CHEMIST NAME
        start = 0
        for i, r in enumerate(rows):
            vals = [norm_key(x) for x in (r or []) if x is not None]
            if any("CHEMIST NAME" in v or v == "CHEMIST_NAME" for v in vals) or (
                "S.NO" in vals or "S NO" in vals or "SNO" in vals
            ) and any("CHEMIST" in v for v in vals):
                start = i
                break
            if "CHEMIST NAME" in vals or "NAME OF THE CHEMIST" in vals:
                start = i
                break
        hmap = header_map(rows[start]) if start < len(rows) else {}
        name_idx = None
        area_idx = None
        for k, idx in hmap.items():
            if "CHEMIST" in k and "NAME" in k:
                name_idx = idx
            elif k in ("NAME_OF_THE_CHEMIST", "NAME"):
                name_idx = idx if name_idx is None else name_idx
            elif k == "AREA":
                area_idx = idx
        if name_idx is None:
            # fallback: col B
            name_idx = 1
            area_idx = 2
        n = 0
        for r in rows[start + 1 :]:
            if not r:
                continue
            name = cell(r[name_idx]) if name_idx < len(r) else ""
            if not name or norm_key(name) in ("CHEMIST NAME", "NAME OF THE CHEMIST", "S.NO"):
                continue
            # skip if first col is header-like
            local_area = cell(r[area_idx]) if area_idx is not None and area_idx < len(r) else ""
            cur.execute(
                """
                INSERT INTO chemist_masters (
                  name, search_place, area_id, status, created_at, updated_at
                ) VALUES (%s,%s,%s,'active',NOW(),NOW())
                """,
                (name, local_area, area_id),
            )
            n += 1
        print(f"  chemists sheet {sheet_name!r}: {n} -> {hq}")
        total += n
    print(f"Chemists imported: {total}")


def import_stockists(cur, hq_ids: dict[str, int]):
    path = DATA / "STOCKIST.xlsx"
    wb = load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]
    rows = list(ws.iter_rows(values_only=True))
    cur.execute("DELETE FROM stockist_masters")
    current_hq = None
    total = 0
    for r in rows:
        if not r or all(v is None or cell(v) == "" for v in r):
            continue
        a = cell(r[0]) if len(r) > 0 else ""
        b = cell(r[1]) if len(r) > 1 else ""
        c = cell(r[2]) if len(r) > 2 else ""
        d = cell(r[3]) if len(r) > 3 else ""
        # section header: blank S.NO, HQ name in AREA col, no email
        mapped = map_hq(b)
        if (not a or not a[0].isdigit()) and mapped and not d and (not c or map_hq(c) == mapped):
            # e.g. (None, 'BELAGAVI', None, None)
            current_hq = mapped
            continue
        if mapped and not a and not d:
            current_hq = mapped
            continue
        # data row: serial + name
        if not b:
            continue
        if norm_key(b) in ("AREA", "HEALTHFIX PHARMA LLP", "YELLAPUR"):
            continue
        if norm_key(a) == "S.NO":
            continue
        if current_hq is None:
            continue
        # if b itself is an HQ section mis-detected as name, skip
        if map_hq(b) and not c and not d:
            current_hq = map_hq(b)
            continue
        area_id = hq_ids[current_hq]
        cur.execute(
            """
            INSERT INTO stockist_masters (name, place, email, area_id, status, created_at, updated_at)
            VALUES (%s,%s,%s,%s,'active',NOW(),NOW())
            """,
            (b, c, d.strip(), area_id),
        )
        total += 1
        print(f"  stockist {b} -> {current_hq}")
    print(f"Stockists imported: {total}")


def import_products(cur):
    path = DATA / "PRODUCT LIST.xlsx"
    wb = load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]
    rows = list(ws.iter_rows(values_only=True))
    cur.execute("DELETE FROM product_masters")
    category = "medical"
    total = 0
    seq = 1
    name_idx, pack_idx = 0, 1
    for r in rows:
        vals = [cell(v) for v in (r or []) if cell(v)]
        if not vals:
            continue
        joined = " ".join(vals).upper()
        # header detection: Material Name | Packing  OR  Sl No | Material Name | Packing
        upper_cells = [norm_key(x) for x in (r or [])]
        if any("MATERIAL NAME" in u for u in upper_cells) or any(u in ("PACKING", "PACK") for u in upper_cells):
            for i, u in enumerate(upper_cells):
                if "MATERIAL" in u or u == "PRODUCT NAME":
                    name_idx = i
                if "PACK" in u:
                    pack_idx = i
            continue
        if joined.strip() == "SURGICAL" or (len(vals) == 1 and vals[0].upper() == "SURGICAL"):
            category = "surgical"
            continue
        if any(x in joined for x in ("PRODUCT LIST", "HEALTHFIX", "YELLAPUR")):
            continue
        if vals[0].upper() in ("SL NO", "SL.NO", "S.NO", "S NO"):
            continue
        name = cell(r[name_idx]) if r and name_idx < len(r) else ""
        packing = cell(r[pack_idx]) if r and pack_idx < len(r) else ""
        # skip serial-only first column rows when name landed on packing
        if name.upper() in ("SURGICAL", "PACKING", "MATERIAL NAME"):
            continue
        if not name:
            continue
        # if name looks like packing only, skip
        if re.fullmatch(r"\d+(PC|PAIR|ML|GM|S|'S)?", name.upper().replace(" ", "")) and not packing:
            continue
        code = f"HF-{category[:3].upper()}-{seq:03d}"
        seq += 1
        cur.execute(
            """
            INSERT INTO product_masters (
              product_code, name, packing, category, description, status, created_at, updated_at
            ) VALUES (%s,%s,%s,%s,%s,'active',NOW(),NOW())
            """,
            (code, name, packing, category, packing),
        )
        total += 1
    print(f"Products imported: {total}")


def ensure_schema(cur):
    # columns that AutoMigrate may not have run yet
    cur.execute(
        """
        ALTER TABLE doctor_masters ADD COLUMN IF NOT EXISTS type_of_activity varchar(64);
        ALTER TABLE doctor_masters ADD COLUMN IF NOT EXISTS number_of_visits integer DEFAULT 0;
        ALTER TABLE product_masters ADD COLUMN IF NOT EXISTS packing varchar(64);
        CREATE TABLE IF NOT EXISTS stockist_masters (
          id bigserial PRIMARY KEY,
          name varchar(255) NOT NULL,
          place varchar(255),
          email varchar(255),
          area_id bigint,
          status varchar(32) DEFAULT 'active',
          created_at timestamptz,
          updated_at timestamptz
        );
        """
    )


def main():
    print("Connecting…")
    conn = connect()
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            ensure_schema(cur)
            print("Ensuring head quarters…")
            hq_ids = ensure_hqs(cur)
            print("  HQ ids:", hq_ids)
            print("Importing doctors…")
            import_doctors(cur, hq_ids)
            print("Importing chemists…")
            import_chemists(cur, hq_ids)
            print("Importing stockists…")
            import_stockists(cur, hq_ids)
            print("Importing products…")
            import_products(cur)
        conn.commit()
        print("DONE")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("IMPORT FAILED:", e, file=sys.stderr)
        raise
