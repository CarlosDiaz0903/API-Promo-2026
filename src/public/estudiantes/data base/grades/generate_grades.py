import json

# 🔹 CAMBIAS SOLO ESTO
PERIOD = "2025-B4"

INPUT_STUDENTS = "../students.json"
OUTPUT_FILE = f"{PERIOD}.json"

with open(INPUT_STUDENTS, "r", encoding="utf-8") as f:
    students = json.load(f)["students"]

grades = {}

for s in students:
    sid = s["internalId"]

    grades[sid] = {
        "_meta": f'{s["name"]} ({s["currentClass"]})',

        "MAT": ["", "", "", ""],
        "COM": ["", "", ""],
        "DPCC": ["", ""],
        "ART": ["", ""],
        "CYT": ["", "", ""],
        "CCSS": ["", "", ""],
        "ING": ["", "", ""],
        "REL": ["", ""],
        "EDUF": ["", "", ""],
        "FRA": ["", "", ""],
        "EPT": [""],
        "ALE": ["", "", ""],
        "TRANS": ["", ""]
    }

output = {
    "period": PERIOD,
    "grades": grades
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"✅ {OUTPUT_FILE} generado correctamente")
