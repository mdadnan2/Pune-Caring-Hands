import { SectionHeading } from '../../components/section-heading';
import { ServiceCard } from '../../components/service-card';
import { services } from '../../lib/site-data';

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <SectionHeading
        title="Healthcare services designed for everyday life"
        description="Professional healthcare services delivered to your doorstep across Pune."
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:gap-8">
        {services.map((service) => (
          <ServiceCard key={service.slug} service={service} />
        ))}
      </div>
    </div>
  );
}
