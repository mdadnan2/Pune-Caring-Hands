import { z } from 'zod';
import { UPLOAD_ALLOWED_MIME_TYPES, UPLOAD_MAX_FILE_SIZE_BYTES } from '@pch/shared';

export const bookingWizardSchema = z
  .object({
    serviceId: z.string().min(1, 'Please choose a service.'),
    serviceSlug: z.string().min(1, 'Please choose a service.'),
    appointmentType: z.enum(['IMMEDIATE', 'SCHEDULED']),
    patientName: z.string().min(2, 'Name is required.'),
    patientDateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    patientPhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number.'),
    patientAlternatePhone: z
      .string()
      .regex(/^[6-9]\d{9}$|^$/, 'Enter a valid alternate mobile number.'),
    patientEmail: z.string().email('Enter a valid email.').optional().or(z.literal('')),
    patientAddress: z.string().min(10, 'Please enter your full address.'),
    patientPinCode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code.'),
    patientMapsLink: z.string().url('Enter a valid Google Maps link.').optional().or(z.literal('')),
    chiefComplaint: z.string().optional().or(z.literal('')),
    symptomDuration: z.string().optional().or(z.literal('')),
    existingConditions: z.string().optional().or(z.literal('')),
    currentMedicines: z.string().optional().or(z.literal('')),
    allergies: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    serviceItemIds: z.array(z.string()).default([]),
    slotId: z.string().optional().or(z.literal('')),
    prescription: z
      .custom<File>(
        (value) =>
          typeof value === 'object' &&
          value !== null &&
          'size' in value &&
          typeof value.size === 'number' &&
          'type' in value &&
          typeof value.type === 'string',
      )
      .optional(),
  })
  .superRefine((values, context) => {
    const { serviceSlug } = values;
    const requiresComplaint =
      serviceSlug === 'doctor-home-consultation' || serviceSlug === 'online-consultation';

    if (requiresComplaint && (values.chiefComplaint ?? '').trim().length < 5) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['chiefComplaint'],
        message: 'Please describe the main concern.',
      });
    }

    if (serviceSlug === 'blood-test-at-home' && values.serviceItemIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['serviceItemIds'],
        message: 'Select at least one blood test.',
      });
    }

    if (serviceSlug === 'xray-at-home' && values.serviceItemIds.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['serviceItemIds'],
        message: 'Select one X-Ray type.',
      });
    }

    if (serviceSlug === 'medicine-home-delivery' && !values.prescription) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['prescription'],
        message: 'Upload your prescription to continue.',
      });
    }

    if (values.prescription) {
      if (serviceSlug !== 'medicine-home-delivery') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['prescription'],
          message: 'Prescription uploads are only used for medicine delivery.',
        });
      } else {
        if (!UPLOAD_ALLOWED_MIME_TYPES.some((mimeType) => mimeType === values.prescription?.type)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['prescription'],
            message: 'Choose a JPEG, PNG, or PDF prescription file.',
          });
        }
        if (
          values.prescription.size === 0 ||
          values.prescription.size > UPLOAD_MAX_FILE_SIZE_BYTES
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['prescription'],
            message: 'Choose a non-empty file no larger than 5MB.',
          });
        }
      }
    }

    if (values.appointmentType === 'SCHEDULED' && !values.slotId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slotId'],
        message: 'Choose an available appointment time.',
      });
    }
  });

export type BookingWizardValues = z.infer<typeof bookingWizardSchema>;
