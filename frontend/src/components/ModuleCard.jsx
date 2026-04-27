function ModuleCard({ title, description, onStart, accent }) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm flex flex-col justify-between rounded-2xl p-6 transition-transform hover:-translate-y-1 hover:border-[#7E3AF2]/50">
      <div>
        <div
          className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white ${accent} shadow-sm shadow-black/5`}
        >
          {title.charAt(0)}
        </div>
        <h3 className="mb-2 text-lg font-bold text-[#333333]">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 inline-flex w-fit items-center justify-center rounded-full bg-[#7E3AF2] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#6930D0] transition-colors focus-ring"
      >
        Start Practice
      </button>
    </div>
  );
}

export default ModuleCard;

