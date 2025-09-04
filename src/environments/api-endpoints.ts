import { environments } from "./environments";

export const ApiEndPoints = {
  unique_url: `${environments.baseUrl}${environments.unique_url}`,
  likelyCpeUrl: `${environments.baseUrl}${environments.likelyCpeUrl}`,
  addHintUrl: `${environments.baseUrl}${environments.addHintUrl}`,
  unresolvedAppsUrl: `${environments.baseUrl}${environments.unresolvedAppsUrl}` ,
  searchVulnerabilityUrl: `${environments.baseUrl}${environments.searchVulnerabilityUrl}`,
  sendNotificationToAllComputers: `${environments.baseUrl}${environments.sendNotificationToAllComputers}`
}