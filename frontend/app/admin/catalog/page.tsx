'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  adminCatalogApi,
  catalogApi,
  type AdminArtistPayload,
  type AdminArtworkPayload,
  type AdminCategoryPayload,
} from '@/lib/api';
import type { CatalogArtist, CatalogArtwork, CatalogCategory } from '@/lib/types';
import { isApiError } from '@/lib/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { InlineError, LoadingSpinner } from '@/components/ui-states';

type UiError = { message: string; correlationId?: string | null } | null;

function toSlug(input: string): string {
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

  return normalized
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toUiError(err: unknown, fallback: string): UiError {
  if (isApiError(err)) {
    return { message: err.message, correlationId: err.correlationId };
  }

  return { message: fallback };
}

export default function AdminCatalogPage() {
  const [artworks, setArtworks] = useState<CatalogArtwork[]>([]);
  const [artists, setArtists] = useState<CatalogArtist[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<UiError>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const [artistDraft, setArtistDraft] = useState<AdminArtistPayload>({ name: '', slug: '', bio: '' });
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);

  const [categoryDraft, setCategoryDraft] = useState<AdminCategoryPayload>({
    name: '',
    slug: '',
    description: '',
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [artworkDraft, setArtworkDraft] = useState<AdminArtworkPayload>({
    title: '',
    slug: '',
    description: '',
    price: 0,
    currency: 'VND',
    artistId: '',
    categoryIds: [],
    images: [{ url: '', altText: '', position: 0 }],
  });
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [artworkRes, artistRes, categoryRes] = await Promise.all([
        catalogApi.listArtworks({ page: 1, limit: 100 }),
        catalogApi.listArtists(),
        catalogApi.listCategories(),
      ]);
      setArtworks(artworkRes.items);
      setArtists(artistRes);
      setCategories(categoryRes);
    } catch (err) {
      setError(toUiError(err, 'Không thể tải dữ liệu catalog quản trị.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredArtworks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return artworks;
    }

    return artworks.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.artist.name.toLowerCase().includes(q),
    );
  }, [artworks, search]);

  const filteredArtists = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return artists;
    }

    return artists.filter((item) => item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q));
  }, [artists, search]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return categories;
    }

    return categories.filter((item) => item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q));
  }, [categories, search]);

  async function runAction(action: string, fn: () => Promise<void>) {
    setBusy(action);
    setError(null);
    setSuccess(null);
    try {
      await fn();
      await loadData();
    } finally {
      setBusy(null);
    }
  }

  const submitArtist = async () => {
    await runAction('artist', async () => {
      try {
        const payload: AdminArtistPayload = {
          ...artistDraft,
          slug: editingArtistId ? artistDraft.slug : toSlug(artistDraft.name),
        };

        if (editingArtistId) {
          await adminCatalogApi.updateArtist(editingArtistId, payload);
          setSuccess('Đã cập nhật họa sĩ.');
        } else {
          await adminCatalogApi.createArtist(payload);
          setSuccess('Đã tạo họa sĩ mới.');
        }
        setArtistDraft({ name: '', slug: '', bio: '' });
        setEditingArtistId(null);
      } catch (err) {
        setError(toUiError(err, 'Không thể lưu họa sĩ.'));
      }
    });
  };

  const submitCategory = async () => {
    await runAction('category', async () => {
      try {
        const payload: AdminCategoryPayload = {
          ...categoryDraft,
          slug: editingCategoryId ? categoryDraft.slug : toSlug(categoryDraft.name),
        };

        if (editingCategoryId) {
          await adminCatalogApi.updateCategory(editingCategoryId, payload);
          setSuccess('Đã cập nhật danh mục.');
        } else {
          await adminCatalogApi.createCategory(payload);
          setSuccess('Đã tạo danh mục mới.');
        }
        setCategoryDraft({ name: '', slug: '', description: '' });
        setEditingCategoryId(null);
      } catch (err) {
        setError(toUiError(err, 'Không thể lưu danh mục.'));
      }
    });
  };

  const submitArtwork = async () => {
    await runAction('artwork', async () => {
      try {
        const payload: AdminArtworkPayload = {
          ...artworkDraft,
          slug: editingArtworkId ? artworkDraft.slug : toSlug(artworkDraft.title),
        };

        if (editingArtworkId) {
          await adminCatalogApi.updateArtwork(editingArtworkId, payload);
          setSuccess('Đã cập nhật tác phẩm.');
        } else {
          await adminCatalogApi.createArtwork(payload);
          setSuccess('Đã tạo tác phẩm mới.');
        }
        setArtworkDraft({
          title: '',
          slug: '',
          description: '',
          price: 0,
          currency: 'VND',
          artistId: '',
          categoryIds: [],
          images: [{ url: '', altText: '', position: 0 }],
        });
        setEditingArtworkId(null);
      } catch (err) {
        setError(toUiError(err, 'Không thể lưu tác phẩm.'));
      }
    });
  };

  const deleteArtist = async (id: string) => {
    if (!window.confirm('Xóa họa sĩ này?')) {
      return;
    }

    await runAction('artist-delete', async () => {
      try {
        await adminCatalogApi.deleteArtist(id);
        setSuccess('Đã xóa họa sĩ.');
      } catch (err) {
        setError(toUiError(err, 'Không thể xóa họa sĩ.'));
      }
    });
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Xóa danh mục này?')) {
      return;
    }

    await runAction('category-delete', async () => {
      try {
        await adminCatalogApi.deleteCategory(id);
        setSuccess('Đã xóa danh mục.');
      } catch (err) {
        setError(toUiError(err, 'Không thể xóa danh mục.'));
      }
    });
  };

  const deleteArtwork = async (id: string) => {
    if (!window.confirm('Xóa tác phẩm này?')) {
      return;
    }

    await runAction('artwork-delete', async () => {
      try {
        await adminCatalogApi.deleteArtwork(id);
        setSuccess('Đã xóa tác phẩm.');
      } catch (err) {
        setError(toUiError(err, 'Không thể xóa tác phẩm.'));
      }
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div className="bg-card border border-border p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif">Quản lý catalog</h2>
          <p className="text-sm text-muted-foreground">Tạo, cập nhật và xóa dữ liệu catalog tập trung</p>
        </div>
        <div className="w-full sm:w-72">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, slug..." />
        </div>
      </div>

      {error && <InlineError message={error.message} correlationId={error.correlationId} />}
      {success && <div className="rounded-md border border-accent/30 bg-accent/10 p-3 text-sm">{success}</div>}

      <Tabs defaultValue="artworks" className="gap-4">
        <TabsList>
          <TabsTrigger value="artworks">Tác phẩm</TabsTrigger>
          <TabsTrigger value="artists">Họa sĩ</TabsTrigger>
          <TabsTrigger value="categories">Danh mục</TabsTrigger>
        </TabsList>

        <TabsContent value="artworks" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="bg-card border border-border p-5 xl:col-span-1 space-y-3">
            <h3 className="text-lg font-serif">{editingArtworkId ? 'Sửa tác phẩm' : 'Tạo tác phẩm'}</h3>
            <Label>Tiêu đề</Label>
            <Input
              value={artworkDraft.title}
              onChange={(e) => setArtworkDraft((p) => ({ ...p, title: e.target.value }))}
            />
            <Label>Slug</Label>
            <div className="h-10 rounded-md border border-input bg-secondary/40 px-3 flex items-center text-sm text-muted-foreground">
              {editingArtworkId ? artworkDraft.slug : toSlug(artworkDraft.title) || '(sẽ tự động tạo)'}
            </div>
            <Label>Giá (VND)</Label>
            <Input
              type="number"
              min={0}
              value={artworkDraft.price}
              onChange={(e) => setArtworkDraft((p) => ({ ...p, price: Number(e.target.value) || 0 }))}
            />
            <Label>Họa sĩ</Label>
            <select
              value={artworkDraft.artistId}
              onChange={(e) => setArtworkDraft((p) => ({ ...p, artistId: e.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Chọn họa sĩ</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Label>Danh mục</Label>
            <select
              value={artworkDraft.categoryIds[0] || ''}
              onChange={(e) => setArtworkDraft((p) => ({ ...p, categoryIds: [e.target.value] }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Chọn danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Label>URL ảnh</Label>
            <Input
              value={artworkDraft.images[0]?.url || ''}
              onChange={(e) =>
                setArtworkDraft((p) => ({
                  ...p,
                  images: [{ url: e.target.value, altText: p.title, position: 0 }],
                }))
              }
            />
            <Label>Mô tả</Label>
            <Textarea
              rows={4}
              value={artworkDraft.description || ''}
              onChange={(e) => setArtworkDraft((p) => ({ ...p, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button onClick={submitArtwork} disabled={busy !== null}>
                {editingArtworkId ? 'Lưu thay đổi' : 'Tạo tác phẩm'}
              </Button>
              {editingArtworkId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingArtworkId(null);
                    setArtworkDraft({
                      title: '',
                      slug: '',
                      description: '',
                      price: 0,
                      currency: 'VND',
                      artistId: '',
                      categoryIds: [],
                      images: [{ url: '', altText: '', position: 0 }],
                    });
                  }}
                >
                  Hủy
                </Button>
              )}
            </div>
          </section>

          <section className="bg-card border border-border p-5 xl:col-span-2 overflow-x-auto">
            <h3 className="text-lg font-serif mb-3">Danh sách tác phẩm ({filteredArtworks.length})</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3">Tác phẩm</th>
                  <th className="py-2 pr-3">Họa sĩ</th>
                  <th className="py-2 pr-3">Giá</th>
                  <th className="py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredArtworks.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 align-top">
                    <td className="py-2 pr-3">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.slug}</p>
                    </td>
                    <td className="py-2 pr-3">{item.artist.name}</td>
                    <td className="py-2 pr-3">{Number(item.price).toLocaleString('vi-VN')} đ</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingArtworkId(item.id);
                            setArtworkDraft({
                              title: item.title,
                              slug: item.slug,
                              description: item.description || '',
                              price: Number(item.price),
                              currency: item.currency,
                              artistId: item.artist.id,
                              categoryIds: [item.categories[0]?.id || ''],
                              images: [
                                {
                                  url: item.images[0]?.url || '',
                                  altText: item.images[0]?.altText || item.title,
                                  position: 0,
                                },
                              ],
                            });
                          }}
                        >
                          Sửa
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteArtwork(item.id)}>
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </TabsContent>

        <TabsContent value="artists" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="bg-card border border-border p-5 xl:col-span-1 space-y-3">
            <h3 className="text-lg font-serif">{editingArtistId ? 'Sửa họa sĩ' : 'Tạo họa sĩ'}</h3>
            <Label>Tên họa sĩ</Label>
            <Input value={artistDraft.name} onChange={(e) => setArtistDraft((p) => ({ ...p, name: e.target.value }))} />
            <Label>Slug</Label>
            <div className="h-10 rounded-md border border-input bg-secondary/40 px-3 flex items-center text-sm text-muted-foreground">
              {editingArtistId ? artistDraft.slug : toSlug(artistDraft.name) || '(sẽ tự động tạo)'}
            </div>
            <Label>Tiểu sử</Label>
            <Textarea value={artistDraft.bio || ''} onChange={(e) => setArtistDraft((p) => ({ ...p, bio: e.target.value }))} />
            <div className="flex gap-2">
              <Button onClick={submitArtist} disabled={busy !== null}>
                {editingArtistId ? 'Lưu thay đổi' : 'Tạo họa sĩ'}
              </Button>
              {editingArtistId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingArtistId(null);
                    setArtistDraft({ name: '', slug: '', bio: '' });
                  }}
                >
                  Hủy
                </Button>
              )}
            </div>
          </section>

          <section className="bg-card border border-border p-5 xl:col-span-2 overflow-x-auto">
            <h3 className="text-lg font-serif mb-3">Danh sách họa sĩ ({filteredArtists.length})</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3">Họa sĩ</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Bio</th>
                  <th className="py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredArtists.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 align-top">
                    <td className="py-2 pr-3 font-medium">{item.name}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline">{item.slug}</Badge>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{item.bio || '-'}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingArtistId(item.id);
                            setArtistDraft({ name: item.name, slug: item.slug, bio: item.bio || '' });
                          }}
                        >
                          Sửa
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteArtist(item.id)}>
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </TabsContent>

        <TabsContent value="categories" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="bg-card border border-border p-5 xl:col-span-1 space-y-3">
            <h3 className="text-lg font-serif">{editingCategoryId ? 'Sửa danh mục' : 'Tạo danh mục'}</h3>
            <Label>Tên danh mục</Label>
            <Input value={categoryDraft.name} onChange={(e) => setCategoryDraft((p) => ({ ...p, name: e.target.value }))} />
            <Label>Slug</Label>
            <div className="h-10 rounded-md border border-input bg-secondary/40 px-3 flex items-center text-sm text-muted-foreground">
              {editingCategoryId ? categoryDraft.slug : toSlug(categoryDraft.name) || '(sẽ tự động tạo)'}
            </div>
            <Label>Mô tả</Label>
            <Textarea
              value={categoryDraft.description || ''}
              onChange={(e) => setCategoryDraft((p) => ({ ...p, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button onClick={submitCategory} disabled={busy !== null}>
                {editingCategoryId ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </Button>
              {editingCategoryId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCategoryDraft({ name: '', slug: '', description: '' });
                  }}
                >
                  Hủy
                </Button>
              )}
            </div>
          </section>

          <section className="bg-card border border-border p-5 xl:col-span-2 overflow-x-auto">
            <h3 className="text-lg font-serif mb-3">Danh sách danh mục ({filteredCategories.length})</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3">Tên</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Mô tả</th>
                  <th className="py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 align-top">
                    <td className="py-2 pr-3 font-medium">{item.name}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline">{item.slug}</Badge>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{item.description || '-'}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategoryId(item.id);
                            setCategoryDraft({
                              name: item.name,
                              slug: item.slug,
                              description: item.description || '',
                            });
                          }}
                        >
                          Sửa
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteCategory(item.id)}>
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
