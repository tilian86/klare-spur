#!/usr/bin/env python3

import json
import os
import sys
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


APP_DIR = Path(__file__).resolve().parent
HOME_ENV_FILE = Path.home() / ".klare-spur-env"
LOCAL_ENV_FILE = APP_DIR / ".env.local"
DEFAULT_PORT = 4187
MAX_REQUEST_BYTES = 250_000
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"


def load_env_file(path):
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = value


load_env_file(HOME_ENV_FILE)
load_env_file(LOCAL_ENV_FILE)

MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

SYSTEM_PROMPT = """
Du sortierst chaotische ADHS-freundliche Aufgabenlisten fuer eine deutsche Planungs-App.

Gib fuer jede Eingabezeile GENAU ein Aufgaben-Objekt zurueck, in derselben Reihenfolge, mit demselben Index.
Klassifiziere entschieden. Stelle maximal 3 Rueckfragen fuer echte Blocker.

Regeln:
- bucket "routine": wiederkehrende Gewohnheiten, taegliche Wartung, wiederholte Pflichten
- bucket "project": mehrstufige Ziele, breite Themen, groessere Vorhaben
- bucket "idea": Erkundung, Neugier, Nice-to-have
- bucket "matrix": konkrete, umsetzbare Einzelaufgaben
- Quadranten:
  - "do" = dringend UND wichtig
  - "schedule" = wichtig aber nicht dringend
  - "delegate" = dringend aber wenig wichtig
  - "delete" = weder dringend noch wichtig
- follow_up_question: nur bei echten Blockern, max. 3 insgesamt, sonst leerer String
- suggested_action: kurzer, konkreter naechster Schritt auf Deutsch
- cleaned_title: bereinigter deutscher Aufgabentitel

Antworte NUR mit validem JSON ohne Markdown-Wrapper.
"""

SCHEMA_HINT = """
Erwartetes Format:
{
  "tasks": [
    {
      "index": 0,
      "cleaned_title": "Aufgabentitel",
      "bucket": "matrix|routine|project|idea",
      "quadrant": "do|schedule|delegate|delete",
      "confidence": 85,
      "reasons": ["Grund 1", "Grund 2"],
      "follow_up_question": "",
      "suggested_action": "Naechster Schritt"
    }
  ]
}
"""


def json_response(handler, status_code, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def read_json_request(handler):
    length = int(handler.headers.get("Content-Length", "0"))
    if length <= 0 or length > MAX_REQUEST_BYTES:
        raise ValueError("Ungueltige Request-Groesse.")
    raw = handler.rfile.read(length)
    return json.loads(raw.decode("utf-8"))


def build_user_prompt(payload):
    items = payload.get("items", [])
    lines = [
        f'{item.get("index", i)}. [{item.get("section", "general")}] {item.get("title", "")}'
        for i, item in enumerate(items)
    ]
    return "\n".join([
        "Sortiere diese Aufgaben.",
        SCHEMA_HINT,
        "Aufgaben:",
        *lines,
    ])


def call_claude_sort(payload):
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY fehlt. Bitte in ~/.klare-spur-env oder Umgebung setzen.")

    request_payload = {
        "model": MODEL,
        "max_tokens": 4096,
        "system": SYSTEM_PROMPT.strip(),
        "messages": [
            {"role": "user", "content": build_user_prompt(payload)}
        ],
    }

    req = urllib.request.Request(
        ANTHROPIC_URL,
        data=json.dumps(request_payload).encode("utf-8"),
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": ANTHROPIC_VERSION,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=60) as response:
        api_payload = json.loads(response.read().decode("utf-8"))

    text = api_payload["content"][0]["text"].strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    result = json.loads(text)
    tasks = sorted(result.get("tasks", []), key=lambda t: t.get("index", 0))

    return {"model": MODEL, "tasks": tasks}


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path == "/api/status":
            json_response(self, 200, {
                "ai_enabled": bool(ANTHROPIC_API_KEY),
                "model": MODEL if ANTHROPIC_API_KEY else "",
            })
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/sort":
            json_response(self, 404, {"error": "Nicht gefunden."})
            return

        try:
            payload = read_json_request(self)
            items = payload.get("items", [])
            if not items:
                json_response(self, 400, {"error": "Keine Aufgaben uebergeben."})
                return
            result = call_claude_sort(payload)
            json_response(self, 200, result)
        except RuntimeError as error:
            json_response(self, 503, {"error": str(error)})
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            json_response(self, 502, {"error": "Claude-Request fehlgeschlagen.", "detail": detail[:1200]})
        except (ValueError, json.JSONDecodeError) as error:
            json_response(self, 400, {"error": str(error)})
        except Exception as error:
            json_response(self, 500, {"error": "Interner Serverfehler.", "detail": str(error)})


def main():
    port = int(os.getenv("PORT", DEFAULT_PORT))
    if len(sys.argv) > 1:
        port = int(sys.argv[1])

    host = os.getenv("HOST", "127.0.0.1")
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"◈  Klare Spur laeuft auf http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
