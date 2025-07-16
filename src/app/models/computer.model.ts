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
  vendor: string;
  criticalVulnerabilityCount: number;
  highVulnerabilityCount: number;
  mediumVulnerabilityCount: number;
  lowVulnerabilityCount: number;
  vulnerabilities: Vulnerability[];
}

export interface ComputerDetails {
  uuid: string;
  deviceId: string;
  machineName: string;
  ipAddress: string;
  osVersion: string;
  antivirusStatus: string;
  firewallStatus: string;
  loggedInUser: string;
  installedSoftwareCount: number;
  vulnerableSoftwareCount: number;
  criticalVulnerabilityCount: number;
  highVulnerabilityCount: number;
  mediumVulnerabilityCount: number;
  lowVulnerabilityCount: number;
  applicationDetails: ApplicationDetails[];
}

export interface SecurityReport {
  totalComputers: number;
  vulnerableComputers: number;
  computerDetails: ComputerDetails[];
}