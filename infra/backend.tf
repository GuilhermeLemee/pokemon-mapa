# State remoto compartilhado entre sua máquina local e o GitHub Actions.
# O bucket abaixo precisa existir ANTES do primeiro `terraform init`
# (ver infra/README.md, seção "Bootstrap do state").
terraform {
  backend "gcs" {
    bucket = "pokemon-mapa-tfstate" # ajuste se o nome já estiver em uso globalmente
    prefix = "terraform/state"
  }
}
