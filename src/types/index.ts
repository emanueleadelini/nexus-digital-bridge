import type { Timestamp } from "firebase/firestore";

export type UserRole = 'Company' | 'Institute' | 'Admin';
export type UserStatus = 'Pending' | 'Approved' | 'Rejected';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  sectorIds: string[];
  vatNumber?: string;
  address?: string;
  website?: string;
  description?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface InstituteProfile {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  sectorIds: string[];
  types: string[];
  address?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface StudentCV {
  id: string;
  instituteId: string;
  name: string;
  class: string;
  cvInformation: string;
  sectorIds: string[];
  isDemo?: boolean;
  createdAt: string;
}

export interface MatchResult {
  student: StudentCV;
  matchScore: number;
  commonSectors: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderEmail: string;
  senderRole: UserRole | "sistema";
  text: string;
  createdAt: Timestamp;
}