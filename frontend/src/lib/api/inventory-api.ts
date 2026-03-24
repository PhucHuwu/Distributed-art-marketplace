import { request } from '@/lib/http-client';
import { InventoryInfo } from '@/types/inventory';

export async function getInventory(artworkId: string) {
  return request<InventoryInfo>(`/inventory/${artworkId}`);
}
