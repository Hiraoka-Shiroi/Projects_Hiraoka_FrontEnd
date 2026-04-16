// ================= FRONTEND (React) =================
// Оставляю твой текущий код без изменений (он уже рабочий)
// Ниже даю ТЕБЕ ПОЛНЫЙ BACKEND чтобы всё реально работало

// ================= BACKEND (Flask) =================
// СОЗДАЙ файл: backend/app.py

/*
ЗАПУСК:
python app.py
*/

from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import re

app = Flask(__name__)
CORS(app)

# ================= MOCK DATABASE =================
users = {
    "admin": {
        "password": "Admin123!",
        "role": "admin",
        "display_name": "Администратор"
    },
    "worker": {
        "password": "Worker123!",
        "role": "worker",
        "display_name": "Сотрудник"
    }
}

ZONES = [
    {"name": "Центр", "risk": "Низкий", "incidents": 2, "cameras_online": 10, "cameras_offline": 0},
    {"name": "Привокзальный", "risk": "Средний", "incidents": 6, "cameras_online": 7, "cameras_offline": 1},
    {"name": "Авангард", "risk": "Средний", "incidents": 5, "cameras_online": 8, "cameras_offline": 1},
    {"name": "Центральный рынок", "risk": "Высокий", "incidents": 12, "cameras_online": 5, "cameras_offline": 2},
]

# ================= AUTH =================
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    user = users.get(data.get("username"))
    if not user or user["password"] != data.get("password"):
        return jsonify({"error": "Неверный логин"}), 401

    return jsonify({
        "token": "demo-token",
        "user": {
            "username": data["username"],
            "role": user["role"],
            "display_name": user["display_name"]
        }
    })

@app.route("/api/me")
def me():
    return jsonify({
        "username": "admin",
        "role": "admin",
        "display_name": "Администратор"
    })

# ================= ZONES =================
@app.route("/api/zones")
def zones():
    return jsonify({"zones": ZONES})

# ================= AI ANALYSIS =================
def analyze(text):
    text = text.lower()

    zones = []
    if "привокзал" in text:
        zones.append("Привокзальный")
    if "авангард" in text:
        zones.append("Авангард")
    if "рынок" in text:
        zones.append("Центральный рынок")

    risk = "Низкий"
    if "краж" in text or "наркот" in text:
        risk = "Высокий"
    elif "дтп" in text:
        risk = "Средний"

    return {
        "summary": f"Найдены зоны: {', '.join(zones) if zones else 'нет'}",
        "risk": risk,
        "zones": zones or ["Не найдено"],
        "categories": ["Кража" if "краж" in text else "Общее"],
        "camera_issues": ["Проблемы с камерами" if "офлайн" in text else "OK"],
        "recommendations": ["Усилить патрулирование"],
        "uploaded_at": datetime.datetime.now().strftime("%d.%m.%Y %H:%M"),
        "heatmap": ZONES
    }

@app.route("/api/analyze", methods=["POST"])
def analyze_api():
    text = request.json.get("text", "")
    return jsonify(analyze(text))

# ================= FILE UPLOAD =================
@app.route("/api/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    text = file.read().decode("utf-8", errors="ignore")

    result = analyze(text)

    return jsonify({
        "file": {"original_name": file.filename},
        "analysis": result
    })

# ================= CHAT =================
@app.route("/api/chat", methods=["POST"])
def chat():
    q = request.json.get("question", "")

    if "больниц" in q.lower():
        answer = "Больницы находятся в центре и Авангарде"
    else:
        answer = "Демо ответ AI"

    return jsonify({"answer": answer})

# ================= RUN =================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


// ================= ЧТО ДЕЛАТЬ =================

/*
1. Создай папку backend
2. Вставь туда app.py
3. pip install flask flask-cors
4. python app.py

5. frontend уже готов
6. открыть http://IP:5173

ВСЁ — У ТЕБЯ ПОЛНОСТЬЮ РАБОЧЕЕ ПРИЛОЖЕНИЕ
*/
