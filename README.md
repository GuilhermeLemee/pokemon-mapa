# Pokémon Mapa

Aplicação web para gerenciar fichas de jogadores de uma mesa de RPG de Pokémon (papel + dados), substituindo o controle manual em papel.

- **Jogadores** fazem login e veem sua ficha (level, HP, XP, pokébolas, moedas, insígnias, pokémons).
- **Admin / Co-mestre** lançam a experiência ganha em batalha para um pokémon específico; o sistema aplica as regras de level up.

## Stack

| Camada    | Tecnologia |
|-----------|------------|
| Frontend  | React + Vite + TypeScript, hospedado no Firebase Hosting |
| Backend   | Python + FastAPI, containerizado, hospedado no Cloud Run (scale-to-zero) |
| Auth      | Firebase Authentication (email/senha) |
| Banco     | Firestore (Native mode) |
| IaC       | Terraform (`infra/`) |
| CI/CD     | GitHub Actions (`.github/workflows/`) |

Hospedagem 100% dentro da camada *always free* do GCP/Firebase — custo esperado: **R$ 0**.

## Estrutura

```
frontend/   React + Vite + TS
backend/    FastAPI
infra/      Terraform
docs/       Regras do jogo e decisões de arquitetura
```

## Desenvolvimento local

Ver README dentro de cada pasta (`frontend/README.md`, `backend/README.md`, `infra/README.md`) para instruções específicas.
