export default function ConfirmSubmitModal({ isOpen, onClose, onConfirm, unattemptedCount = 0 }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center border border-gray-200">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#7E3AF2]/10">
          <svg className="h-8 w-8 text-[#7E3AF2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-[#333333] mb-2">Submit Test?</h2>
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to finish and submit your test? You will not be able to change your answers after submission.
          {unattemptedCount > 0 && (
            <span className="block mt-2 font-semibold text-amber-600">
              You have {unattemptedCount} unanswered questions.
            </span>
          )}
        </p>

        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="btn-secondary min-w-[120px]">
            Review Answers
          </button>
          <button onClick={onConfirm} className="btn-primary min-w-[120px]">
            Submit Now
          </button>
        </div>
      </div>
    </div>
  );
}
