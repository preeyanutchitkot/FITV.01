from fastapi import APIRouter, Request

import os
import httpx

router = APIRouter()


@router.post("/ai-feedback")
async def ai_feedback(request: Request):
    data = await request.json()
    accuracy = data.get("accuracy", 0)
    body_scores = data.get("bodyPartScores", {})
    prompt = f"""
    ผู้ใช้กำลังออกกำลังกายตามคลิปโค้ช (Trainer)
    ความแม่นยำรวม = {accuracy}%
    คะแนนรายส่วน = {body_scores}
    วิเคราะห์และให้คำแนะนำการปรับท่าทางแบบเข้าใจง่าย (1-2 ประโยค)
    """

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        return {"ai_feedback": "[ERROR] Gemini API key not set in environment variable GEMINI_API_KEY"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            result = resp.json()
            try:
                ai_text = result["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                ai_text = "[ERROR] Gemini response format error"
            return {"ai_feedback": ai_text}
        else:
            return {"ai_feedback": f"[ERROR] Gemini API error: {resp.status_code} {resp.text}"}
