targetScope = 'resourceGroup'

@description('Short globally unique prefix, lowercase letters and digits only.')
@minLength(3)
@maxLength(12)
param prefix string
param location string = resourceGroup().location
param tags object = {
  workload: 'atlas-travel-search'
  environment: 'dev'
}

var suffix = uniqueString(subscription().subscriptionId, resourceGroup().id)
var safePrefix = toLower(replace(prefix, '-', ''))
var storageName = take('${safePrefix}${suffix}', 24)
var cosmosName = '${safePrefix}-cosmos-${suffix}'
var searchName = '${safePrefix}-search-${suffix}'
var openAiName = '${safePrefix}-aoai-${suffix}'
var contentSafetyName = '${safePrefix}-safety-${suffix}'
var vaultName = take('${safePrefix}-kv-${suffix}', 24)
var sbName = '${safePrefix}-sb-${suffix}'
var workspaceName = '${prefix}-logs'
var appInsightsName = '${prefix}-insights'
var envName = '${prefix}-cae'
var apiName = '${prefix}-api'

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${prefix}-workload-id'
  location: location
  tags: tags
}

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: { retentionInDays: 30 }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
    DisableLocalAuth: true
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  tags: tags
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    isHnsEnabled: true
  }
}

resource lake 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: { deleteRetentionPolicy: { enabled: true, days: 7 } }
}

resource landing 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: lake
  name: 'landing'
  properties: { publicAccess: 'None' }
}

resource search 'Microsoft.Search/searchServices@2024-03-01-Preview' = {
  name: searchName
  location: location
  tags: tags
  sku: { name: 'standard' }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true
    authOptions: { aadOrApiKey: { aadAuthFailureMode: 'http401WithBearerChallenge' } }
    semanticSearch: 'free'
  }
}

resource openai 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: openAiName
  location: location
  kind: 'OpenAI'
  tags: tags
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: openAiName
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true
  }
}

resource safety 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: contentSafetyName
  location: location
  kind: 'ContentSafety'
  tags: tags
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: contentSafetyName
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true
  }
}

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: cosmosName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [{ locationName: location, failoverPriority: 0, isZoneRedundant: false }]
    consistencyPolicy: { defaultConsistencyLevel: 'Session' }
    disableKeyBasedMetadataWriteAccess: true
    publicNetworkAccess: 'Enabled'
    minimalTlsVersion: 'Tls12'
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmos
  name: 'atlas'
  properties: { resource: { id: 'atlas' } }
}

resource runs 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  parent: database
  name: 'runs'
  properties: {
    resource: {
      id: 'runs'
      partitionKey: { paths: ['/tenantId'], kind: 'Hash' }
      defaultTtl: 2592000
    }
  }
}

resource serviceBus 'Microsoft.ServiceBus/namespaces@2024-01-01' = {
  name: sbName
  location: location
  tags: tags
  sku: { name: 'Standard', tier: 'Standard' }
  properties: { minimumTlsVersion: '1.2', publicNetworkAccess: 'Enabled', disableLocalAuth: true }
}

resource ingestionQueue 'Microsoft.ServiceBus/namespaces/queues@2024-01-01' = {
  parent: serviceBus
  name: 'content-ingestion'
  properties: {
    lockDuration: 'PT1M'
    maxDeliveryCount: 5
    deadLetteringOnMessageExpiration: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    requiresDuplicateDetection: true
  }
}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enablePurgeProtection: true
    enableSoftDelete: true
    publicNetworkAccess: 'Enabled'
  }
}

resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: apiName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: { external: true, targetPort: 8080, transport: 'auto', allowInsecure: false }
    }
    template: {
      containers: [{
        name: 'api'
        image: 'mcr.microsoft.com/k8se/quickstart:latest'
        resources: { cpu: json('0.5'), memory: '1Gi' }
        env: [
          { name: 'AZURE_CLIENT_ID', value: identity.properties.clientId }
          { name: 'AZURE_SEARCH_ENDPOINT', value: 'https://${search.name}.search.windows.net' }
          { name: 'AZURE_OPENAI_ENDPOINT', value: openai.properties.endpoint }
          { name: 'COSMOS_ENDPOINT', value: cosmos.properties.documentEndpoint }
          { name: 'SERVICEBUS_NAMESPACE', value: '${serviceBus.name}.servicebus.windows.net' }
          { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: insights.properties.ConnectionString }
        ]
      }]
      scale: { minReplicas: 0, maxReplicas: 5 }
    }
  }
}

output apiUrl string = 'https://${api.properties.configuration.ingress.fqdn}'
output workloadIdentityClientId string = identity.properties.clientId
output searchEndpoint string = 'https://${search.name}.search.windows.net'
output openAiEndpoint string = openai.properties.endpoint
output storageAccountName string = storage.name
