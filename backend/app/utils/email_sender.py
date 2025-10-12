import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv() 

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_invitation_email(to_email: str, role: str = "trainee"):
    msg = EmailMessage()
    msg['Subject'] = "You're invited to join FitAddict!"
    msg['From'] = SMTP_USER
    msg['To'] = to_email

    if role == "trainer":
        role_text = "trainer"
    else:
        role_text = "trainee"

    msg.set_content(f"""
    Hello!

    You've been invited to join FitAddict as a {role_text}.
    Please click the link below to accept the invitation:

    http://localhost:8000/accept?email={to_email}

    Best regards,
    FitAddict Team
    """)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Email sent to {to_email} as {role_text}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise

def send_login_code_email(to_email: str, code: str):
    msg = EmailMessage()
    msg['Subject'] = "Your FitAddict Login Code"
    msg['From'] = SMTP_USER
    msg['To'] = to_email

    msg.set_content(f"""
    Hello!

    Your FitAddict login code is: {code}

    Please enter this code in the app to log in. The code is valid for 10 minutes.

    If you did not request this, please ignore this email.

    Best regards,
    FitAddict Team
    """)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Login code email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send login code email: {e}")
        raise

def send_reject_email(to_email: str, video_title: str, reason: str, login_url: str):
    msg = EmailMessage()
    msg['Subject'] = f"[FitAddict] Video rejected: {video_title}"
    msg['From'] = SMTP_USER
    msg['To'] = to_email

    text = f"""สวัสดี,

วิดีโอของคุณถูกปฏิเสธชั่วคราว

ชื่อวิดีโอ: {video_title}
เหตุผล/คำแนะนำ:
{reason or '-'}

โปรดเข้าสู่ระบบเพื่อแก้ไขและส่งตรวจใหม่ที่ลิงก์:
{login_url}

— FitAddict
"""
    msg.set_content(text)

    reason_html = (reason or '-').replace('\n', '<br/>')

    html = (
        "<div style='font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6'>"
        "<h2>วิดีโอของคุณถูกปฏิเสธชั่วคราว</h2>"
        f"<p><b>ชื่อวิดีโอ:</b> {video_title or '-'}</p>"
        f"<p><b>เหตุผล/คำแนะนำ:</b><br/>{reason_html}</p>"
        "<p>โปรด <b>เข้าสู่ระบบ</b> เพื่อแก้ไขวิดีโอ/รายละเอียด แล้วกด Update เพื่อส่งตรวจใหม่</p>"
        f"<p><a href='{login_url}' "
        "style='display:inline-block;padding:10px 16px;border-radius:8px;background:#7c3aed;"
        "color:#fff;text-decoration:none;font-weight:700'>เข้าสู่ระบบเพื่อแก้ไข</a></p>"
        "<hr/><small>อีเมลนี้ส่งอัตโนมัติจาก FitAddict</small>"
        "</div>"
    )
    msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"[mail] reject mail sent to {to_email}")
    except Exception as e:
        print(f"Failed to send reject email: {e}")
        raise