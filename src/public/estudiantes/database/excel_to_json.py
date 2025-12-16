import pandas as pd
import json
import math

df = pd.read_excel("students.xlsx")

def clean(value):
    if pd.isna(value):
        return ""
    return value

students = []

for _, row in df.iterrows():

    if pd.isna(row["birthday"]):
        birthday = ""
    else:
        birthday = row["birthday"].strftime("%Y-%m-%d")

    students.append({
        "internalId": clean(row["internalId"]),
        "schoolId": clean(str(row["schoolId"])),
        "name": clean(row["name"]),
        "photo": clean(row["photo"]),
        "quote": clean(row["quote"]),
        "birthday": birthday,
        "currentClass": clean(row["currentClass"]),
        "approved": bool(row["approved"]) if not pd.isna(row["approved"]) else False,
        "profileTheme": {
            "background": clean(row["themeBackground"]),
            "accentColor": clean(row["accentColor"])
        }
    })

with open("students.json", "w", encoding="utf-8") as f:
    json.dump({ "students": students }, f, indent=2, ensure_ascii=False)

print("✅ students.json generado correctamente")
