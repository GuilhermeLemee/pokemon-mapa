# Infraestrutura (Terraform)

Provisiona: Firestore, Artifact Registry, Cloud Run (backend), service accounts com privilégio mínimo, e Workload Identity Federation para o GitHub Actions publicar sem chave estática.

**Fora do Terraform** (o provider do GCP para Firebase é limitado, então estes passos são manuais e feitos **uma única vez**):
- Ativar o Firebase no projeto GCP
- Ativar o método de login "Email/senha" no Firebase Authentication
- Criar o site do Firebase Hosting

## Pré-requisitos (uma única vez)

1. Crie uma conta no [Google Cloud](https://console.cloud.google.com/) se ainda não tiver.
2. Crie um projeto novo (anote o **Project ID**, ex.: `pokemon-mapa-dev`):
   ```powershell
   gcloud auth login
   gcloud projects create pokemon-mapa-dev --name="Pokémon Mapa"
   gcloud config set project pokemon-mapa-dev
   ```
3. Vincule uma conta de faturamento ao projeto (obrigatório mesmo para uso 100% gratuito — o GCP exige billing habilitado para Cloud Run/Firestore, mas dentro do *always free tier* não há cobrança nesta escala de uso).
   ```powershell
   gcloud billing accounts list
   gcloud billing projects link pokemon-mapa-dev --billing-account=SEU_BILLING_ACCOUNT_ID
   ```
4. Ative o Firebase no projeto (console): https://console.firebase.google.com/ → "Adicionar projeto" → selecione o projeto GCP que você já criou (não crie um novo).
5. No console do Firebase: **Authentication** → **Sign-in method** → ative **Email/senha**.
6. No console do Firebase: **Hosting** → clique em "Começar" (não precisa configurar deploy ainda, o GitHub Actions cuida disso).

## Bootstrap do state remoto

O Terraform guarda o state num bucket do Cloud Storage (`infra/backend.tf`), compartilhado entre sua máquina e o GitHub Actions. Esse bucket precisa existir **antes** do primeiro `terraform init`:

```powershell
gsutil mb -l us-central1 gs://pokemon-mapa-tfstate
gsutil versioning set on gs://pokemon-mapa-tfstate
```

Se o nome já estiver em uso (buckets do GCS são globais), escolha outro e ajuste em `infra/backend.tf`.

## Primeiro apply

```powershell
cd infra
cp terraform.tfvars.example terraform.tfvars   # ajuste project_id/region
terraform init
terraform plan
terraform apply
```

Depois do apply, libere o bucket de state para a service account de deploy usar no CI:
```powershell
gsutil iam ch serviceAccount:$(terraform output -raw deployer_service_account_email):roles/storage.objectAdmin gs://pokemon-mapa-tfstate
```

Isso cria a infraestrutura do **backend**. O `google_cloud_run_v2_service.backend` sobe inicialmente com uma imagem placeholder (`cloudrun/hello`) — o primeiro deploy real acontece pelo pipeline de CI/CD (`.github/workflows/backend.yml`) quando você fizer push para `main`.

## Configurar o GitHub Actions

Depois do `terraform apply`, pegue os outputs:
```powershell
terraform output
```

No GitHub, em **Settings → Secrets and variables → Actions**, crie estas *variables* (não são secrets, pois OIDC não usa chave estática):
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_WORKLOAD_IDENTITY_PROVIDER` (output `workload_identity_provider`)
- `GCP_DEPLOYER_SA_EMAIL` (output `deployer_service_account_email`)
- `FIREBASE_PROJECT_ID` (mesmo valor de `GCP_PROJECT_ID`)

O deploy do Firebase Hosting também usa a mesma identidade OIDC (Workload Identity) do Cloud Run — não é necessário nenhum token ou chave estática salva no GitHub.

## Custo

Todos os recursos aqui ficam dentro da camada *always free* do GCP para o volume de uso de até 10 jogadores:
- Cloud Run: 2 milhões de requisições/mês grátis, `min_instance_count = 0` (não cobra parado)
- Firestore: 1 GiB armazenado + 50k leituras/20k escritas por dia grátis
- Artifact Registry: 0.5 GB grátis (por isso a `cleanup_policy` mantendo só as 5 imagens mais recentes)
- Firebase Hosting: 10 GB armazenados / 360 MB por dia de transferência grátis
- Firebase Authentication: gratuito para login por email/senha, sem limite relevante nessa escala
