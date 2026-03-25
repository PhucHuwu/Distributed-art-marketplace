import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '../src/lib/prisma';
import { getArtworkByIdOrSlug } from '../src/services/catalog.service';

test('getArtworkByIdOrSlug uses slug-only filter for non-UUID values', async () => {
  const artworkDelegate = prisma.artwork as unknown as {
    findFirst: (args: unknown) => Promise<unknown>;
  };

  const originalFindFirst = artworkDelegate.findFirst;
  let capturedArgs: any;

  artworkDelegate.findFirst = async (args: unknown) => {
    capturedArgs = args;
    return null;
  };

  try {
    await getArtworkByIdOrSlug('auto-artwork-1774446070858');
    assert.deepEqual(capturedArgs.where, { slug: 'auto-artwork-1774446070858' });
  } finally {
    artworkDelegate.findFirst = originalFindFirst;
  }
});

test('getArtworkByIdOrSlug keeps ID lookup for UUID values', async () => {
  const artworkDelegate = prisma.artwork as unknown as {
    findFirst: (args: unknown) => Promise<unknown>;
  };

  const originalFindFirst = artworkDelegate.findFirst;
  let capturedArgs: any;

  artworkDelegate.findFirst = async (args: unknown) => {
    capturedArgs = args;
    return null;
  };

  try {
    const id = 'fd1d6b29-3d1e-4e8a-b213-b708ae5dff18';
    await getArtworkByIdOrSlug(id);
    assert.deepEqual(capturedArgs.where, { OR: [{ id }, { slug: id }] });
  } finally {
    artworkDelegate.findFirst = originalFindFirst;
  }
});
