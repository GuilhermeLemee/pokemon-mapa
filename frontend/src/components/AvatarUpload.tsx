import { useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const AVATAR_SIZE = 160;

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas indisponível"));
        return;
      }
      const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarUpload({ uid, avatarUrl }: { uid: string; avatarUrl: string | null }) {
  const { refreshPlayer } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await resizeToDataUrl(file);
      await api.post(`/players/${uid}/avatar`, { data_url: dataUrl });
      await refreshPlayer();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao enviar a foto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative block h-28 w-28 overflow-hidden rounded-full border-[5px] border-white bg-neutral-100 shadow-[0_0_0_3px_#dc0a2d,0_10px_25px_-8px_rgba(0,0,0,0.5)]"
        aria-label="Trocar foto de perfil"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Foto do treinador" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-black text-neutral-300">?</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? "Enviando..." : "Trocar foto"}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="absolute top-full mt-1 w-40 text-xs text-red-600">{error}</p>}
    </div>
  );
}
