export type AuthSession = {
  token: string;
  tokenType: 'Bearer';
  user: {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
};

export type AuthTokenResponse = {
  token: string;
  tokenType: 'Bearer';
};

export type VerifyResponse = {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};
