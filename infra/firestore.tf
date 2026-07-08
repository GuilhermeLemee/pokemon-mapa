# O banco Firestore em si é criado aqui, mas a ATIVAÇÃO do produto Firebase
# no projeto (necessária para Firebase Auth) é feita manualmente uma única
# vez — ver infra/README.md.

resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # Impede exclusão acidental do banco via terraform destroy.
  deletion_policy = "ABANDON"

  depends_on = [google_project_service.apis]
}
