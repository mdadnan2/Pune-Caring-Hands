'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UPLOAD_ALLOWED_MIME_TYPES } from '@pch/shared';
import {
  checkServiceAreaSupport,
  fetchAvailableSlots,
  fetchServices,
  submitBooking,
} from '../api/booking-api';
import { bookingWizardSchema, type BookingWizardValues } from '../schemas/booking.schema';
import type { BookingSlot, ServiceApiItem } from '../../../lib/api';

const stepTitles = ['Service', 'Patient', 'Details', 'Date & Time', 'Review'];

const defaultValues: BookingWizardValues = {
  serviceId: '',
  serviceSlug: '',
  appointmentType: 'SCHEDULED',
  patientName: '',
  patientDateOfBirth: '',
  gender: 'MALE',
  patientPhone: '',
  patientAlternatePhone: '',
  patientEmail: '',
  patientAddress: '',
  patientPinCode: '',
  patientMapsLink: '',
  chiefComplaint: '',
  symptomDuration: '',
  existingConditions: '',
  currentMedicines: '',
  allergies: '',
  notes: '',
  serviceItemIds: [],
  slotId: '',
  prescription: undefined,
};

function getServiceDetails(
  serviceSlug: string,
  values: BookingWizardValues,
): Record<string, unknown> | undefined {
  if (serviceSlug === 'doctor-home-consultation') {
    return {
      gender: values.gender,
      chiefComplaint: values.chiefComplaint?.trim(),
      symptomDuration: values.symptomDuration || undefined,
      existingConditions: values.existingConditions || undefined,
      currentMedicines: values.currentMedicines || undefined,
      allergies: values.allergies || undefined,
      appointmentPreference: values.appointmentType,
    };
  }
  if (serviceSlug === 'ecg-at-home') {
    return {
      gender: values.gender,
      chiefComplaint: values.chiefComplaint?.trim() || undefined,
    };
  }
  if (serviceSlug === 'online-consultation') {
    return {
      gender: values.gender,
      chiefComplaint: values.chiefComplaint?.trim(),
    };
  }
  return undefined;
}

function getCurrentPuneDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

