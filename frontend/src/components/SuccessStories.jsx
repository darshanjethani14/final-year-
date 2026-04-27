function CheckIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.32a1 1 0 0 1-1.42.003L3.29 9.27a1 1 0 1 1 1.42-1.4l3.03 3.07 6.54-6.6a1 1 0 0 1 1.424-.01Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlayIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9 7.5v9l8-4.5-8-4.5Z" />
    </svg>
  );
}

function SuccessStories() {
  return (
    <section className="bg-white">
      <div className="section-max-width py-14 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-red-600 ring-1 ring-red-100">
              Student Success Stories
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Join Thousands of Successful Students
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              See how our students achieved their dream band scores and got
              accepted into top universities worldwide.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {[
                "Average Band Score: 7.5+",
                "University Acceptance",
                "Fast Results"
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="relative overflow-hidden rounded-[28px] bg-slate-200 shadow-sm ring-1 ring-slate-200">
              <div className="aspect-video w-full bg-gradient-to-br from-slate-200 to-slate-300" />
              <button
                type="button"
                className="absolute left-1/2 top-1/2 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-red-500 shadow-lg shadow-black/10 ring-1 ring-slate-200 hover:bg-slate-50"
                aria-label="Play success story video"
              >
                <PlayIcon className="h-7 w-7 translate-x-[1px]" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Video thumbnail (placeholder). Replace with real testimonials or an
              embedded video later.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SuccessStories;

