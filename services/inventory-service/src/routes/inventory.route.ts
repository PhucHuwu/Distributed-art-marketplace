import { Router } from 'express';
import {
  adjustInventory,
  getInventoryByArtworkId,
  releaseInventory,
  reserveInventory,
} from '../services/inventory.service';

type InventoryRouteDeps = {
  getInventoryByArtworkId: typeof getInventoryByArtworkId;
  adjustInventory: typeof adjustInventory;
  reserveInventory: typeof reserveInventory;
  releaseInventory: typeof releaseInventory;
};

export function createInventoryRouter(deps?: Partial<InventoryRouteDeps>): Router {
  const routeDeps: InventoryRouteDeps = {
    getInventoryByArtworkId,
    adjustInventory,
    reserveInventory,
    releaseInventory,
    ...deps,
  };

  const router = Router();

  router.get('/inventory/:artworkId', async (req, res, next) => {
    try {
      const result = await routeDeps.getInventoryByArtworkId(req.params.artworkId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/inventory/adjust', async (req, res, next) => {
    try {
      const result = await routeDeps.adjustInventory(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/inventory/reserve', async (req, res, next) => {
    try {
      const result = await routeDeps.reserveInventory(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/inventory/release', async (req, res, next) => {
    try {
      const result = await routeDeps.releaseInventory(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