export default function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceApiItem[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selectedSlotDate, setSelectedSlotDate] = useState('');
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const form = useForm<BookingWizardValues>({
    resolver: zodResolver(bookingWizardSchema),
    mode: 'onBlur',
    defaultValues,
  });

  const selectedServiceId = form.watch('serviceId');
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  );
  const selectedServiceItems = selectedService?.serviceItems ?? [];
  const selectedItemIds = form.watch('serviceItemIds') ?? [];
  const appointmentType = form.watch('appointmentType');

  useEffect(() => {
    setSelectedSlotDate(getCurrentPuneDate());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const result = await fetchServices();
        if (!cancelled) {
          setServices(result);
          if (!result[0]) {
            return;
          }

          if (!form.getValues('serviceId')) {
            form.setValue('serviceId', result[0].id, { shouldValidate: true });
            form.setValue('serviceSlug', result[0].slug, { shouldValidate: true });
          }
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : 'Could not load services.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingServices(false);
        }
      }
    }

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, [form]);

  useEffect(() => {
    const currentService = selectedService;
    const serviceId = currentService?.id;

    if (!serviceId || !selectedSlotDate) {
      setSlots([]);
      return;
    }

    let cancelled = false;

    async function loadSlots() {
      setIsLoadingSlots(true);
      setSlots([]);
      setApiError('');
      try {
        const result = await fetchAvailableSlots(serviceId, selectedSlotDate);
        if (!cancelled) {
          setSlots(result);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : 'Could not load available slots.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSlots(false);
        }
      }
    }

    void loadSlots();

    return () => {
      cancelled = true;
    };
  }, [selectedService, selectedSlotDate]);

  useEffect(() => {
    const pinCode = form.watch('patientPinCode');
    const serviceId = form.watch('serviceId');

    if (!serviceId || pinCode.length !== 6) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const supported = await checkServiceAreaSupport(pinCode, serviceId);
          if (!supported) {
            form.setError('patientPinCode', {
              type: 'manual',
              message: 'Sorry, this service is currently unavailable in your area.',
            });
          } else {
            form.clearErrors('patientPinCode');
          }
        } catch (error) {
          form.setError('patientPinCode', {
            type: 'manual',
            message: error instanceof Error ? error.message : 'Area validation failed.',
          });
        }
      })();
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [form, selectedServiceId]);

  const selectedServiceAmount = useMemo(() => {
    if (!selectedService) return 0;

    if (selectedService.basePrice !== null) {
      return selectedService.basePrice;
    }

    return selectedServiceItems
      .filter((item) => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  }, [selectedItemIds, selectedService, selectedServiceItems]);

  const nextStep = async () => {
    setApiError('');

    if (step === 0) {
      if (!form.getValues('serviceId')) {
        form.setError('serviceId', { type: 'manual', message: 'Please select a service.' });
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      const isValid = await form.trigger([
        'patientName',
        'patientDateOfBirth',
        'gender',
        'patientPhone',
        'patientAlternatePhone',
        'patientEmail',
        'patientAddress',
        'patientPinCode',
        'patientMapsLink',
      ]);
      if (!isValid) {
        return;
      }

      if (!selectedService) {
        setApiError('Please choose a service before continuing.');
        return;
      }

      const supported = await checkServiceAreaSupport(
        form.getValues('patientPinCode'),
        selectedService.id,
      );
      if (!supported) {
        form.setError('patientPinCode', {
          type: 'manual',
          message: 'Sorry, this service is currently unavailable in your area.',
        });
        return;
      }

      form.clearErrors('patientPinCode');
      setStep(2);
      return;
    }

    if (step === 2) {
      if (selectedService?.slug === 'blood-test-at-home' && selectedItemIds.length === 0) {
        form.setError('serviceItemIds', {
          type: 'manual',
          message: 'Select at least one blood test.',
        });
        return;
      }

      if (selectedService?.slug === 'xray-at-home' && selectedItemIds.length !== 1) {
        form.setError('serviceItemIds', {
          type: 'manual',
          message: 'Select one X-Ray type.',
        });
        return;
      }

      const isValid = await form.trigger([
        'chiefComplaint',
        'notes',
        'serviceItemIds',
        'prescription',
      ]);
      if (!isValid) {
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (appointmentType === 'SCHEDULED' && !form.getValues('slotId')) {
        setApiError('Please choose an available slot.');
        return;
      }
      setStep(4);
      return;
    }
  };

  const onSubmit = async (values: BookingWizardValues) => {
    if (!selectedService) {
      setApiError('Service is required.');
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      const payload = {
        serviceId: selectedService.id,
        appointmentType: values.appointmentType,
        patientName: values.patientName,
        patientPhone: values.patientPhone,
        patientAlternatePhone: values.patientAlternatePhone || undefined,
        patientEmail: values.patientEmail || undefined,
        patientAddress: values.patientAddress,
        patientPinCode: values.patientPinCode,
        patientMapsLink: values.patientMapsLink || undefined,
        patientDateOfBirth: values.patientDateOfBirth || undefined,
        gender: values.gender || undefined,
        slotId: values.appointmentType === 'SCHEDULED' ? values.slotId || undefined : undefined,
        serviceItemIds: values.serviceItemIds.length ? values.serviceItemIds : undefined,
        notes:
          selectedService.slug === 'ecg-at-home' ||
          selectedService.slug === 'medicine-home-delivery' ||
          selectedService.slug === 'online-consultation'
            ? values.notes || undefined
            : undefined,
        serviceDetails: getServiceDetails(selectedService.slug, values),
      };

      const result = await submitBooking(
        payload,
        selectedService.slug === 'medicine-home-delivery' ? values.prescription : undefined,
      );
      router.push(`/book/payment/${result.bookingRef}`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Booking creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServiceStep = () => {
    if (isLoadingServices) {
      return <p className="text-sm text-slate-600">Loading services...</p>;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => {
              if (selectedServiceId !== service.id) {
                form.setValue('serviceItemIds', []);
                form.setValue('slotId', '');
                form.setValue('appointmentType', 'SCHEDULED');
                form.setValue('chiefComplaint', '');
                form.setValue('symptomDuration', '');
                form.setValue('existingConditions', '');
                form.setValue('currentMedicines', '');
                form.setValue('allergies', '');
                form.setValue('notes', '');
                form.setValue('prescription', undefined);
                form.clearErrors(['chiefComplaint', 'serviceItemIds', 'prescription', 'slotId']);
              }
              form.setValue('serviceId', service.id, { shouldValidate: true });
              form.setValue('serviceSlug', service.slug, { shouldValidate: true });
              setApiError('');
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              selectedServiceId === service.id
                ? 'border-navy-700 bg-navy-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="text-sm font-semibold text-teal-700">
              {service.basePrice !== null
                ? `₹${service.basePrice.toLocaleString('en-IN')}`
                : 'Price varies'}
            </p>
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{service.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{service.description}</p>
          </button>
        ))}
      </div>
    );
  };

  const renderPatientStep = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-2 text-sm font-medium text-slate-700">
        Full name
        <input
          {...form.register('patientName')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
        />
        {form.formState.errors.patientName ? (
          <span className="text-xs text-red-600">{form.formState.errors.patientName.message}</span>
        ) : null}
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Date of birth
        <input
          type="date"
          {...form.register('patientDateOfBirth')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Gender
        <select
          {...form.register('gender')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Mobile
        <input
          {...form.register('patientPhone')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="9876543210"
        />
        {form.formState.errors.patientPhone ? (
          <span className="text-xs text-red-600">{form.formState.errors.patientPhone.message}</span>
        ) : null}
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Alternate mobile (optional)
        <input
          {...form.register('patientAlternatePhone')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="9876543211"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Email (optional)
        <input
          {...form.register('patientEmail')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="you@example.com"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
        Complete address
        <textarea
          {...form.register('patientAddress')}
          className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="House no, street, area, city"
        />
        {form.formState.errors.patientAddress ? (
          <span className="text-xs text-red-600">
            {form.formState.errors.patientAddress.message}
          </span>
        ) : null}
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        PIN code
        <input
          {...form.register('patientPinCode')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="411001"
        />
        {form.formState.errors.patientPinCode ? (
          <span className="text-xs text-red-600">
            {form.formState.errors.patientPinCode.message}
          </span>
        ) : null}
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Google Maps link (optional)
        <input
          {...form.register('patientMapsLink')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="https://maps.google.com/..."
        />
      </label>
    </div>
  );

  const renderServiceDetailStep = () => {
    if (!selectedService) return null;

    const slug = selectedService.slug;

    if (slug === 'doctor-home-consultation') {
      return (
        <div className="space-y-5">
           <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                form.setValue('appointmentType', 'IMMEDIATE');
                form.setValue('slotId', '');
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${appointmentType === 'IMMEDIATE' ? 'bg-navy-700 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
            >
               Request Immediate Visit
            </button>
            <button
              type="button"
              onClick={() => {
                form.setValue('appointmentType', 'SCHEDULED');
                form.setValue('slotId', '');
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${appointmentType === 'SCHEDULED' ? 'bg-navy-700 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
            >
               Schedule Appointment
            </button>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Main complaint
            <textarea
              {...form.register('chiefComplaint')}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Describe the issue"
            />
            {form.formState.errors.chiefComplaint ? (
              <span className="text-xs text-red-600">
                {form.formState.errors.chiefComplaint.message}
              </span>
            ) : null}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Symptom duration
              <input
                {...form.register('symptomDuration')}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                placeholder="2 days"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Existing conditions
              <input
                {...form.register('existingConditions')}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                placeholder="Diabetes, asthma..."
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Current medicines
              <input
                {...form.register('currentMedicines')}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                placeholder="List current medicines"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Allergies / history
              <input
                {...form.register('allergies')}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                placeholder="Medicines or food allergies"
              />
            </label>
          </div>
        </div>
      );
    }

    if (slug === 'ecg-at-home') {
      return (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            We will coordinate the ECG visit detail and ensure a qualified technician is scheduled
            for your preferred time.
          </div>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Reason for ECG / concern
            <textarea
              {...form.register('chiefComplaint')}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Describe the cardiac concern or reason for the ECG"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Notes for the technician
            <textarea
              {...form.register('notes')}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Any relevant symptoms, timing preferences, or instructions"
            />
          </label>
        </div>
      );
    }

    if (slug === 'blood-test-at-home') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Select one or more blood tests.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {selectedServiceItems.map((item) => {
              const checked = selectedItemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const next = checked
                      ? selectedItemIds.filter((id) => id !== item.id)
                      : [...selectedItemIds, item.id];
                    form.setValue('serviceItemIds', next, { shouldValidate: true });
                  }}
                  className={`rounded-xl border p-4 text-left ${
                    checked ? 'border-navy-700 bg-navy-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <span className="text-sm text-teal-700">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {form.formState.errors.serviceItemIds ? (
            <p className="text-sm text-red-600">{form.formState.errors.serviceItemIds.message}</p>
          ) : null}
        </div>
      );
    }

    if (slug === 'xray-at-home') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Choose the X-Ray type.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {selectedServiceItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => form.setValue('serviceItemIds', [item.id], { shouldValidate: true })}
                className={`rounded-xl border p-4 text-left ${
                  selectedItemIds.includes(item.id)
                    ? 'border-navy-700 bg-navy-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <span className="text-sm text-teal-700">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {form.formState.errors.serviceItemIds ? (
            <p className="text-sm text-red-600">{form.formState.errors.serviceItemIds.message}</p>
          ) : null}
        </div>
      );
    }

    if (slug === 'medicine-home-delivery') {
      return (
        <div className="space-y-4">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Prescription file
            <input
              key={selectedServiceId}
              type="file"
              accept={UPLOAD_ALLOWED_MIME_TYPES.join(',')}
              onChange={(event) => {
                form.setValue('prescription', event.target.files?.[0], { shouldValidate: true });
                setApiError('');
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <span className="text-xs font-normal text-slate-500">
              JPEG, PNG, or PDF. Maximum 5MB.
            </span>
            {form.formState.errors.prescription ? (
              <span className="text-xs text-red-600">
                {form.formState.errors.prescription.message}
              </span>
            ) : null}
          </label>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Additional delivery notes (optional)
            <textarea
              {...form.register('notes')}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Share any delivery instructions"
            />
          </label>
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Your prescription is uploaded securely with your booking request and will be reviewed by
            our care team.
          </div>
        </div>
      );
    }

    if (slug === 'online-consultation') {
      return (
        <div className="space-y-4">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Reason for consultation
            <textarea
              {...form.register('chiefComplaint')}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Describe the concern"
            />
            {form.formState.errors.chiefComplaint ? (
              <span className="text-xs text-red-600">
                {form.formState.errors.chiefComplaint.message}
              </span>
            ) : null}
          </label>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Additional notes
            <textarea
              {...form.register('notes')}
              className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
              placeholder="Any additional context"
            />
          </label>
        </div>
      );
    }

    return (
      <p className="text-sm text-red-700">This service is not available for online booking.</p>
    );
  };

  const renderSlotStep = () => {
    if (appointmentType === 'IMMEDIATE') {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
          The earliest available doctor request will be reviewed by our care team. No specific slot
          is selected at this stage.
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Appointment date
          <input
            type="date"
            min={getCurrentPuneDate()}
            value={selectedSlotDate}
            onChange={(event) => {
              setSelectedSlotDate(event.target.value);
              form.setValue('slotId', '', { shouldValidate: true });
            }}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          />
        </label>
        {isLoadingSlots ? (
          <p className="text-sm text-slate-600">Loading available slots...</p>
        ) : !slots.length ? (
          <p className="text-sm text-slate-600">
            No available slots on this date. Please choose another date.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => form.setValue('slotId', slot.id, { shouldValidate: true })}
                className={`rounded-xl border p-4 text-left ${
                  form.watch('slotId') === slot.id
                    ? 'border-navy-700 bg-navy-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <p className="font-semibold text-slate-900">
                  {new Date(slot.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {slot.startTime} - {slot.endTime}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderReviewStep = () => {
    if (!selectedService) return null;

    return (
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div>
          <p className="text-sm text-slate-500">Selected service</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedService.name}</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Patient</p>
            <p className="font-medium text-slate-900">{form.getValues('patientName')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Mobile</p>
            <p className="font-medium text-slate-900">{form.getValues('patientPhone')}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-500">Address</p>
            <p className="font-medium text-slate-900">{form.getValues('patientAddress')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Appointment</p>
            <p className="font-medium text-slate-900">
               {appointmentType === 'IMMEDIATE' ? 'Immediate Visit Request' : 'Scheduled Appointment'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Amount</p>
            <p className="font-medium text-slate-900">
              ₹{selectedServiceAmount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const content =
    step === 0
      ? renderServiceStep()
      : step === 1
        ? renderPatientStep()
        : step === 2
          ? renderServiceDetailStep()
          : step === 3
            ? renderSlotStep()
            : renderReviewStep();

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8 flex flex-wrap gap-2">
        {stepTitles.map((title, index) => (
          <div
            key={title}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              index === step ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {index + 1}. {title}
          </div>
        ))}
      </div>

      {content}

      {apiError ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{apiError}</p>
      ) : null}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              void nextStep();
            }}
            className="rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white"
            disabled={isSubmitting}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void form.handleSubmit(onSubmit)()}
            className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white"
            disabled={isSubmitting}
          >
             {isSubmitting ? 'Confirming Booking...' : 'Confirm Booking'}
          </button>
        )}
      </div>
    </div>
  );
}
