export interface Vulnerability {
  id: string | null;
  uuid: string;
  cveId: string;
  description: string;
  cvssVersion: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  cvssScore: number;
  cvssVector: string;
  sourceIdentifier: string;
  createdAt: string;
  updatedAt: string | null;
  deleted: boolean;
}

export interface ApplicationDetails {
  uuid: string;
  softwareName: string;
  softwareVersion: string;
  runningProcessIds: Array<number>,
  vendor: string;
  criticalVulnerabilityCount: number;
  highVulnerabilityCount: number;
  mediumVulnerabilityCount: number;
  lowVulnerabilityCount: number;
  vulnerabilities: Vulnerability[];
  cpeName?: string;        // <-- Add this
  resolved?: boolean;   
}

export interface ComputerDetails {
  id?: number;
  uuid: string;
  deviceId: string;
  machineName: string;
  ipAddress: string;
  osVersion: string;
  antivirusStatus: string;
  firewallStatus: string;
  loggedInUserEmail: string;
  loggedInUserName: string;
  installedSoftwareCount: number;
  vulnerableSoftwareCount: number;
  criticalVulnerableApplicationCount: number;
  highVulnerableApplicationCount: number;
  mediumVulnerableApplicationCount: number;
  lowVulnerableApplicationCount: number;
  applicationDetails: ApplicationDetails[];
  createdAt: Date,
  updatedAt: Date,
  selected?: boolean;
}

export interface SecurityReport {
  totalComputers: number;
  vulnerableComputers: number;
  totalCriticalVulnerableApplications: number ;
  totalHighVulnerableApplications: number ;
  totalMediumVulnerableApplications: number ;
  totalLowVulnerableApplications: number ;
  computerDetails: ComputerDetails[];
}
export interface CvssMetric {
  version: string;
  baseSeverity: string;
  baseScore: number;
}

export interface CveResult {
  cveId: string;
  cveDescription: string;
  cvssMetrics: CvssMetric[];
  affectedProducts: { cpeName: string }[];
}

export interface CpeResult {
  cpe23Uri: string;
  vendor: string;
  product: string;
  version: string;
}

