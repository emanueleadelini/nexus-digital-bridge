export type UserRole = 'Company' | 'Institute' | 'Admin';
export type UserStatus = 'Pending' | 'Approved' | 'Rejected';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string | null;
  lastName?: string | null;
  createdAt?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  sectorIds: string[];
  vatNumber?: string | null;
  address?: string | null;
  website?: string | null;
  description?: string | null;
  isDemo?: boolean;
  createdAt?: string;
}

export interface InstituteProfile {
  id: string;
  name: string;
  email: string;
  sectorIds: string[];
  types: string[];
  address?: string | null;
  isDemo?: boolean;
  createdAt?: string;
}

export interface StudentCV {
  id: string;
  instituteId: string;
  instituteName?: string;
  name: string;
  studentClass?: string;
  class?: string;
  cvInformation: string;
  sectorIds: string[];
  skills?: string[];
  pdfPath?: string | null;
  matchScore?: number;
  commonSectors?: string[];
  isDemo?: boolean;
  createdAt?: string;
}

export interface MatchResult {
  student: StudentCV;
  matchScore: number;
  commonSectors: string[];
}

export interface InterestedCompany {
  companyId: string;
  companyName: string;
  matchScore: number;
  commonSectors: string[];
  chatStarted: boolean;
}

export interface InstituteMatchEntry {
  student: StudentCV;
  interestedCompanies: InterestedCompany[];
}

export interface Chat {
  id: string;
  companyId: string;
  instituteId: string;
  studentCvId?: string | null;
  companyName?: string;
  instituteName?: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastSenderId?: string | null;
  messageCount?: number;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderEmail: string;
  senderRole: UserRole | "sistema";
  text: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}
