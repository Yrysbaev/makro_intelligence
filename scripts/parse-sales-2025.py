#!/usr/bin/env python3
"""
Convert the QuickBooks "Sales by Product/Service Detail" 2025 export into a compact
JSON dataset the app loads server-side as the fixed 2025 baseline.

Input:  data/2025_sales_detail.xlsx
Output: src/data/sales-2025.json

Keeps only `Invoice` transaction rows (drops Credit Memos, headers, subtotals, footer).
Run from the repo root:  python3 scripts/parse-sales-2025.py
"""
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "2025_sales_detail.xlsx"
OUT = ROOT / "data" / "sales-2025.json"

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

SKU_RE = re.compile(r"#\s*([A-Za-z0-9][A-Za-z0-9\-]*)")
REGION_RE = re.compile(r"^([A-Z]{2,4}):\s*(.+)$")


def num(v):
    if v in (None, ""):
        return 0.0
    try:
        return float(v)
    except ValueError:
        return 0.0


def clean_product(name: str) -> str:
    name = re.sub(r"\s*\(deleted\)\s*$", "", name).strip()
    return name


def parse():
    z = zipfile.ZipFile(SRC)
    shared = []
    ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
    for si in ss.findall("a:si", ns):
        shared.append("".join(t.text or "" for t in si.iter(NS + "t")))

    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = sheet.find("a:sheetData", ns)

    def colof(ref):
        return re.match(r"([A-Z]+)", ref).group(1)

    current_product = None
    current_sku = None
    lines = []
    total = 0.0

    for r in rows.findall("a:row", ns):
        cells = {}
        for c in r.findall("a:c", ns):
            col = colof(c.get("r"))
            t = c.get("t")
            v = c.find("a:v", ns)
            val = v.text if v is not None else None
            if t == "s" and val is not None:
                val = shared[int(val)]
            cells[col] = val

        A = cells.get("A")
        B = cells.get("B")
        C = cells.get("C")

        # Product header row: only column A populated, not a subtotal/total/footer
        if A and not B:
            if A.startswith("Total for ") or A == "TOTAL" or A.startswith("Accrual Basis"):
                continue
            if A in ("TEXAS FROZEN FOOD", "Sales by Product/Service Detail"):
                continue
            if re.match(r"^January 1", A):
                continue
            current_product = clean_product(A)
            m = SKU_RE.search(A)
            current_sku = m.group(1) if m else None
            continue

        # Transaction row
        if C == "Invoice" and B:
            date_m = re.match(r"(\d{2})/(\d{2})/(\d{4})", B)
            if not date_m:
                continue
            iso = f"{date_m.group(3)}-{date_m.group(1)}-{date_m.group(2)}"
            cust_raw = (cells.get("E") or "").strip()
            region = None
            customer = cust_raw
            rm = REGION_RE.match(cust_raw)
            if rm:
                region = rm.group(1)
                customer = rm.group(2).strip()
            amount = round(num(cells.get("I")), 2)
            total += amount
            lines.append({
                "date": iso,
                "invoiceNum": (cells.get("D") or "").strip(),
                "customer": customer or "Unknown",
                "region": region,
                "product": current_product or "Unknown",
                "sku": current_sku,
                "qty": round(num(cells.get("G")), 4),
                "price": round(num(cells.get("H")), 4),
                "amount": amount,
            })

    payload = {
        "period": "2025",
        "sourceFile": SRC.name,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "lineCount": len(lines),
        "totalAmount": round(total, 2),
        "lines": lines,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(payload, f, separators=(",", ":"))

    months = sorted({l["date"][:7] for l in lines})
    customers = {l["customer"] for l in lines}
    products = {l["sku"] or l["product"] for l in lines}
    print(f"lines={len(lines)} total=${total:,.2f}")
    print(f"months={months}")
    print(f"customers={len(customers)} products={len(products)}")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size/1_000_000:.1f} MB)")


if __name__ == "__main__":
    parse()
