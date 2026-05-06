# PMO Dashboard (JSON-driven)

Prosty dashboard do wizualizacji statusu projektu PMO na podstawie danych JSON. Projekt jest w pełni frontendowy (HTML + CSS + JavaScript) i działa bez backendu.

## 📌 Opis

Aplikacja prezentuje kluczowe informacje o projekcie:
- status projektu (RAG: Red / Amber / Green)
- score i trend tygodniowy
- KPI
- ryzyka
- działania (actions)
- zadania (tasks)
- harmonogram (timeline)

Dane są renderowane dynamicznie z obiektów JSON w JavaScript.

## 🔧 Dane wejściowe

Dane znajdują się w pliku `index.html`:

```javascript
const data = { ... }
const plans = { ... }
```
