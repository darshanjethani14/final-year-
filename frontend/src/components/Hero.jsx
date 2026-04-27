import { Link } from "react-router-dom";

function Hero() {
  const heroImage =
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2400&q=80";

  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-[#7E3AF2]/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="section-max-width relative">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full bg-[#7E3AF2]/10 px-3 py-1 text-[11px] font-bold tracking-widest text-[#7E3AF2] uppercase">
              <span className="mr-2">🚀</span>
              AI-Powered Mock Tests
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-[#333333] sm:text-5xl lg:text-6xl">
              Prepare for IELTS with <span className="text-[#7E3AF2]">AI Mock Tests</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-gray-500 max-w-xl">
              Experience realistic IELTS practice tests with instant AI
              feedback. Master all four modules and achieve your target band
              score with our intelligent learning platform.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/modules"
                className="btn-primary"
              >
                🎯 Start Practice
              </Link>
              <Link
                to="/dashboard"
                className="btn-secondary"
              >
                📊 Go to Dashboard
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
              <img src={heroImage} alt="Students studying" className="h-full w-full object-cover" />
            </div>
            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-gray-200 p-6 rounded-2xl shadow-xl animate-float">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Success Rate</p>
                  <p className="text-2xl font-black text-[#333333]">98.2%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

