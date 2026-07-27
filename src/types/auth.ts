export interface GoogleProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface MailAccount {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: "gmail";
  providerAccountId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  tokenType: string;
  isActive: boolean;
  lastSync: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  accounts: MailAccount[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
  expiresAt: Date;
  accessToken: string;
}
