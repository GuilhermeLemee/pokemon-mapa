# Permite o GitHub Actions se autenticar no GCP via OIDC, sem precisar
# armazenar uma chave de service account como secret.

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions"

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  # Só o repositório configurado pode assumir a identidade — evita que
  # qualquer outro repo do GitHub finja ser este projeto.
  attribute_condition = "assertion.repository == \"${var.github_repo}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "deployer" {
  project      = var.project_id
  account_id   = "pokemon-mapa-deployer"
  display_name = "Pokémon Mapa — GitHub Actions deployer"
}

resource "google_service_account_iam_member" "github_impersonation" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

# Permissões mínimas para publicar imagem e atualizar o serviço Cloud Run.
resource "google_project_iam_member" "deployer_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_project_iam_member" "deployer_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# Necessário para o deployer poder "atuar como" a service account que o
# Cloud Run vai usar em runtime.
resource "google_service_account_iam_member" "deployer_can_act_as_backend_runner" {
  service_account_id = google_service_account.backend_runner.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

# Permite o deployer publicar no Firebase Hosting via OIDC também — evita
# precisar de um token estático do Firebase CLI como secret no GitHub.
resource "google_project_iam_member" "deployer_firebase_hosting" {
  project = var.project_id
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}
