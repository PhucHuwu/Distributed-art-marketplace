import {
  adjustStock,
  getStockByArtworkId,
  releaseStock,
  reserveStock,
} from './inventory.repository';

export async function getInventoryByArtworkId(artworkId: string) {
  return getStockByArtworkId(artworkId);
}

export async function adjustInventory(payload: unknown) {
  return adjustStock(payload);
}

export async function reserveInventory(payload: unknown) {
  return reserveStock(payload);
}

export async function releaseInventory(payload: unknown) {
  return releaseStock(payload);
}
