const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export type ServiceApiItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number | null;
  isActive: boolean;
  sortOrder: number;
  serviceItems: ServiceApiItemOption[];
};

export type ServiceApiItemOption = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
};

export type BookingSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type BookingRecord = {
  bookingRef: string;
  status: string;
  appointmentType: string;
  totalAmount: number;
  service?: { name: string; slug: string };
  slot?: { date: string; startTime: string; endTime: string };
  bookingItems?: Array<{ id: string; name: string; price: number }>;
  payment?: { id: string; amount: number; status: string };
  createdAt: string;
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const json = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok) {
    throw new Error(json.message ?? 'Request failed');
  }

  return (json.data ?? (json as unknown as T)) as T;
}

export async function getServices(): Promise<ServiceApiItem[]> {
  return apiFetch<ServiceApiItem[]>('/services');
}

export async function getServiceBySlug(slug: string): Promise<ServiceApiItem> {
  return apiFetch<ServiceApiItem>(`/services/${encodeURIComponent(slug)}`);
}

export async function validateServiceArea(pinCode: string, serviceId: string): Promise<boolean> {
  const result = await apiFetch<{ supported: boolean }>(
    `/service-areas/validate?pinCode=${encodeURIComponent(pinCode)}&serviceId=${encodeURIComponent(serviceId)}`,
  );
  return result.supported;
}

export async function getAvailableSlots(serviceId?: string, date?: string): Promise<BookingSlot[]> {
  const params = new URLSearchParams();
  if (serviceId) params.set('serviceId', serviceId);
  if (date) params.set('date', date);

  const query = params.toString();
  return apiFetch<BookingSlot[]>(`/slots/available${query ? `?${query}` : ''}`);
}

export async function createBooking(data: Record<string, unknown>): Promise<{ bookingRef: string }> {
  return apiFetch<{ bookingRef: string }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getBookingByRef(bookingRef: string): Promise<BookingRecord> {
  return apiFetch<BookingRecord>(`/bookings/${encodeURIComponent(bookingRef)}`);
}
