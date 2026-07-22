import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { STAFF_ROLES, type HealRequest, type Player } from "../lib/types";

const RED_BG = "linear-gradient(180deg,#e5153a,#c00822)";

export function HealCenterPanel() {
  const { player } = useAuth();
  const [requests, setRequests] = useState<HealRequest[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isStaff = player && STAFF_ROLES.includes(player.role);

  const load = () => {
    api.get<HealRequest[]>("/heal-requests").then(setRequests);
    if (isStaff) api.get<Player[]>("/players").then(setPlayers);
  };

  useEffect(load, [isStaff]);

  const myPending = requests.find((r) => r.uid === player?.uid && r.status === "pending");
  const pendingForStaff = isStaff ? requests.filter((r) => r.status === "pending") : [];

  const requestHeal = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/heal-requests", {});
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao solicitar cura.");
    } finally {
      setSubmitting(false);
    }
  };

  const respond = async (id: string, approve: boolean) => {
    try {
      await api.post(`/heal-requests/${id}/${approve ? "approve" : "decline"}`, {});
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao responder pedido de cura.");
    }
  };

  const nameFor = (uid: string) => players.find((p) => p.uid === uid)?.display_name ?? uid;

  return (
    <div className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Centro Pokémon</p>
        {myPending ? (
          <p className="text-sm text-white/40">Aguardando aprovação do mestre...</p>
        ) : (
          <button
            onClick={requestHeal}
            disabled={submitting}
            className="rounded-full px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50"
            style={{ background: RED_BG }}
          >
            {submitting ? "Enviando..." : "Solicitar cura"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {isStaff && (
        <div className="space-y-2 border-t border-white/10 pt-3">
          {pendingForStaff.length === 0 ? (
            <p className="text-sm text-white/35">Nenhum pedido de cura pendente.</p>
          ) : (
            pendingForStaff.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
                <span className="text-sm text-white/90">{nameFor(r.uid)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(r.id, true)}
                    className="rounded-lg px-3 py-1 text-xs font-bold text-white"
                    style={{ background: RED_BG }}
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => respond(r.id, false)}
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-white/60 ring-1 ring-white/15 hover:text-white/90"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
