function AISection() {
  const items = [
    {
      title: "Smart Scoring System",
      text: "Our AI evaluates your responses using the official IELTS band descriptors."
    },
    {
      title: "Real-time Feedback",
      text: "Get immediate insights on grammar, vocabulary, coherence, and pronunciation."
    },
    {
      title: "Adaptive Testing",
      text: "Questions adapt to your level, ensuring optimal learning efficiency."
    },
    {
      title: "24/7 Availability",
      text: "Practice anytime, anywhere with unlimited access to all test materials."
    }
  ];

  return (
    <section className="bg-gray-50/50 border-y border-gray-100">
      <div className="section-max-width py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7E3AF2]">
            Advanced Technology
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#333333] sm:text-4xl">
            Why Prepare with our AI?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Experience the future of IELTS preparation with our intelligent
            assessment system that gives you the edge.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex h-full flex-col rounded-3xl bg-white p-8 shadow-sm border border-gray-100 hover:border-[#7E3AF2]/30 transition-all group"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7E3AF2]/10 text-[#7E3AF2] group-hover:bg-[#7E3AF2] group-hover:text-white transition-colors">
                <span className="text-lg font-black">
                  {item.title.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#333333]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AISection;

