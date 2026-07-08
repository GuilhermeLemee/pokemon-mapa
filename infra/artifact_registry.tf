resource "google_artifact_registry_repository" "backend" {
  project       = var.project_id
  location      = var.region
  repository_id = "pokemon-mapa-backend"
  description   = "Imagens Docker do backend FastAPI"
  format        = "DOCKER"

  # Mantém só as últimas versões para ficar dentro do free tier (0.5 GB).
  cleanup_policies {
    id     = "keep-last-5"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }

  depends_on = [google_project_service.apis]
}
