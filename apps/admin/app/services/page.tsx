'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminAuth from '../../components/AdminAuth';
import {
  createAdminServiceItem,
  getAdminServices,
  updateAdminService,
  updateAdminServiceItem,
  type AdminServiceDetail,
  type AdminServiceItem,
} from '../../lib/api';

function ServicesPage() {
  const [token, setToken] = useState('');
  const [services, setServices] = useState<AdminServiceDetail[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('pch_admin_token');
    if (stored) setToken(stored);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await getAdminServices(token);
      setServices(result);
      setSelectedId((current) => current || result[0]?.id || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load services.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = services.find((service) => service.id === selectedId) ?? null;

  const saveService = async (service: AdminServiceDetail) => {
    if (!token) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await updateAdminService(
        service.id,
        {
          name: service.name,
          description: service.description ?? '',
          basePrice: service.basePrice ?? undefined,
          sortOrder: service.sortOrder,
          isActive: service.isActive,
        },
        token,
      );
      await load();
      setNotice('Service updated successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update service.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocalService = (patch: Partial<AdminServiceDetail>) => {
    setServices((current) =>
      current.map((service) => (service.id === selectedId ? { ...service, ...patch } : service)),
    );
  };

  const saveItem = async (item: AdminServiceItem) => {
    if (!token) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await updateAdminServiceItem(
        selectedId,
        item.id,
        {
          name: item.name,
          price: item.price,
          isActive: item.isActive,
        },
        token,
      );
      await load();
      setNotice('Service item updated successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update service item.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocalItem = (itemId: string, patch: Partial<AdminServiceItem>) => {
    setServices((current) =>
      current.map((service) =>
        service.id === selectedId
          ? {
              ...service,
              serviceItems: service.serviceItems.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            }
          : service,
      ),
    );
  };

  const createItem = async (event: React.FormEvent) => {
    event.preventDefault();
    const price = Number(itemPrice);
    if (
      !token ||
      !selectedId ||
      itemName.trim().length < 2 ||
      !Number.isInteger(price) ||
      price < 0
    ) {
      setError('Enter a valid item name and whole-ruppee price.');
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await createAdminServiceItem(
        selectedId,
        { name: itemName.trim(), price, isActive: true },
        token,
      );
      setItemName('');
      setItemPrice('');
      await load();
      setNotice('Service item added successfully.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not add service item.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminAuth>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-5 md:py-8">
        <div>
          <p className="text-sm font-semibold text-teal-700">Catalogue</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Services &amp; Pricing</h1>
          <p className="mt-1 text-sm text-slate-600">
            Update current pricing only; existing booking amounts remain unchanged.
          </p>
        </div>
        {error ? (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">
            {notice}
          </p>
        ) : null}
        {isLoading ? (
          <p className="py-10 text-slate-600">Loading services...</p>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="grid gap-2 self-start rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-1">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedId(service.id)}
                  className={`min-h-14 rounded-xl px-4 py-3 text-left ${selectedId === service.id ? 'bg-navy-700 text-white' : 'hover:bg-slate-50'}`}
                >
                  <span className="block text-sm font-semibold">{service.name}</span>
                  <span
                    className={`mt-1 block text-xs ${selectedId === service.id ? 'text-slate-200' : 'text-slate-500'}`}
                  >
                    {service.isActive ? 'Active' : 'Inactive'} ·{' '}
                     {service.basePrice !== null ? `₹${service.basePrice}` : 'Item-Priced'}
                  </span>
                </button>
              ))}
            </aside>

            {selected ? (
              <div className="grid gap-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="text-xl font-semibold text-slate-900">Service details</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium text-slate-700">
                      Name
                      <input
                        value={selected.name}
                        onChange={(event) => updateLocalService({ name: event.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-slate-700">
                      Base price (₹)
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={selected.basePrice ?? ''}
                        onChange={(event) =>
                          updateLocalService({
                            basePrice:
                              event.target.value === '' ? null : Number(event.target.value),
                          })
                        }
                        disabled={selected.basePrice === null}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 disabled:bg-slate-100"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
                      Description
                      <textarea
                        value={selected.description ?? ''}
                        onChange={(event) =>
                          updateLocalService({ description: event.target.value })
                        }
                        className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                      />
                    </label>
                    <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={selected.isActive}
                        onChange={(event) => updateLocalService({ isActive: event.target.checked })}
                        className="h-5 w-5"
                      />
                      Service is active
                    </label>
                  </div>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void saveService(selected)}
                    className="mt-5 min-h-11 rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                     Save Changes
                  </button>
                </section>

                {selected.basePrice === null ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-xl font-semibold text-slate-900">Service items</h2>
                    <form
                      onSubmit={(event) => void createItem(event)}
                      className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-end"
                    >
                      <label className="space-y-1.5 text-sm font-medium text-slate-700">
                        Item name
                        <input
                          value={itemName}
                          onChange={(event) => setItemName(event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                          placeholder="CBC, Lipid profile, Chest X-Ray"
                        />
                      </label>
                      <label className="space-y-1.5 text-sm font-medium text-slate-700">
                        Price (₹)
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={itemPrice}
                          onChange={(event) => setItemPrice(event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="min-h-11 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                         {selected.slug === 'xray-at-home' ? 'Add X-Ray Type' : 'Add Test'}
                      </button>
                    </form>
                    <div className="mt-4 grid gap-3">
                      {selected.serviceItems.length ? (
                        selected.serviceItems.map((item) => (
                          <article
                            key={item.id}
                            className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[minmax(0,1fr)_140px_auto_auto] md:items-end"
                          >
                            <label className="space-y-1.5 text-sm font-medium text-slate-700">
                              Name
                              <input
                                value={item.name}
                                onChange={(event) =>
                                  updateLocalItem(item.id, { name: event.target.value })
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                              />
                            </label>
                            <label className="space-y-1.5 text-sm font-medium text-slate-700">
                              Price (₹)
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.price}
                                onChange={(event) =>
                                  updateLocalItem(item.id, { price: Number(event.target.value) })
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                              />
                            </label>
                            <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={item.isActive}
                                onChange={(event) =>
                                  updateLocalItem(item.id, { isActive: event.target.checked })
                                }
                                className="h-5 w-5"
                              />
                              Active
                            </label>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => void saveItem(item)}
                              className="min-h-11 rounded-full border px-4 py-2 text-sm font-semibold text-teal-700 disabled:opacity-50"
                            >
                               Save Changes
                            </button>
                          </article>
                        ))
                      ) : (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                          No service items yet.
                        </p>
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </main>
    </AdminAuth>
  );
}

export default function AdminServicesPage() {
  return <ServicesPage />;
}
