variable "project_id" {
  description = "ID do projeto GCP (ex.: pokemon-mapa-dev)"
  type        = string
}

variable "region" {
  description = "Região do GCP para os recursos"
  type        = string
  default     = "us-central1"
}

variable "github_repo" {
  description = "Repositório GitHub no formato owner/repo, autorizado a fazer deploy via OIDC"
  type        = string
  default     = "GuilhermeLemee/pokemon-mapa"
}

variable "backend_image" {
  description = "Imagem inicial do backend (o pipeline de CI substitui isso em deploys subsequentes)"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "cors_allow_origins" {
  description = "Origens permitidas no CORS do backend (domínio do Firebase Hosting)"
  type        = string
  default     = "http://localhost:5173"
}
