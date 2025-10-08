import { environment } from "./environment.development";
import { environmentUrls } from "./environment";

export const ApiEndPoints = {
  unique_url: `${environment.baseUrl}${environmentUrls.unique_url}`,
  likelyCpeUrl: `${environment.baseUrl}${environmentUrls.likelyCpeUrl}`,
  addHintUrl: `${environment.baseUrl}${environmentUrls.addHintUrl}`,
  unresolvedAppsUrl: `${environment.baseUrl}${environmentUrls.unresolvedAppsUrl}` ,
  searchVulnerabilityUrl: `${environment.baseUrl}${environmentUrls.searchVulnerabilityUrl}`,
  sendNotificationToAllComputers: `${environment.baseUrl}${environmentUrls.sendNotificationToAllComputers}`,
  getComputerByUuid: `${environment.baseUrl}${environmentUrls.getComputerByUUid}`,
}