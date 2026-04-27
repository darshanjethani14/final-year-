import { useEffect } from "react";

export default function InstructionsModal({ isOpen, onClose, title, instructions, onStart }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200"
      >
        <h2 className="text-2xl font-bold text-[#333333] mb-4">{title}</h2>
        
        <div className="mb-6 space-y-4 text-gray-700 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          {instructions.map((inst, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7E3AF2]/10 text-[#7E3AF2] font-semibold text-xs mt-0.5">
                {idx + 1}
              </span>
              <p>{inst}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onStart} className="btn-primary">
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
}
