import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { STAFF_ROLES, type HealRequest, type Player } from "../lib/types";
import { ACCENT_BUTTON, GLASS_CARD } from "../lib/ui";

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
    <div className={`${GLASS_CARD} space-y-3 p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-accent-200">Centro Pokémon</p>
        {myPending ? (
          <p className="text-sm text-accent-500">Aguardando aprovação do mestre...</p>
        ) : (
          <button onClick={requestHeal} disabled={submitting} className={ACCENT_BUTTON}>
            {submitting ? "Enviando..." : "Solicitar cura"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {isStaff && (
        <div className="space-y-2 border-t border-accent-500/15 pt-3">
          {pendingForStaff.length === 0 ? (
            <p className="text-sm text-accent-500">Nenhum pedido de cura pendente.</p>
          ) : (
            pendingForStaff.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-accent-500/15 px-3 py-2">
                <span className="text-sm text-accent-200">{nameFor(r.uid)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(r.id, true)}
                    className="rounded-lg bg-accent-300 px-3 py-1 text-xs font-medium text-bg-950 hover:bg-accent-200"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => respond(r.id, false)}
                    className="rounded-lg border border-red-400/40 px-3 py-1 text-xs text-red-400"
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
