function QuestionCard({
  index,
  total,
  question,
  type = "mcq",
  options = [],
  value,
  onChange
}) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
        <span>
          Question {index + 1} of {total}
        </span>
        <span>
          {type === "writing" ? "Writing Task" : "Multiple Choice"}
        </span>
      </div>
      <h2 className="mb-4 text-base font-bold text-[#333333]">
        {question}
      </h2>

      {type === "writing" ? (
        <textarea
          className="mt-2 min-h-[160px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#7E3AF2] focus:bg-white focus:ring-2 focus:ring-[#7E3AF2]/20 transition-all duration-200"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Type your answer here..."
        />
      ) : (
        <div className="mt-2 space-y-2">
          {options.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                value === opt.value
                  ? "border-[#7E3AF2] bg-[#7E3AF2]/5 text-[#7E3AF2]"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={`q-${index}`}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange?.(opt.value)}
                className="h-4 w-4 cursor-pointer accent-[#7E3AF2]"
              />
              <span className="font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuestionCard;

