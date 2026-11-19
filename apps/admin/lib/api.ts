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
      Array.isArray(result.message)
        ? result.message.join(', ')
        : (result.message ?? 'Request failed'),
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
      message = Array.isArray(result.message)
        ? result.message.join(', ')
        : (result.message ?? message);
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

export type AdminBookingsPage = {
  items: AdminBookingListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

export type DashboardData = {
  kpis: {
    totalBookings: number;
    todaysBookings: number;
    pendingPaymentVerification: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    rescheduled: number;
  };
  serviceCounts: Array<{ serviceId: string; name: string; count: number }>;
  recentBookings: Array<{
    bookingRef: string;
    status: string;
    appointmentType: string;
    totalAmount: number;
    createdAt: string;
    patient: { name: string };
    service: { id: string; name: string };
    slot: { date: string; startTime: string; endTime: string } | null;
  }>;
  paymentVerificationQueue: Array<{
    bookingRef: string;
    createdAt: string;
    patient: { name: string };
    service: { name: string };
    payment: { status: string; submittedAt: string | null } | null;
  }>;
};

export type AdminServiceDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number | null;
  isActive: boolean;
  sortOrder: number;
  serviceItems: AdminServiceItem[];
};

export type AdminServiceItem = {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  isActive: boolean;
};

export type PatientListItem = {
  id: string;
  name: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  address: string;
  pinCode: string | null;
  dateOfBirth: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  bookingCount: number;
  lastBookingAt: string | null;
};

export type PatientsPage = {
  items: PatientListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PatientDetail = PatientListItem & {
  mapsLink: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PatientBookingHistory = {
  items: Array<{
    bookingRef: string;
    status: string;
    appointmentType: string;
    totalAmount: number;
    createdAt: string;
    service: { name: string; slug: string };
    slot: { date: string; startTime: string; endTime: string } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

export async function getDashboard(token: string): Promise<DashboardData> {
  return adminApiFetch<DashboardData>('/admin/dashboard', { token });
}

export async function getAdminServices(token: string): Promise<AdminServiceDetail[]> {
  return adminApiFetch<AdminServiceDetail[]>('/admin/services', { token });
}

export async function updateAdminService(
  serviceId: string,
  changes: Partial<{
    name: string;
    description: string;
    basePrice: number;
    sortOrder: number;
    isActive: boolean;
  }>,
  token: string,
): Promise<AdminServiceDetail> {
  return adminApiFetch<AdminServiceDetail>(`/admin/services/${encodeURIComponent(serviceId)}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(changes),
  });
}

export async function createAdminServiceItem(
  serviceId: string,
  item: { name: string; price: number; isActive: boolean },
  token: string,
): Promise<AdminServiceItem> {
  return adminApiFetch<AdminServiceItem>(`/admin/services/${encodeURIComponent(serviceId)}/items`, {
    method: 'POST',
    token,
    body: JSON.stringify(item),
  });
}

export async function updateAdminServiceItem(
  serviceId: string,
  itemId: string,
  changes: Partial<{ name: string; price: number; isActive: boolean }>,
  token: string,
): Promise<AdminServiceItem> {
  return adminApiFetch<AdminServiceItem>(
    `/admin/services/${encodeURIComponent(serviceId)}/items/${encodeURIComponent(itemId)}`,
    { method: 'PATCH', token, body: JSON.stringify(changes) },
  );
}

export async function getAdminPatients(
  filters: { search?: string; page: number; pageSize: number },
  token: string,
): Promise<PatientsPage> {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  params.set('page', String(filters.page));
  params.set('pageSize', String(filters.pageSize));
  return adminApiFetch<PatientsPage>(`/admin/patients?${params.toString()}`, { token });
}

export async function getAdminPatient(patientId: string, token: string): Promise<PatientDetail> {
  return adminApiFetch<PatientDetail>(`/admin/patients/${encodeURIComponent(patientId)}`, {
    token,
  });
}

export async function getAdminPatientBookings(
  patientId: string,
  filters: { page: number; pageSize: number },
  token: string,
): Promise<PatientBookingHistory> {
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  return adminApiFetch<PatientBookingHistory>(
    `/admin/patients/${encodeURIComponent(patientId)}/bookings?${params.toString()}`,
    { token },
  );
}

export async function deleteAdminSlot(id: string, token: string): Promise<void> {
  await adminApiFetch<{ id: string; deleted: boolean }>(`/admin/slots/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
}
