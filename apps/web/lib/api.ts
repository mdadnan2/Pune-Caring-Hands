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
  payment?: { id: string; amount: number; status: string; rejectionReason?: string | null };
  createdAt: string;
};

export type PaymentInstructions = { upiId: string; payeeName: string };

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
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

export async function createBooking(
  data: Record<string, unknown>,
  prescription?: File,
): Promise<{ bookingRef: string }> {
  if (prescription) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) {
        continue;
      }
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    formData.append('prescription', prescription);

    return apiFetch<{ bookingRef: string }>('/bookings', {
      method: 'POST',
      body: formData,
    });
  }

  return apiFetch<{ bookingRef: string }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getBookingByRef(bookingRef: string): Promise<BookingRecord> {
  return apiFetch<BookingRecord>(`/bookings/${encodeURIComponent(bookingRef)}`);
}

export async function getPaymentInstructions(): Promise<PaymentInstructions> {
  return apiFetch<PaymentInstructions>('/payments/instructions');
}

export async function submitPaymentProof(
  bookingRef: string,
  proof: File,
): Promise<{ bookingRef: string; status: string }> {
  const formData = new FormData();
  formData.append('proof', proof);
  return apiFetch(`/payments/${encodeURIComponent(bookingRef)}/proof`, {
    method: 'POST',
    body: formData,
  });
}
