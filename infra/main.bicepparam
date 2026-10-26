using './main.bicep'

param prefix = 'atlasdev'
param location = 'westeurope'
param tags = {
  workload: 'atlas-travel-search'
  environment: 'dev'
  dataClassification: 'demo'
}
