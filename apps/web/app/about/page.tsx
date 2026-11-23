export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-sm font-semibold text-teal-700">About Us</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
        Home healthcare information for Pune families.
      </h1>
      <div className="mt-6 max-w-3xl space-y-5 text-base leading-relaxed text-slate-600 sm:text-lg">
        <p>
          Pune Caring Hands was created to make healthcare services easier to arrange in the comfort
          of home. Our booking flow helps patients and caregivers share the details needed to request
          care.
        </p>
        <p>
          The platform supports service discovery, patient details, time-slot requests, and payment
          proof submission for home healthcare services.
        </p>
      </div>
    </div>
  );
}
