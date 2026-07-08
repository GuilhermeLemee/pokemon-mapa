output "cloud_run_url" {
  description = "URL pública do backend no Cloud Run"
  value       = google_cloud_run_v2_service.backend.uri
}

output "artifact_registry_repo" {
  description = "Caminho do repositório Docker no Artifact Registry"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.backend.repository_id}"
}

output "workload_identity_provider" {
  description = "Resource name do provider OIDC — usar em google-github-actions/auth"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account_email" {
  description = "Service account que o GitHub Actions usa para deploy"
  value       = google_service_account.deployer.email
}
