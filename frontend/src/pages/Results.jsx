import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../AuthContext";

import { BACKEND_URL as BACKEND } from "../apiConfig";

function Results() {
  const { student, token, handleAuthError } = useAuth();
  const [history, setHistory] = useState({
    reading: [],
    writing: [],
    listening: [],
    speaking: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!student?.id) return;
      try {
        const res = await fetch(`${BACKEND}/api/tests/history/${student.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          handleAuthError({ status: 401 });
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Fetch history error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [student, token]);

  const getLevelLabel = (score) => {
    if (score >= 8.5) return { label: "Expert", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (score >= 7.0) return { label: "Good", color: "bg-blue-100 text-blue-700 border-blue-200" };
    if (score >= 5.5) return { label: "Competent", color: "bg-orange-100 text-orange-700 border-orange-200" };
    return { label: "Modest", color: "bg-gray-100 text-gray-700 border-gray-200" };
  };

  const renderModuleHistory = (title, data) => (
    <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black text-[#333333] tracking-tight">{title}</h3>
        <div className="px-4 py-1.5 rounded-2xl bg-[#7E3AF2]/5 border border-[#7E3AF2]/10 text-[#7E3AF2] text-[10px] font-bold uppercase tracking-widest">
          {data.length} Attempts
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
           <p className="text-gray-400 text-sm font-medium">No attempts recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-5 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
          {data.map((item, idx) => {
            const score = item.bandScore || 0;
            const level = getLevelLabel(score);
            const displayDate = item.takenAt ? new Date(item.takenAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            }) : "Recently";

            return (
              <div key={idx} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-[#7E3AF2]/30 hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#7E3AF2]/10 group-hover:bg-[#7E3AF2] transition-colors"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{displayDate}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black border w-fit ${level.color}`}>
                      {level.label.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#333333] tracking-tighter">{score.toFixed(1)}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Band</span>
                    </div>
                    {item.score !== undefined && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Score: {item.score} / 40</span>
                    )}
                  </div>
                </div>

                {item.feedback && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2 italic">
                      "{item.feedback}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 pt-10">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black text-[#333333] mb-3 tracking-tight">Your Test History</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Track your progress across all IELTS modules and review your previous feedback to improve your performance.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#7E3AF2] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Loading your scores...</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {renderModuleHistory("Reading", history.reading)}
            {renderModuleHistory("Listening", history.listening)}
            {renderModuleHistory("Writing", history.writing)}
            {renderModuleHistory("Speaking", history.speaking)}
          </div>
        )}
      </main>
    </div>
  );
}

export default Results;
