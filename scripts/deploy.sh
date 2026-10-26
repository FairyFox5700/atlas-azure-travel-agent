#!/usr/bin/env bash
set -euo pipefail
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-atlas-travel-dev}"
LOCATION="${LOCATION:-westeurope}"
az bicep build --file infra/main.bicep >/dev/null
az bicep build-params --file infra/main.bicepparam >/dev/null
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
az deployment group create --resource-group "$RESOURCE_GROUP" --template-file infra/main.bicep --parameters infra/main.bicepparam
