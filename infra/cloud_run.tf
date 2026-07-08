resource "google_service_account" "backend_runner" {
  project      = var.project_id
  account_id   = "pokemon-mapa-backend"
  display_name = "Pokémon Mapa — Cloud Run backend runtime"
}

# Menor privilégio: só o necessário para ler/escrever Firestore e
# administrar usuários/claims do Firebase Auth.
resource "google_project_iam_member" "backend_runner_datastore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend_runner.email}"
}

resource "google_project_iam_member" "backend_runner_firebase_auth" {
  project = var.project_id
  role    = "roles/firebaseauth.admin"
  member  = "serviceAccount:${google_service_account.backend_runner.email}"
}

resource "google_cloud_run_v2_service" "backend" {
  project  = var.project_id
  name     = "pokemon-mapa-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend_runner.email

    scaling {
      min_instance_count = 0 # scale-to-zero: sem tráfego, custo zero
      max_instance_count = 2 # teto baixo, suficiente para 10 jogadores
    }

    containers {
      image = var.backend_image

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "FIREBASE_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "CORS_ALLOW_ORIGINS"
        value = var.cors_allow_origins
      }
    }
  }

  # A imagem é atualizada pelo pipeline de CI/CD; o Terraform não deve
  # reverter esse deploy em applies subsequentes.
  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }

  depends_on = [google_project_service.apis]
}

# API pública: a autorização real acontece dentro do FastAPI (Firebase ID
# Token + checagem de role), não na camada de rede do Cloud Run.
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
