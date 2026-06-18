{{- define "lsp-indexer.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "lsp-indexer.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "lsp-indexer.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | quote }}
app.kubernetes.io/name: {{ include "lsp-indexer.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "lsp-indexer.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lsp-indexer.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "lsp-indexer.databaseHost" -}}
{{- $host := default (printf "%s-rw" (include "lsp-indexer.fullname" .)) .Values.postgres.host -}}
{{- $host -}}
{{- end -}}

{{- define "lsp-indexer.databaseAddress" -}}
{{- printf "%s:%v/%s" (include "lsp-indexer.databaseHost" .) .Values.postgres.port .Values.postgres.database -}}
{{- end -}}

{{- define "lsp-indexer.postgresPasswordSecretName" -}}
{{- default .Values.cnpg.bootstrap.secretName .Values.postgres.passwordSecret.name -}}
{{- end -}}

{{- define "lsp-indexer.encodedPostgresPasswordScript" -}}
encoded_postgres_password="$(printf '%s' "$POSTGRES_PASSWORD" | sed -e 's/%/%25/g' -e 's/+/%2B/g' -e 's#/#%2F#g' -e 's/=/%3D/g' -e 's/:/%3A/g' -e 's/@/%40/g' -e 's/#/%23/g' -e 's/&/%26/g' -e 's/ /%20/g')"
{{- end -}}

{{- define "lsp-indexer.databaseUrlScript" -}}
{{ include "lsp-indexer.encodedPostgresPasswordScript" . }}
database_url="postgresql://${POSTGRES_USER}:${encoded_postgres_password}@{{ include "lsp-indexer.databaseAddress" . }}"
{{- end -}}

{{- define "lsp-indexer.hasuraMetadataDefaults" -}}
{{- $connectorBaseUrl := printf "http://%s-data-connector-agent:8081/api/v1" (include "lsp-indexer.fullname" .) -}}
{{- $dataconnector := dict -}}
{{- range $name, $path := .Values.hasura.metadataDefaults.dataConnectors -}}
{{- $_ := set $dataconnector $name (dict "uri" (printf "%s/%s" $connectorBaseUrl $path)) -}}
{{- end -}}
{{- dict "backend_configs" (dict "dataconnector" $dataconnector) | toJson -}}
{{- end -}}
