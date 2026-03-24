import { UserIdentity } from './request';

declare global {
  namespace Express {
    interface Request {
      identity?: UserIdentity;
    }
  }
}

export {};
