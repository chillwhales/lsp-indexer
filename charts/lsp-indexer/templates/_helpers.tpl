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

{{- define "lsp-indexer.databaseUrl" -}}
{{- $host := default (printf "%s-rw" (include "lsp-indexer.fullname" .)) .Values.postgres.host -}}
{{- printf "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@%s:%v/%s" $host .Values.postgres.port .Values.postgres.database -}}
{{- end -}}
