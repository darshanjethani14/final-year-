import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Timer from "../components/Timer";
import InstructionsModal from "../components/InstructionsModal";
import ConfirmSubmitModal from "../components/ConfirmSubmitModal";
import AIEvaluationModal from "../components/AIEvaluationModal";
import { useAuth } from "../AuthContext";

import { BACKEND_URL as BACKEND } from "../apiConfig";

// ─── Small helper components ──────────────────────────────────────────────────

function ScoreBadge({ isCorrect, unanswered }) {
  if (unanswered)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
        — Unanswered
      </span>
    );
  return isCorrect ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
      ✓ Correct
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
      ✗ Incorrect
    </span>
  );
}

function QuestionResultCard({ r, index }) {
  const [expanded, setExpanded] = useState(!r.isCorrect);
  const unanswered = !r.userAnswer || r.userAnswer === "";

  return (
    <div
      className={`rounded-2xl border transition-all bg-white ${unanswered
          ? "border-gray-200 hover:border-gray-300"
          : r.isCorrect
            ? "border-emerald-200 hover:border-emerald-300"
            : "border-rose-200 hover:border-rose-300"
        }`}
    >
      <div
        className="flex items-start gap-4 p-5 cursor-pointer select-none group focus-ring rounded-2xl"
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl font-bold text-sm ${unanswered
              ? "bg-gray-100 text-gray-500 border border-gray-200"
              : r.isCorrect
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-rose-100 text-rose-700 border border-rose-200"
            }`}
        >
          {r.questionNumber || index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <ScoreBadge isCorrect={r.isCorrect} unanswered={unanswered} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {r.questionType?.replace(/_/g, " ")}
            </span>
          </div>

          <p className="text-[#333333] font-semibold text-sm leading-relaxed">
            {r.question}
          </p>

          <div className="flex flex-wrap gap-4 mt-3 text-xs">
            <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-gray-500 font-semibold uppercase tracking-wide mr-2">Your Answer: </span>
              <span className={`font-bold ${unanswered ? "text-gray-500 italic" : r.isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                {unanswered ? "(blank)" : r.userAnswer}
              </span>
            </div>
            {!r.isCorrect && (
              <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span className="text-emerald-700 font-semibold uppercase tracking-wide mr-2">Correct: </span>
                <span className="font-bold text-emerald-600">{r.correctAnswer}</span>
              </div>
            )}
          </div>
        </div>

        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${expanded ? "bg-[#7E3AF2] text-white shadow-sm" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"}`}>
          {expanded ? "Hide" : "Explain"}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0">
          <div className="flex gap-3 p-4 rounded-xl bg-[#7E3AF2]/5 border border-[#7E3AF2]/20">
            <div className="flex-1">
              <span className="block text-[10px] font-bold text-[#7E3AF2] uppercase tracking-widest mb-2 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Feedback
              </span>
              <p className="text-gray-700 text-sm leading-relaxed">{r.explanation || "No explanation available."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PassageResultGroup({ title, qs, index, allPassages }) {
  const [showPassage, setShowPassage] = useState(false);
  const passageObj = allPassages.find((p) => p.passage_title === title);

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-4 mb-6">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]">
          {index + 1}
        </span>
        <h3 className="text-xl font-black text-white tracking-tight flex-1">
          {title}
        </h3>

        <button
          onClick={() => setShowPassage(!showPassage)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            showPassage
              ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          {showPassage ? "Hide Passage" : "View Passage"}
        </button>
      </div>

      {showPassage && (
        <div className="mb-8 p-8 glass-panel animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="prose prose-invert max-w-none">
              {passageObj?.passage_text
                ?.split("\n")
                .filter((p) => p.trim() !== "")
                .map((para, i) => (
                  <div key={i} className="mb-4">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {para.replace(/^[A-Z][.:\s]+|Paragraph\s+[A-Z][.:\s]+/i, '').trim()}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {qs.map((r, i) => (
          <QuestionResultCard key={i} r={r} index={i} />
        ))}
      </div>
    </div>
  );
}

function Reading() {
  const navigate = useNavigate();
  const { student, token } = useAuth();
  const [hasStarted, setHasStarted] = useState(false);
  const [passages, setPassages] = useState([]);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const fetchAllPassages = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND}/api/reading`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPassages(data || []);
        }
      } catch (err) {
        console.error("Fetch passages error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (hasStarted) fetchAllPassages();
  }, [hasStarted, token]);

  const currentPassage = passages[currentPassageIndex];
  const questions = currentPassage?.questions || [];

  const handleAnswerChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitModalOpen(false);
    setIsEvaluating(true);

    try {
      const res = await fetch(`${BACKEND}/api/reading/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ passages, userAnswers: answers })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        
        // Save score to statistics
        await fetch(`${BACKEND}/api/tests/scores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: student?.id,
            module: "reading",
            score: data.score,
            bandScore: data.bandScore,
            feedback: "Detailed analysis in results.",
            answers: answers
          })
        });
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
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
          title="Reading Module"
          instructions={[
            "Read the passages carefully.",
            "Answer all questions based on the text.",
            "Time limit: 60 minutes."
          ]}
        />
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (result) {
    const groupedResults = result.results.reduce((acc, r) => {
      const title = r.passageTitle || "General Questions";
      if (!acc[title]) acc[title] = [];
      acc[title].push(r);
      return acc;
    }, {});

    return (
      <div className="min-h-screen flex flex-col pb-20">
        <Navbar />
        <main className="max-w-4xl mx-auto p-6 mt-16 w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[#333333] mb-1">Test Completed</h2>
            <p className="text-gray-500">AI Evaluation — IELTS Reading Module</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 mb-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#7E3AF2]"></div>
            <h2 className="text-sm font-bold text-[#7E3AF2] uppercase tracking-[0.2em] mb-10">Test Performance</h2>
            
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center w-48 h-48 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" className="stroke-gray-100" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="44" className="stroke-[#7E3AF2]" strokeWidth="10" fill="none" 
                          strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * (result.bandScore / 9))} strokeLinecap="round" 
                          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s" }} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-[#333333] tracking-tight">{result.bandScore?.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Band Score</span>
                </div>
              </div>
              
              <div className="px-6 py-2 rounded-2xl bg-gray-50 border border-gray-200 inline-flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Accuracy</span>
                <span className="text-lg font-black text-[#333333]">{result.score} <span className="text-xs text-gray-400 font-bold">/ {result.total}</span></span>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {Object.keys(groupedResults).map((title, pIdx) => (
              <div key={pIdx} className="space-y-4">
                <h3 className="text-xl font-bold text-[#7E3AF2] flex items-center gap-3">
                  <span className="w-8 h-px bg-[#7E3AF2]/30"></span>
                  {title}
                  <span className="flex-1 h-px bg-[#7E3AF2]/30"></span>
                </h3>
                <div className="grid gap-4">
                  {groupedResults[title].map((r, i) => (
                    <QuestionResultCard key={i} r={r} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full mt-16 py-5 text-lg"
          >
            Return to Dashboard
          </button>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm min-h-[72px]">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-[#333333] tracking-tight">IELTS Reading</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            {passages.map((p, idx) => (
              <button
                key={p._id}
                onClick={() => setCurrentPassageIndex(idx)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all focus-ring ${currentPassageIndex === idx ? 'bg-[#7E3AF2] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
              >
                Passage {idx + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Timer durationMinutes={60} onComplete={handleFinalSubmit} />
          <button onClick={() => setIsSubmitModalOpen(true)} className="btn-primary py-2 px-5 text-sm">
            Submit Test
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto p-6 gap-6">
        <section className="flex-1 overflow-y-auto bg-white border border-gray-200 shadow-sm rounded-2xl p-8 custom-scrollbar relative">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-[#333333] mb-6 tracking-tight">{currentPassage?.passage_title}</h2>
            <div className="prose max-w-none">
              {currentPassage?.passage_text?.split('\n').map((para, i) => (
                <p key={i} className="text-[#333333] text-lg leading-relaxed mb-6">
                  {para.replace(/^[A-Z][.:\s]+|Paragraph\s+[A-Z][.:\s]+/i, '').trim()}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="w-1/2 overflow-y-auto bg-white border border-gray-200 shadow-sm rounded-2xl p-8 custom-scrollbar">
            <div className="space-y-6 mb-8">
              {questions.map((q, idx) => {
                const isTFNG = q.question_type === "TRUE_FALSE_NOT_GIVEN";
                const isMCQ = q.question_type === "MCQ";
                const isBlanks = q.question_type === "FILL_IN_BLANKS" || !q.question_type;

                return (
                  <div key={q._id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm transition-all hover:border-[#7E3AF2]/30 hover:bg-[#7E3AF2]/5">
                    <div className="flex gap-4">
                      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-[#7E3AF2]/10 text-[#7E3AF2] border border-[#7E3AF2]/20 font-bold text-sm">
                        {q.question_number || idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#333333] font-semibold mb-6 leading-relaxed">
                          {q.question}
                        </p>

                        {/* Rendering Options for TFNG and MCQ */}
                        {(isTFNG || isMCQ) && (
                          <div className="grid gap-3">
                            {(isTFNG ? ["TRUE", "FALSE", "NOT GIVEN"] : Object.keys(q.options || {})).map((optKey) => {
                              const optLabel = isTFNG ? optKey : q.options[optKey];
                              const isSelected = answers[q._id] === optKey;
                              return (
                                <label 
                                  key={optKey} 
                                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer group focus-ring ${
                                    isSelected ? 'border-[#7E3AF2] bg-[#7E3AF2]/10' : 'border-gray-200 bg-white hover:border-[#7E3AF2]/50 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected ? 'border-[#7E3AF2] bg-[#7E3AF2]' : 'border-gray-300 group-hover:border-gray-400'
                                  }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                  </div>
                                  <input
                                    type="radio"
                                    name={`question-${q._id}`}
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={() => handleAnswerChange(q._id, optKey)}
                                  />
                                  <span className={`text-sm font-bold ${isSelected ? 'text-[#7E3AF2]' : 'text-gray-600'}`}>
                                    {isMCQ && <span className="mr-2 opacity-50">{optKey}:</span>}
                                    {optLabel}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Rendering Input for Blanks */}
                        {isBlanks && (
                          <div className="relative">
                            <input
                              type="text"
                              value={answers[q._id] || ""}
                              onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                              placeholder="Type your answer here..."
                              className="input-field font-medium"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {currentPassageIndex < passages.length - 1 ? (
              <button
                onClick={() => setCurrentPassageIndex(prev => prev + 1)}
                className="btn-primary w-full py-3"
              >
                Next Passage
              </button>
            ) : (
              <button onClick={() => setIsSubmitModalOpen(true)} className="btn-primary w-full py-3 !from-emerald-600 !to-teal-600 hover:!from-emerald-500 hover:!to-teal-500 !border-emerald-400/30">
                Finish and Submit
              </button>
            )}
        </section>
      </main>

      <ConfirmSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleFinalSubmit}
        unattemptedCount={passages.reduce((acc, p) => acc + p.questions.length, 0) - Object.keys(answers).length}
      />

      <AIEvaluationModal 
        isOpen={isEvaluating} 
        module="reading" 
        expectedTime={30} 
      />
    </div>
  );
}

export default Reading;