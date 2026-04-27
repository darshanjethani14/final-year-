function BrainIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9.5 4.5a3.5 3.5 0 0 0-3.3 4.6 3.2 3.2 0 0 0 0 6.2A3.5 3.5 0 0 0 9.5 19.5M14.5 4.5a3.5 3.5 0 0 1 3.3 4.6 3.2 3.2 0 0 1 0 6.2 3.5 3.5 0 0 1-3.3 4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 7.5v9M14 7.5v9M12 6.5v11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TargetIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21a9 9 0 1 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 17a5 5 0 1 0-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 13a1 1 0 1 0-1-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14.5 9.5 21 3l-2.2 6.5L14.5 9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GraphIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 19V5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 19h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 15l3-3 3 2 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 7v4h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const features = [
  {
    title: "AI Evaluation",
    text: "Instant AI feedback for writing and speaking",
    Icon: BrainIcon
  },
  {
    title: "Smart Practice",
    text: "Adaptive tests based on your skill level",
    Icon: TargetIcon
  },
  {
    title: "Progress Tracking",
    text: "Track your band score improvements",
    Icon: GraphIcon
  }
];

function Features() {
  return (
    <section className="bg-white">
      <div className="section-max-width py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Why Choose Our Platform?
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Leverage cutting-edge AI technology to accelerate your IELTS
            preparation
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {features.map(({ title, text, Icon }) => (
            <div
              key={title}
              className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;

