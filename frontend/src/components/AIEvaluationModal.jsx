import React, { useState, useEffect } from 'react';

const MODULE_CONFIG = {
  reading: {
    header: "AI Reading Analysis",
    subtext: "Analysing your text answers against the passages...",
    defaultTime: 60, // 1 minute
  },
  listening: {
    header: "AI Audio Analysis",
    subtext: "Analysing your responses against the audio transcripts...",
    defaultTime: 120, // 2 minutes
  },
  writing: {
    header: "AI Essay Assessment",
    subtext: "Analysing your coherence, grammar, and vocabulary...",
    defaultTime: 120, // 2 minutes
  },
  speaking: {
    header: "AI Speaking Analysis",
    subtext: "Transcribing and analysing your audio responses...",
    defaultTime: 120, // 2 minutes
  }
};

const AIEvaluationModal = ({ isOpen, module, expectedTime, score }) => {
  const [progress, setProgress] = useState(0);
  const config = MODULE_CONFIG[module?.toLowerCase()] || MODULE_CONFIG.reading;
  const timeLimit = expectedTime || config.defaultTime;
  
  const waitMinutes = Math.ceil(timeLimit / 60);
  const waitText = `EST. WAIT: ${waitMinutes} ${waitMinutes === 1 ? 'MINUTE' : 'MINUTES'}`;
  
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min((elapsed / timeLimit) * 100, 99); // Cap at 99% until finished
      setProgress(newProgress);
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, timeLimit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-10 flex flex-col items-center max-w-md w-full text-center border border-gray-200 shadow-2xl relative overflow-hidden">

        <div className="relative mb-8 mt-10">
          <div className="relative bg-white rounded-full p-4 border border-[#7E3AF2]/10 shadow-sm">
            <svg className="w-16 h-16 text-[#7E3AF2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-black text-[#333333] mb-3 tracking-tight">
          {config.header}
        </h2>
        
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          {config.subtext}
        </p>

        {/* Progress Section */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] font-bold text-[#7E3AF2] uppercase tracking-widest">
              Processing Analysis {score && <span className="ml-1 opacity-50">{score}</span>}
            </span>
            <span className="text-xs font-black text-[#333333]">{Math.round(progress)}%</span>
          </div>
          
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-[#7E3AF2] to-[#A855F7] rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(126,58,242,0.2)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          
        </div>

        <p className="text-[10px] text-gray-400 mt-8 font-bold uppercase tracking-widest flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {waitText}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}} />
    </div>
  );
};

export default AIEvaluationModal;
