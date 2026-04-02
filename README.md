# Klare Spur

Kleine lokale Web-App fuer ADHS-freundliche Aufgabenpriorisierung:

- wilde To-do-Listen als Text einfuegen
- Screenshots per OCR auslesen
- Aufgaben mit OpenAI oder lokalem Fallback in die Eisenhower-Matrix sortieren
- Rueckfragen fuer unklare Aufgaben anzeigen
- aus den priorisierten Aufgaben einen Tagesplan bauen

## Starten

Die App nutzt lokal einen kleinen Python-Server, damit Frontend und OpenAI-Proxy zusammen laufen:

```bash
cd ~
export OPENAI_API_KEY="dein_key"
export OPENAI_MODEL="gpt-5-mini"
python3 "/Users/florian/Documents/New project/klare-spur/server.py" 4187
```

Dann im Browser `http://127.0.0.1:4187` oeffnen.

Alternativ:

```bash
zsh "/Users/florian/Documents/New project/klare-spur/start-local.command"
```

## Hinweise

- OCR nutzt `tesseract.js` im Browser und benoetigt daher beim ersten Laden Internet fuer das CDN.
- Alle Aufgaben bleiben lokal im Browser per `localStorage` gespeichert.
- Fuer oeffentliche Nutzung muss der OpenAI-Key serverseitig bleiben. Er gehoert nie in das Frontend.
- Wenn `OPENAI_API_KEY` fehlt, faellt die App automatisch auf die lokale Heuristik zurueck.

## Oeffentlicher Link fuer Freunde

Am einfachsten per Vercel:

1. Ordner `klare-spur` in ein Git-Repo legen.
2. Repo bei Vercel importieren.
3. Als Root-Directory den Ordner `klare-spur` waehlen.
4. In Vercel die Umgebungsvariablen setzen:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL=gpt-5-mini`
5. Deployen und den erzeugten HTTPS-Link teilen, z. B. per WhatsApp.

Die App enthaelt dafuer bereits:

- [api/status.js](./api/status.js)
- [api/sort.js](./api/sort.js)
- [vercel.json](./vercel.json)

## Kosten grob

Mit `gpt-5-mini` ist dieses Szenario typischerweise guenstig, weil pro Sortierung nur eine kurze strukturierte Textantwort erzeugt wird.
Trotzdem:

- Stelle im OpenAI-Dashboard ein Budget/Limit fuer dein Projekt ein.
- Teile niemals den Key selbst, sondern nur den Link zur App.
- Fuer kleine private Nutzung mit Freunden ist ein gemeinsamer Backend-Key okay.
- Fuer oeffentliche Verbreitung solltest du spaeter Rate-Limits oder Login ergaenzen.
