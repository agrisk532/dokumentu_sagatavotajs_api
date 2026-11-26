# Dokumentu sagatavotājs (API)

Tīmekļa lietotne, kurā iestādes darbinieks izvēlas dokumenta veidni, ievada datus un saņem gatavu dokumentu. Priekšskatījums un PDF tiek sagatavoti serverī. Pārlūks ar serveri runā tikai caur HTTP API.

Šis risinājums ir atdalīts no klienta puses lietotnes `dokumentu_sagatavotajs`.

## Kā tas sadalīts

- `frontend` — React saskarne. Tā ielādē veidņu sarakstu, nosūta ievadītos datus un parāda servera atbildi.
- `backend` — Express API. Tas glabā veidnes, ievieto laukus (`{vards}`, `{datums}` un pārējos) un izveido PDF.

| Metode | Ceļš | Ko dara |
| --- | --- | --- |
| GET | `/api/templates` | Atgriež veidņu nosaukumus un aprakstus |
| POST | `/api/documents/preview` | Atgriež aizpildītu dokumenta tekstu |
| POST | `/api/documents/pdf` | Atgriež PDF failu |
| GET | `/api/health` | Pārbauda, ka API darbojas |

Dati netiek glabāti datubāzē. Katrs pieprasījums tiek apstrādāts un atbilde nosūtīta atpakaļ.

## Palaišana

Nepieciešams Node.js 22 vai jaunāks.

```bash
npm install
npm test
npm run dev
```

Izstrādes režīmā saskarne ir pieejama adresē http://localhost:5173 un API adresē http://127.0.0.1:3001. Vite pārsūta `/api` pieprasījumus uz API.

Produkcijas režīmā API apkalpo arī sabūvēto saskarni:

```bash
npm run build
npm start
```

Tad atveriet http://127.0.0.1:3001.

PDF fontu Source Serif 4 licence ir `backend/fonts/LICENSE.md`.
