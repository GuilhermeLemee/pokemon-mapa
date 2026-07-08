# Backend — Pokémon Mapa API

FastAPI + Firebase Admin SDK + Firestore.

## Setup local

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
```

Copie `.env.example` para `.env` e ajuste `FIREBASE_PROJECT_ID`.

Autenticação com o GCP localmente (uma vez):
```powershell
gcloud auth application-default login
```

## Rodar

```powershell
uvicorn app.main:app --reload --port 8080
```

Docs interativas: http://localhost:8080/docs

## Testes

```powershell
pytest
```

## Estrutura

- `app/rules/level_engine.py` — motor de XP/level, isolado para ser reescrito quando as regras oficiais da mesa chegarem.
- `app/auth.py` — validação do Firebase ID Token e checagem de papel (`admin` / `co_mestre` / `jogador`).
- `app/repository.py` — acesso ao Firestore.
- `app/routers/` — endpoints HTTP.
