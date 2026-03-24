import { Router } from 'express';
import {
  createArtist,
  createArtwork,
  createCategory,
  getArtworkByIdOrSlug,
  listArtists,
  listArtworks,
  listCategories,
  updateArtist,
  updateArtwork,
  updateCategory,
} from '../services/catalog.service';

type CatalogRouteDeps = {
  listArtworks: typeof listArtworks;
  getArtworkByIdOrSlug: typeof getArtworkByIdOrSlug;
  listArtists: typeof listArtists;
  listCategories: typeof listCategories;
  createArtwork: typeof createArtwork;
  updateArtwork: typeof updateArtwork;
  createArtist: typeof createArtist;
  updateArtist: typeof updateArtist;
  createCategory: typeof createCategory;
  updateCategory: typeof updateCategory;
};

export function createCatalogRouter(deps?: Partial<CatalogRouteDeps>): Router {
  const routeDeps: CatalogRouteDeps = {
    listArtworks,
    getArtworkByIdOrSlug,
    listArtists,
    listCategories,
    createArtwork,
    updateArtwork,
    createArtist,
    updateArtist,
    createCategory,
    updateCategory,
    ...deps,
  };

  const router = Router();

  router.get('/catalog/artworks', async (req, res, next) => {
    try {
      const result = await routeDeps.listArtworks({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
        artist: req.query.artist as string | undefined,
        category: req.query.category as string | undefined,
        minPrice: req.query.minPrice as string | undefined,
        maxPrice: req.query.maxPrice as string | undefined,
        q: req.query.q as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/catalog/artworks/:idOrSlug', async (req, res, next) => {
    try {
      const artwork = await routeDeps.getArtworkByIdOrSlug(req.params.idOrSlug);
      if (!artwork) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artwork not found',
            details: [],
          },
          correlationId: req.headers['x-correlation-id'] || null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: artwork,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/catalog/artists', async (_req, res, next) => {
    try {
      const artists = await routeDeps.listArtists();
      res.status(200).json({
        success: true,
        data: artists,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/catalog/categories', async (_req, res, next) => {
    try {
      const categories = await routeDeps.listCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/artworks', async (req, res, next) => {
    try {
      const created = await routeDeps.createArtwork(req.body);
      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  });

  router.put('/catalog/artworks/:id', async (req, res, next) => {
    try {
      const updated = await routeDeps.updateArtwork(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/artists', async (req, res, next) => {
    try {
      const created = await routeDeps.createArtist(req.body);
      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  });

  router.put('/catalog/artists/:id', async (req, res, next) => {
    try {
      const updated = await routeDeps.updateArtist(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/categories', async (req, res, next) => {
    try {
      const created = await routeDeps.createCategory(req.body);
      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  });

  router.put('/catalog/categories/:id', async (req, res, next) => {
    try {
      const updated = await routeDeps.updateCategory(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
