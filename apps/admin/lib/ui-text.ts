const bookingStatusLabels: Record<string, string> = {
  REQUESTED: 'Requested',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_VERIFICATION: 'Payment Verification',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  RESCHEDULED: 'Rescheduled',
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Payment Pending',
  SUBMITTED: 'Payment Submitted',
  VERIFIED: 'Payment Verified',
  REJECTED: 'Payment Correction Required',
};

const appointmentTypeLabels: Record<string, string> = {
  IMMEDIATE: 'Immediate Visit Request',
  SCHEDULED: 'Scheduled Appointment',
};

export function formatBookingStatus(status: string): string {
  return bookingStatusLabels[status] ?? status.replaceAll('_', ' ');
}

export function formatPaymentStatus(status: string): string {
  return paymentStatusLabels[status] ?? status.replaceAll('_', ' ');
}

export function formatAppointmentType(type: string): string {
  return appointmentTypeLabels[type] ?? type.replaceAll('_', ' ');
}
