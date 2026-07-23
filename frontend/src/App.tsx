import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { RequireStaff } from "./components/RequireStaff";
import { StarfieldBackground } from "./components/StarfieldBackground";
import { LoginPage } from "./pages/LoginPage";
import { StarterSelectionPage } from "./pages/StarterSelectionPage";
import { TreinadorPage } from "./pages/TreinadorPage";
import { PartyPage } from "./pages/PartyPage";
import { PokemonSummaryPage } from "./pages/PokemonSummaryPage";
import { PokedexPage } from "./pages/PokedexPage";
import { PokeMartPage } from "./pages/PokeMartPage";
import { AdminPage } from "./pages/AdminPage";
import { BattlesPage } from "./pages/BattlesPage";
import { BattleRoomPage } from "./pages/BattleRoomPage";

function AppRoutes() {
  const { user, player, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-accent-500">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (player && !player.starter_chosen) {
    return <StarterSelectionPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TreinadorPage />} />
        <Route path="/party" element={<PartyPage />} />
        <Route path="/pokemon/:id" element={<PokemonSummaryPage />} />
        <Route path="/pokedex" element={<PokedexPage />} />
        <Route path="/pokemart" element={<PokeMartPage />} />
        <Route path="/battles" element={<BattlesPage />} />
        <Route path="/battles/:id" element={<BattleRoomPage />} />
        <Route
          path="/admin"
          element={
            <RequireStaff>
              <AdminPage />
            </RequireStaff>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StarfieldBackground />
      <div className="bg-hero-backdrop relative min-h-screen">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}
