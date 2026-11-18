export type ServiceItem = {
  slug: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  accent: string;
};

export const services: ServiceItem[] = [
  {
    slug: 'doctor-home-consultation',
    name: 'Doctor Home Consultation',
    price: '₹1,500',
    description: 'Expert doctor visits for home-based consultations and treatment guidance.',
    features: ['Same-day assessment', 'Licensed doctor', 'Care at home'],
    accent: 'bg-teal-50 text-teal-700',
  },
  {
    slug: 'ecg-at-home',
    name: 'ECG at Home',
    price: '₹700',
    description: 'Convenient cardiac screening with onsite ECG review and reporting.',
    features: ['Cardiac screening', 'Home testing', 'Review summary'],
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    slug: 'blood-test-at-home',
    name: 'Blood Test at Home',
    price: 'Test-wise pricing',
    description: 'NABL-compliant sample collection from the comfort of your home.',
    features: ['Multiple panels', 'Fast pickup', 'Lab coordination'],
    accent: 'bg-indigo-50 text-indigo-700',
  },
  {
    slug: 'x-ray-at-home',
    name: 'X-Ray at Home',
    price: 'Type-wise pricing',
    description: 'Diagnostic imaging arranged at your home for faster, safer care.',
    features: ['On-site imaging', 'Type selection', 'Reporting'],
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    slug: 'medicine-home-delivery',
    name: 'Medicine Home Delivery',
    price: 'Prescription-based',
    description: 'Submit prescription and receive medicines from a verified delivery path.',
    features: ['Prescription review', 'Admin verification', 'Home delivery'],
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    slug: 'online-consultation',
    name: 'Online Consultation',
    price: '₹500',
    description: 'Quick, phone-based remote consultation with a healthcare professional.',
    features: ['Phone consultation', 'Expert advice', 'Fast booking'],
    accent: 'bg-violet-50 text-violet-700',
  },
];

export const testimonials = [
  {
    name: 'Asha P.',
    quote:
      'The doctor visited on time and explained the care plan clearly. The whole process felt trustworthy and simple.',
  },
  {
    name: 'Rohit M.',
    quote:
      'Booking my ECG at home was effortless. The team called us promptly and explained the report in simple terms.',
  },
  {
    name: 'Sneha K.',
    quote:
      'For my parents, the home consultation service was exactly what we needed — professional, respectful, and convenient.',
  },
];

export const faqs = [
  {
    question: 'Do you provide same-day appointments?',
    answer:
      'We aim to support urgent home-care visits whenever available. Doctor home consultations can be booked as immediate requests or scheduled slots.',
  },
  {
    question: 'Which service areas do you cover?',
    answer:
      'We currently support priority service areas across Pune and its nearby zones. Please check the service areas page for our active PIN code coverage.',
  },
  {
    question: 'Do I need to upload a prescription for medicine delivery?',
    answer:
      'Yes. Prescription upload is required, and the admin team reviews it before confirming medicine availability and delivery details.',
  },
  {
    question: 'How do I pay?',
    answer:
      'The booking flow shows UPI instructions and a QR code. After payment, upload the required screenshot; our team verifies it before confirming the booking.',
  },
];

export const serviceAreas = [
  'Baner',
  'Kharadi',
  'Wakad',
  'Hinjawadi',
  'Kothrud',
  'Shivajinagar',
  'Pimpri-Chinchwad',
  'Viman Nagar',
  'Yerawada',
  'Aundh',
] as const;

export const steps = [
  'Choose service',
  'Patient details',
  'Service details',
  'Time slot',
  'Review & pay',
  'Confirmation',
];
