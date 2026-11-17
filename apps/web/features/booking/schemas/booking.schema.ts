import { z } from 'zod';

export const bookingWizardSchema = z.object({
  serviceId: z.string().min(1, 'Please choose a service.'),
  appointmentType: z.enum(['IMMEDIATE', 'SCHEDULED']),
  patientName: z.string().min(2, 'Name is required.'),
  patientDateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  patientPhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number.'),
  patientAlternatePhone: z.string().regex(/^[6-9]\d{9}$|^$/, 'Enter a valid alternate mobile number.'),
  patientEmail: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  patientAddress: z.string().min(10, 'Please enter your full address.'),
  patientPinCode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code.'),
  patientMapsLink: z.string().url('Enter a valid Google Maps link.').optional().or(z.literal('')),
  chiefComplaint: z.string().min(5, 'Please describe the main complaint.'),
  symptomDuration: z.string().optional().or(z.literal('')),
  existingConditions: z.string().optional().or(z.literal('')),
  currentMedicines: z.string().optional().or(z.literal('')),
  allergies: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  serviceItemIds: z.array(z.string()).default([]),
  slotId: z.string().optional().or(z.literal('')),
});

export type BookingWizardValues = z.infer<typeof bookingWizardSchema>;
