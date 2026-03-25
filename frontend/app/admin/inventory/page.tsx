'use client';

import { useState } from 'react';
import { inventoryApi } from '@/lib/api';
import { isApiError } from '@/lib/http';
import type { InventoryStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineError } from '@/components/ui-states';

export default function AdminInventoryPage() {
  const [artworkId, setArtworkId] = useState('');
  const [deltaQty, setDeltaQty] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<InventoryStatus | null>(null);
  const [error, setError] = useState<{ message: string; correlationId?: string | null } | null>(null);

  const handleAdjust = async () => {
    setError(null);
    try {
      const updated = await inventoryApi.adjustStock({
        artworkId,
        deltaQty: Number(deltaQty),
        reason: reason || undefined,
      });
      setResult(updated);
    } catch (err) {
      if (isApiError(err)) {
        setError({ message: err.message, correlationId: err.correlationId });
      } else {
        setError({ message: 'Không thể điều chỉnh tồn kho.' });
      }
    }
  };

  return (
    <div className="max-w-2xl bg-card border border-border p-6 fade-in">
      <h2 className="text-xl font-serif mb-5">Điều chỉnh tồn kho</h2>
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Mã tác phẩm</Label>
          <Input value={artworkId} onChange={(e) => setArtworkId(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Delta số lượng (+/-)</Label>
          <Input type="number" value={deltaQty} onChange={(e) => setDeltaQty(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Lý do</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <Button onClick={handleAdjust}>Cập nhật tồn kho</Button>
      </div>

      {error && (
        <div className="mt-4">
          <InlineError message={error.message} correlationId={error.correlationId} />
        </div>
      )}

      {result && (
        <div className="mt-6 border border-border p-4 text-sm">
          <p className="font-medium mb-2">Kết quả mới</p>
          <p>Artwork ID: {result.artworkId}</p>
          <p>On hand: {result.onHandQty}</p>
          <p>Reserved: {result.reservedQty}</p>
          <p>Available: {result.availableQty}</p>
        </div>
      )}
    </div>
  );
}
