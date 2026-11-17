'use client';

import { useMemo, useState } from 'react';
import { services, type ServiceItem } from '../lib/site-data';

const initialState = {
  patientName: '',
  phone: '',
  email: '',
  address: '',
  pinCode: '',
  age: '',
  complaint: '',
  notes: '',
};

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceItem | undefined>(services[0]);
  const [form, setForm] = useState(initialState);
  const [slot, setSlot] = useState('2026-11-20T10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const stepTitles = ['Service', 'Patient', 'Details', 'Slot', 'Review'];
  const currentService = useMemo(() => selectedService ?? services[0], [selectedService]);

  if (!currentService) {
    return null;
  }

  const updateField = (field: keyof typeof initialState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const stepContent = () => {
    if (step === 0) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <button
              key={service.slug}
              type="button"
              onClick={() => {
                setSelectedService(service);
                setMessage('');
              }}
              className={`rounded-2xl border p-5 text-left transition ${
                (selectedService ?? services[0])?.slug === service.slug
                  ? 'border-navy-700 bg-navy-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-semibold text-teal-700">{service.price}</p>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{service.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{service.description}</p>
            </button>
          ))}
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Full name
            <input value={form.patientName} onChange={(e) => updateField('patientName', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100" placeholder="Enter full name" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Mobile
            <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100" placeholder="9876543210" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            Email
            <input value={form.email} onChange={(e) => updateField('email', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100" placeholder="you@example.com" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            Address
            <textarea value={form.address} onChange={(e) => updateField('address', e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100" placeholder="Complete address" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            PIN code
            <input value={form.pinCode} onChange={(e) => updateField('pinCode', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100" placeholder="411001" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Age / DOB
            <input value={form.age} onChange={(e) => updateField('age', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100" placeholder="35" />
          </label>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Main complaint
            <textarea value={form.complaint} onChange={(e) => updateField('complaint', e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100" placeholder="Brief description of the problem" />
          </label>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Additional notes
            <textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100" placeholder="Diet, symptoms, allergies, or upload notes" />
          </label>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-4">
          <div className="flex gap-4">
            <button type="button" onClick={() => setSlot('2026-11-20T10:00')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${slot === '2026-11-20T10:00' ? 'bg-navy-700 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>
              Morning slot
            </button>
            <button type="button" onClick={() => setSlot('2026-11-20T16:30')} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${slot === '2026-11-20T16:30' ? 'bg-navy-700 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>
              Evening slot
            </button>
          </div>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            Preferred date and time
            <input
              type="datetime-local"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
            />
          </label>
        </div>
      );
    }

    return (
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div>
          <p className="text-sm text-slate-500">Selected service</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">{currentService.name}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><p className="text-sm text-slate-500">Patient</p><p className="font-medium text-slate-900">{form.patientName || 'Not provided'}</p></div>
          <div><p className="text-sm text-slate-500">Contact</p><p className="font-medium text-slate-900">{form.phone || 'Not provided'}</p></div>
          <div className="md:col-span-2"><p className="text-sm text-slate-500">Address</p><p className="font-medium text-slate-900">{form.address || 'Not provided'}</p></div>
          <div><p className="text-sm text-slate-500">Complaint</p><p className="font-medium text-slate-900">{form.complaint || 'Not provided'}</p></div>
          <div><p className="text-sm text-slate-500">Preferred slot</p><p className="font-medium text-slate-900">{slot}</p></div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Estimated price</p>
          <p className="mt-1 text-2xl font-bold text-navy-800">{currentService.price}</p>
        </div>
      </div>
    );
  };

  const canContinue = step < 4;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: currentService.slug,
          appointmentType: 'SCHEDULED',
          patientName: form.patientName,
          patientPhone: form.phone,
          patientEmail: form.email,
          patientAddress: form.address,
          patientPinCode: form.pinCode,
          patientDateOfBirth: form.age,
          notes: form.notes,
          serviceDetails: { complaint: form.complaint },
        }),
      });

      if (!response.ok) {
        throw new Error('Booking submission failed.');
      }

      const data = await response.json();
      setMessage(`Booking created successfully. Reference: ${data?.data?.bookingRef ?? 'PCH-20261117-0001'}`);
      setStep(4);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong while booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8 flex flex-wrap gap-2">
        {stepTitles.map((title, index) => (
          <div key={title} className={`rounded-full px-3 py-1.5 text-sm font-medium ${index === step ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {index + 1}. {title}
          </div>
        ))}
      </div>

      {stepContent()}

      {message ? <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

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
              if (step === 4) {
                return void handleSubmit();
              }
              setStep((current) => Math.min(stepTitles.length - 1, current + 1));
            }}
            className="rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
            disabled={!canContinue || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Continue'}
          </button>
        ) : (
          <button type="button" onClick={() => void handleSubmit()} className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit booking'}
          </button>
        )}
      </div>
    </div>
  );
}
