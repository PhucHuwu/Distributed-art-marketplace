import { Router } from 'express';
import { auth } from '../middlewares/auth';
import {
  createAddress,
  deleteAddress,
  getOrCreateProfile,
  listAddresses,
  updateAddress,
  updateProfile,
} from '../services/profile.service';

type RouterDeps = {
  getOrCreateProfile?: typeof getOrCreateProfile;
  updateProfile?: typeof updateProfile;
  listAddresses?: typeof listAddresses;
  createAddress?: typeof createAddress;
  updateAddress?: typeof updateAddress;
  deleteAddress?: typeof deleteAddress;
};

type AddressCreatePayload = {
  recipient?: string;
  phoneNumber?: string;
  line1?: string;
  line2?: string;
  ward?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  isDefault?: boolean;
};

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function registerUserRoutes(router: Router, jwtSecret: string, deps: Required<RouterDeps>): void {
  router.use(auth(jwtSecret));

  router.get('/users/me', async (req, res, next) => {
    try {
      const profile = await deps.getOrCreateProfile(req.identity!.userId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  });

  router.put('/users/me', async (req, res, next) => {
    try {
      const { fullName, phoneNumber, avatarUrl } = req.body as {
        fullName?: string;
        phoneNumber?: string;
        avatarUrl?: string;
      };

      if (
        (fullName !== undefined && typeof fullName !== 'string') ||
        (phoneNumber !== undefined && typeof phoneNumber !== 'string') ||
        (avatarUrl !== undefined && typeof avatarUrl !== 'string')
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid profile payload',
            details: [],
          },
        });
        return;
      }

      const profile = await deps.updateProfile(req.identity!.userId, {
        fullName,
        phoneNumber,
        avatarUrl,
      });

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  });

  router.get('/users/me/addresses', async (req, res, next) => {
    try {
      const addresses = await deps.listAddresses(req.identity!.userId);
      res.status(200).json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  });

  router.post('/users/me/addresses', async (req, res, next) => {
    try {
      const { recipient, phoneNumber, line1, line2, ward, district, city, postalCode, isDefault } =
        req.body as AddressCreatePayload;

      if (
        !isString(recipient) ||
        !isString(phoneNumber) ||
        !isString(line1) ||
        !isString(ward) ||
        !isString(district) ||
        !isString(city)
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required address fields',
            details: [],
          },
        });
        return;
      }

      const address = await deps.createAddress(req.identity!.userId, {
        recipient,
        phoneNumber,
        line1,
        line2,
        ward,
        district,
        city,
        postalCode,
        isDefault,
      });

      res.status(201).json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  });

  router.put('/users/me/addresses/:id', async (req, res, next) => {
    try {
      const address = await deps.updateAddress(req.identity!.userId, req.params.id, req.body);
      if (!address) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Address not found',
            details: [],
          },
        });
        return;
      }

      res.status(200).json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/users/me/addresses/:id', async (req, res, next) => {
    try {
      const deleted = await deps.deleteAddress(req.identity!.userId, req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Address not found',
            details: [],
          },
        });
        return;
      }

      res.status(200).json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  });
}

export function createUserRouter(jwtSecret: string): Router {
  return createUserRouterWithDeps(jwtSecret, {});
}

export function createUserRouterWithDeps(jwtSecret: string, deps: RouterDeps): Router {
  const router = Router();
  registerUserRoutes(router, jwtSecret, {
    getOrCreateProfile: deps.getOrCreateProfile || getOrCreateProfile,
    updateProfile: deps.updateProfile || updateProfile,
    listAddresses: deps.listAddresses || listAddresses,
    createAddress: deps.createAddress || createAddress,
    updateAddress: deps.updateAddress || updateAddress,
    deleteAddress: deps.deleteAddress || deleteAddress,
  });

  return router;
}
