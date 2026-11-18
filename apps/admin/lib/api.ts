const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

export async function adminApiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...requestInit } = init ?? {};
  const headers = new Headers(requestInit.headers);
  if (!(requestInit.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...requestInit, headers });
  const result = (await response.json()) as ApiEnvelope<T> & { message?: string | string[] };
  if (!response.ok) {
    throw new Error(
      Array.isArray(result.message) ? result.message.join(', ') : result.message ?? 'Request failed',
    );
  }
  return result.data;
}

export async function adminApiFile(path: string, token: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    let message = 'Could not load the requested file.';
    try {
      const result = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(result.message) ? result.message.join(', ') : result.message ?? message;
    } catch {
      // The response may be a non-JSON server error.
    }
    throw new Error(message);
  }
  return response.blob();
}

export type AdminService = { id: string; name: string };
export type AdminBookingListItem = {
  bookingRef: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  patient: { name: string; phone: string };
  service: { name: string; slug: string };
  slot: { date: string; startTime: string; endTime: string } | null;
  payment: { status: string } | null;
};

export type AdminBookingDetail = AdminBookingListItem & {
  appointmentType: string;
  notes: string | null;
  patient: {
    name: string;
    phone: string;
    email: string | null;
    address: string;
    dateOfBirth: string | null;
  };
  bookingItems: Array<{ id: string; name: string; price: number }>;
  serviceDetails: Record<string, unknown>;
  payment: {
    id: string;
    amount: number;
    status: string;
    submittedAt: string | null;
    verifiedAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
    proofAvailable: boolean;
  } | null;
  prescriptionAvailable: boolean;
};

export type AdminAvailableSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export async function getAvailableSlotsForAdmin(token: string): Promise<AdminAvailableSlot[]> {
  return adminApiFetch<AdminAvailableSlot[]>('/slots/available', { token });
}

export async function cancelAdminBooking(
  bookingRef: string,
  token: string,
): Promise<AdminBookingDetail> {
  return adminApiFetch<AdminBookingDetail>(
    `/admin/bookings/${encodeURIComponent(bookingRef)}/cancel`,
    { method: 'POST', token },
  );
}

export async function rescheduleAdminBooking(
  bookingRef: string,
  slotId: string,
  token: string,
): Promise<AdminBookingDetail> {
  return adminApiFetch<AdminBookingDetail>(
    `/admin/bookings/${encodeURIComponent(bookingRef)}/reschedule`,
    { method: 'POST', token, body: JSON.stringify({ slotId }) },
  );
}

export async function completeAdminBooking(
  bookingRef: string,
  token: string,
): Promise<AdminBookingDetail> {
  return adminApiFetch<AdminBookingDetail>(
    `/admin/bookings/${encodeURIComponent(bookingRef)}/complete`,
    { method: 'POST', token },
  );
}

export type AdminSlotBooking = {
  bookingRef: string;
  status: string;
  patient: { name: string };
  service: { name: string };
};

export type AdminSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  booking: AdminSlotBooking | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminSlotsPage = {
  items: AdminSlot[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminSlotInput = {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
};

export async function getAdminSlots(
  filters: {
    date?: string;
    availability?: 'available' | 'unavailable';
    bookingStatus?: 'booked' | 'unbooked';
    page: number;
    pageSize: number;
  },
  token: string,
): Promise<AdminSlotsPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return adminApiFetch<AdminSlotsPage>(`/admin/slots?${params.toString()}`, { token });
}

export async function createAdminSlot(
  slot: Omit<AdminSlotInput, 'isAvailable'>,
  token: string,
): Promise<AdminSlot> {
  return adminApiFetch<AdminSlot>('/admin/slots', {
    method: 'POST',
    token,
    body: JSON.stringify(slot),
  });
}

export async function updateAdminSlot(
  id: string,
  changes: Partial<AdminSlotInput>,
  token: string,
): Promise<AdminSlot> {
  return adminApiFetch<AdminSlot>(`/admin/slots/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(changes),
  });
}

export async function deleteAdminSlot(id: string, token: string): Promise<void> {
  await adminApiFetch<{ id: string; deleted: boolean }>(
    `/admin/slots/${encodeURIComponent(id)}`,
    { method: 'DELETE', token },
  );
}
