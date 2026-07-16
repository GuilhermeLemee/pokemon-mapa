from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import admin, battles, heal_requests, me, players

app = FastAPI(title="Pokémon Mapa API")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(me.router)
app.include_router(players.router)
app.include_router(admin.router)
app.include_router(battles.router)
app.include_router(heal_requests.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
