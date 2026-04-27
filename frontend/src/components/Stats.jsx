const stats = [
  { value: "98%", label: "Success Rate" },
  { value: "50K+", label: "Students" },
  { value: "180+", label: "Countries" },
  { value: "4.9/5", label: "Rating" }
];

function Stats() {
  return (
    <section className="bg-white">
      <div className="section-max-width py-12 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="text-center p-6 border-x border-gray-100 first:border-l-0 last:border-r-0"
            >
              <div className="text-4xl font-black tracking-tight text-[#7E3AF2] sm:text-5xl">
                {item.value}
              </div>
              <div className="mt-2 text-sm font-bold uppercase tracking-widest text-gray-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;

