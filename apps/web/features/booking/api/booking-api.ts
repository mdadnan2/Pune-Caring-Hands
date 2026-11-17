import {
  createBooking,
  getAvailableSlots,
  getBookingByRef,
  getServices,
  validateServiceArea,
  type BookingRecord,
  type BookingSlot,
  type ServiceApiItem,
} from '../../../lib/api';

export async function fetchServices(): Promise<ServiceApiItem[]> {
  return getServices();
}

export async function fetchAvailableSlots(serviceId?: string, date?: string): Promise<BookingSlot[]> {
  return getAvailableSlots(serviceId, date);
}

export async function checkServiceAreaSupport(pinCode: string, serviceId: string): Promise<boolean> {
  return validateServiceArea(pinCode, serviceId);
}

export async function submitBooking(payload: Record<string, unknown>): Promise<{ bookingRef: string }> {
  return createBooking(payload);
}

export async function fetchBookingByRef(bookingRef: string): Promise<BookingRecord> {
  return getBookingByRef(bookingRef);
}
