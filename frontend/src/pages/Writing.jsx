import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Timer from "../components/Timer";
import InstructionsModal from "../components/InstructionsModal";
import ConfirmSubmitModal from "../components/ConfirmSubmitModal";
import AIEvaluationModal from "../components/AIEvaluationModal";
import { useAuth } from "../AuthContext";

import { BACKEND_URL as BACKEND } from "../apiConfig";

function Writing() {
  const navigate = useNavigate();
  const { student, token, handleAuthError } = useAuth();
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTask, setActiveTask] = useState(1);
  const [isTask1Complete, setIsTask1Complete] = useState(false);
  const [task1Text, setTask1Text] = useState("");
  const [task2Text, setTask2Text] = useState("");
  const [dbTasks, setDbTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND}/api/tests/writing-prompts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.status === 401) {
          handleAuthError({ status: 401 });
          return;
        }

        const data = await res.json();
        if (res.ok) {
          if (data.length === 0) {
            console.warn("No writing questions found in database.");
          }
          setDbTasks(data);
        }
      } catch (err) {
        console.error("Failed to fetch writing tasks:", err);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, [token]);

  const task1Question = dbTasks.find(t => t.meta?.taskNumber === 1)?.text || "Error: Failed to load Task 1 from Database. Check your Node backend terminal.";
  const task2Question = dbTasks.find(t => t.meta?.taskNumber === 2)?.text || "Error: Failed to load Task 2 from Database. Check your Node backend terminal.";

  // AI Evaluation states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState(null);
  const [result, setResult] = useState(null);

  const task1WordCount = task1Text.trim() === "" ? 0 : task1Text.trim().split(/\s+/).length;
  const task2WordCount = task2Text.trim() === "" ? 0 : task2Text.trim().split(/\s+/).length;

  const handleTask1Submit = () => {
    setIsTask1Complete(true);
    setActiveTask(2);
  };

  const handleSubmitRequest = () => setIsSubmitModalOpen(true);

  const evaluateTask = async (taskType, prompt, answer) => {
    try {
      const res = await fetch(`${BACKEND}/api/ai/evaluate-writing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: prompt,
          answer: answer.trim(),
          task_type: taskType,   // ← tell the model Task 1 vs Task 2
        }),
      });

      if (res.status === 401) {
        handleAuthError({ status: 401 });
        throw new Error("Session expired. Please login again.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to evaluate Task ${taskType}`);
      return data;
    } catch (err) {
      console.error(`Error evaluating Task ${taskType}:`, err);
      throw err;
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitModalOpen(false);
    setIsEvaluating(true);
    setEvalError(null);

    try {
      let results = [];
      
      if (task1Text.trim().length > 20) {
        const res1 = await evaluateTask(1, task1Question, task1Text);
        results.push({ task: 1, ...res1 });
      }

      if (task2Text.trim().length > 20) {
        const res2 = await evaluateTask(2, task2Question, task2Text);
        results.push({ task: 2, ...res2 });
      }

      if (results.length === 0) {
        throw new Error("Please provide a response for at least one task before submitting.");
      }

      // band_score from Flask is already (mean of 4 criteria), capped at 9.
      // IELTS overall = Task1 × 1/3 + Task2 × 2/3 when both tasks done.
      const t1Score = results.find(r => r.task === 1)?.band_score ?? 0;
      const t2Score = results.find(r => r.task === 2)?.band_score ?? 0;

      let rawOverall = 0;
      if (results.length === 2) {
        rawOverall = (t1Score * 1 + t2Score * 2) / 3;
      } else {
        rawOverall = t1Score || t2Score;
      }
      // Round to nearest 0.5 (IELTS standard), cap at 9
      const bandScore = Math.min(Math.round(rawOverall * 2) / 2, 9);
      
      const combinedFeedback = results.map(r => `[Task ${r.task} Band: ${r.band_score}]:\n${r.feedback}`).join("\n\n──────────\n\n");

      // Save to Backend
      const saveRes = await fetch(`${BACKEND}/api/tests/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: student?.id,
          module: "writing",
          bandScore: bandScore,
          feedback: combinedFeedback,
          essay: `Task 1: ${task1Text}\n\nTask 2: ${task2Text}`
        })
      });

      if (!saveRes.ok) console.warn("Failed to save score to backend history.");

      setResult({ bandScore, feedback: combinedFeedback, results });
      setIsEvaluating(false);

    } catch (err) {
      setEvalError(err.message || "Something went wrong during evaluation. Please try again.");
      setIsEvaluating(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <InstructionsModal
          isOpen={true}
          onClose={() => navigate('/dashboard')}
          onStart={() => setHasStarted(true)}
          title="Writing Module Instructions"
          instructions={[
            "You have 60 minutes total for both tasks.",
            "Task 1 requires at least 150 words.",
            "Task 2 requires at least 250 words.",
            "The timer will NOT restart when you switch tasks."
          ]}
        />
      </div>
    );
  }

  // Result Screen
  if (result) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - ((result.bandScore || 0) / 9) * circumference;

    return (
      <div className="min-h-screen flex flex-col pb-20">
        <Navbar />
        <main className="max-w-5xl mx-auto p-6 mt-10 pb-16 w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[#333333] mb-1">Test Completed</h2>
            <p className="text-gray-500">AI Evaluation — IELTS Writing Module</p>
          </div>

          {/* Overall Score Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 mb-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#7E3AF2]"></div>
            <h2 className="text-sm font-bold text-[#7E3AF2] uppercase tracking-[0.2em] mb-10">Test Performance</h2>
            
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" className="stroke-gray-100" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="44" className="stroke-[#7E3AF2]" strokeWidth="10" fill="none" 
                          strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * (result.bandScore / 9))} strokeLinecap="round" 
                          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s" }} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-[#333333] tracking-tight">{result.bandScore}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Band Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Per-task cards (Gap ensured by mb-12 on card) */}
          {result.results && result.results.length > 0 && (
            <div className="flex flex-col gap-10">
              {result.results.map((r, i) => {
                const isTask1    = r.task === 1;
                const c          = r.criteria || {};
                const c1Label    = isTask1 ? "Task Achievement" : "Task Response";

                // Support both old (string) and new ({band, feedback}) shapes
                const getCriterion = (key) => {
                  const v = c[key];
                  if (!v) return null;
                  if (typeof v === "object") return v;          // new shape
                  return { band: null, feedback: String(v) };   // old shape
                };

                const ta = getCriterion("task_achievement");
                const cc = getCriterion("coherence");
                const lr = getCriterion("lexical");
                const gr = getCriterion("grammar");

                return (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

                    {/* Task header */}
                    <div className="flex justify-between items-center px-8 py-5 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-bold text-[#333333] flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#7E3AF2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Task {r.task} Evaluation
                      </h3>
                      <div className="bg-[#7E3AF2]/10 border border-[#7E3AF2]/20 px-5 py-1.5 rounded-full text-[#7E3AF2] font-bold text-sm">
                        Overall Band {r.band_score}
                      </div>
                    </div>

                    {/* 4 Criterion cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                      <CriterionCard
                        title={c1Label}
                        data={ta}
                        color="emerald"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      />
                      <CriterionCard
                        title="Coherence & Cohesion"
                        data={cc}
                        color="blue"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                      />
                      <CriterionCard
                        title="Lexical Resource"
                        data={lr}
                        color="purple"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                      />
                      <CriterionCard
                        title="Grammatical Range & Accuracy"
                        data={gr}
                        color="indigo"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                      />
                    </div>

                    {/* Overall narrative feedback for this task */}
                    <div className="px-8 pb-8">
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                          Overall Feedback
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm">{r.feedback}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-center mt-10">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary px-10 py-3"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Loading Screen

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm min-h-[72px]">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[#333333] tracking-tight">IELTS Writing</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <div className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all focus-ring ${activeTask === 1 ? 'bg-[#7E3AF2] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 cursor-pointer hover:bg-gray-200/50'}`} onClick={() => setActiveTask(1)}>
              Task 1
            </div>
            <div className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all focus-ring ${activeTask === 2 ? 'bg-[#7E3AF2] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 cursor-pointer hover:bg-gray-200/50'}`} onClick={() => setActiveTask(2)}>
              Task 2
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Timer key="writing-total-timer" durationMinutes={60} onComplete={handleSubmitRequest} />
          <button onClick={activeTask === 1 ? handleTask1Submit : handleSubmitRequest} className="btn-primary">
            {activeTask === 1 ? "Submit Task 1 & Continue" : "Submit Final Answers"}
          </button>
        </div>
      </header>

      {evalError && (
        <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex justify-between items-center shadow-sm">
          <span><strong>Error:</strong> {evalError}</span>
          <button onClick={() => setEvalError(null)} className="text-rose-500 hover:text-rose-700 transition-colors">✕</button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(100vh-80px)]">
               {/* Left: Prompt */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 overflow-y-auto custom-scrollbar">
          {loadingTasks ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-8 h-8 border-4 border-[#7E3AF2]/30 border-t-[#7E3AF2] rounded-full animate-spin" />
              <p className="text-gray-500 text-sm animate-pulse">Fetching task description...</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#333333] mb-6">
                {activeTask === 1 ? "Academic Writing Task 1" : "Academic Writing Task 2"}
              </h2>
              
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-8 shadow-sm">
                <p className="text-amber-700 text-sm font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  60 minutes total for both tasks. Suggested: 20m for Task 1, 40m for Task 2.
                </p>
              </div>
 
              <div className="prose prose-p:text-gray-700 text-base leading-relaxed">
                <div className="whitespace-pre-wrap font-medium text-[#333333] mb-4">
                  {activeTask === 1 ? task1Question : task2Question}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Text Area */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 flex flex-col relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#333333] flex items-center gap-2">
              <svg className="w-5 h-5 text-[#7E3AF2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Your Answer
            </h3>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${(activeTask === 1 ? task1WordCount >= 150 : task2WordCount >= 250) ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
              {activeTask === 1 ? task1WordCount : task2WordCount} / {activeTask === 1 ? '150' : '250'} words
            </div>
          </div>
          
          <textarea
            value={activeTask === 1 ? task1Text : task2Text}
            onChange={(e) => activeTask === 1 ? setTask1Text(e.target.value) : setTask2Text(e.target.value)}
            placeholder="Start typing your response here..."
            className="flex-1 w-full p-5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7E3AF2] focus:ring-1 focus:ring-[#7E3AF2] outline-none resize-none transition-all placeholder:text-gray-400 text-[#333333] font-sans custom-scrollbar leading-relaxed"
            spellCheck="false"
          />
        </div>
      </main>

      <ConfirmSubmitModal 
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleFinalSubmit}
        unattemptedCount={0}
      />

      <AIEvaluationModal 
        isOpen={isEvaluating} 
        module="writing" 
        expectedTime={330} 
      />
    </div>
  );
}

// ── Helper: Criterion Card ──────────────────────────────────────────────────
// data shape: { band: number|null, feedback: string } | null
const COLOR_MAP = {
  emerald: { bg: "bg-emerald-50",  border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700 border-emerald-200",  icon: "text-emerald-500" },
  blue:    { bg: "bg-blue-50",     border: "border-blue-200",    badge: "bg-blue-100 text-blue-700 border-blue-200",     icon: "text-blue-500"    },
  purple:  { bg: "bg-purple-50",   border: "border-purple-200",  badge: "bg-purple-100 text-purple-700 border-purple-200",   icon: "text-purple-500"  },
  indigo:  { bg: "bg-[#7E3AF2]/5", border: "border-[#7E3AF2]/20", badge: "bg-[#7E3AF2]/10 text-[#7E3AF2] border-[#7E3AF2]/20", icon: "text-[#7E3AF2]"  },
};

function CriterionCard({ title, data, color = "indigo", icon }) {
  if (!data) return null;
  const { band, feedback } = data;
  const c = COLOR_MAP[color] || COLOR_MAP.indigo;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md`}>
      {/* Title row + band badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={c.icon}>{icon}</span>
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</h4>
        </div>
        {band !== null && band !== undefined && (
          <span className={`${c.badge} border text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap`}>
            Band {band}
          </span>
        )}
      </div>
      {/* Feedback text */}
      {feedback && (
        <p className="text-sm text-gray-600 leading-relaxed">{feedback}</p>
      )}
    </div>
  );
}

export default Writing;
