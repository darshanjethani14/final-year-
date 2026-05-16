import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import InstructionsModal from "../components/InstructionsModal";
import ConfirmSubmitModal from "../components/ConfirmSubmitModal";
import AIEvaluationModal from "../components/AIEvaluationModal";
import { useAuth } from "../AuthContext";

import { BACKEND_URL as BACKEND } from "../apiConfig";

const calculateListeningBand = (score) => {
  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 32) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 26) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 20) return 5.5;
  if (score >= 16) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 6) return 3.5;
  if (score >= 4) return 3.0;
  return 2.5;
};

const normalizeAnswer = (str) => {
  if (!str) return "";
  const numMap = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15",
    "sixteen": "16", "seventeen": "17", "eighteen": "18", "nineteen": "19", "twenty": "20"
  };
  
  let s = str.toString().toLowerCase().trim();
  s = s.replace(/^[.,!?;]+|[.,!?;]+$/g, "");
  if (numMap[s]) return numMap[s];
  s = s.replace(/^(a|an|the)\s+/, "");
  return s;
};

const isAnswerMatch = (user, correct) => {
  const u = normalizeAnswer(user);
  const c = normalizeAnswer(correct);
  if (!u || !c) return false;
  if (u === c) return true;
  if (u + 's' === c || c + 's' === u) return true;
  if (u + 'es' === c || c + 'es' === u) return true;
  return false;
};

function Listening() {
  const navigate = useNavigate();
  const { token, student } = useAuth();
  
  // Test State
  const [hasStarted, setHasStarted] = useState(false);
  const [currentPart, setCurrentPart] = useState(1);
  const [phase, setPhase] = useState("playing"); // "playing" | "review" | "final"
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalTime, setTotalTime] = useState(1800); 
  
  // Data State
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState({});
  const [audioProgress, setAudioProgress] = useState(0);
  
  const audioRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // --- NEW: Section-by-Section Feedback State ---
  const [sectionResult, setSectionResult] = useState(null);
  const [isSectionEvaluating, setIsSectionEvaluating] = useState(false);
  const [showSectionReview, setShowSectionReview] = useState(false);
  const [sectionRawScore, setSectionRawScore] = useState("");

  // Load Questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/tests/questions?module=listening`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setQuestions(data);
        }
      } catch (err) {
        console.error("Fetch questions error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [token]);

  // Phase Timer and Audio Control
  useEffect(() => {
    if (hasStarted && phase !== "final" && !result && !showSectionReview && phase !== "evaluating") {
      // Audio Control: Play when phase is 'playing'
      if (phase === "playing" && audioRef.current) {
        audioRef.current.play().catch(e => {
          console.warn("Autoplay blocked or audio not ready, retrying...", e);
          setTimeout(() => audioRef.current?.play(), 500);
        });
      }

      phaseTimerRef.current = setInterval(() => {
        setPhaseTime((prev) => {
          if (prev <= 1 && phase !== "playing") { 
            handlePhaseTransition();
            return 0;
          }
          return prev - 1;
        });
        setTotalTime(t => t > 0 ? t - 1 : 0);
      }, 1000);
    }
    return () => clearInterval(phaseTimerRef.current);
  }, [hasStarted, phase, currentPart, result, showSectionReview]);

  const handlePhaseTransition = () => {
    if (showSectionReview || phase === "evaluating") return; 
    
    if (phase === "review") {
      setPhase("evaluating"); 
      evaluateCurrentSection();
    }
  };

  const handleAudioEnd = () => {
    setPhase("review");
    setPhaseTime(30); 
  };

  const evaluateCurrentSection = async () => {
    let localCorrect = 0;
    const actualPartQuestions = questions.filter(q => q.phase === currentPart && !q.meta?.isExample && q.meta?.qNumber !== 0);
    
    actualPartQuestions.forEach(q => {
      const qNum = q.meta?.qNumber;
      if (qNum !== undefined && qNum !== 0) {
        let userAns;
        if (q.meta.renderType === "checkbox_group") {
          const groupId = q.meta.groupId;
          userAns = answers[groupId] || [];
          if (userAns.includes(q.correctAnswer)) {
             localCorrect++;
          }
        } else {
          userAns = answers[q._id] || "";
          if (isAnswerMatch(userAns, q.correctAnswer)) {
            localCorrect++;
          }
        }
      }
    });
    setSectionRawScore(`${localCorrect}/${actualPartQuestions.length}`);
    setIsSectionEvaluating(true);
    
    const sectionAnswers = {};
    const partQuestions = questions.filter(q => q.phase === currentPart);
    partQuestions.forEach(q => {
      const qNum = q.meta?.qNumber;
      if (qNum !== undefined) {
        if (q.meta.renderType === "checkbox_group") {
            const groupId = q.meta.groupId;
            sectionAnswers[qNum] = answers[groupId] || [];
        } else {
            sectionAnswers[qNum] = answers[q._id] || "";
        }
      }
    });

    try {
      const res = await fetch(`${BACKEND}/api/listening/evaluate-section`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          sectionNumber: currentPart, 
          answers: sectionAnswers 
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSectionResult(data);
        setShowSectionReview(true);
        setIsSectionEvaluating(false);
      }
    } catch (err) {
      console.error("Section evaluation error:", err);
      setIsSectionEvaluating(false);
    }
  };

  const handleNextSection = () => {
    setShowSectionReview(false);
    setSectionResult(null); 
    
    if (currentPart < 4) {
      setCurrentPart(p => p + 1);
      setPhase("playing");
      setPhaseTime(0); 
      if (audioRef.current) {
        audioRef.current.load();
      }
    } else {
      handleFinalSubmit();
    }
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleMultiSelectChange = (groupId, letter, limit) => {
    const current = answers[groupId] || [];
    let updated;
    if (current.includes(letter)) {
      updated = current.filter(l => l !== letter);
    } else {
      if (current.length >= limit) return;
      updated = [...current, letter];
    }
    setAnswers(prev => ({ ...prev, [groupId]: updated }));
  };

  const handleFinalSubmit = async () => {
    if (audioRef.current) audioRef.current.pause();
    setPhase("final");

    let score = 0;
    const actualQs = questions.filter(q => !q.meta?.isExample && q.meta?.qNumber !== 0);

    actualQs.forEach(q => {
      const qNum = q.meta?.qNumber;
      let isCorrect = false;
      if (q.meta?.renderType === "checkbox_group") {
        const groupId = q.meta.groupId;
        const userLetters = answers[groupId] || [];
        isCorrect = userLetters.includes(q.correctAnswer);
      } else {
        isCorrect = isAnswerMatch(answers[q._id], q.correctAnswer);
      }
      if (isCorrect) score++;
    });

    const calculatedBand = calculateListeningBand(score);

    try {
      const userId = student?.id || student?._id;
      const scoreRes = await fetch(`${BACKEND}/api/tests/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          userId, 
          module: "listening", 
          score: score, 
          bandScore: calculatedBand,
          answers 
        })
      });

      if (scoreRes.ok) {
        setResult({ score, total: actualQs.length });
      }
    } catch (err) {
      console.error("Score submission error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <InstructionsModal
          isOpen={true}
          onClose={() => navigate('/dashboard')}
          onStart={() => {
            setHasStarted(true);
            setPhase("playing");
            setPhaseTime(0);
          }}
          title="Mock Test: IELTS Listening"
          instructions={[
            "4 Sections, 40 Questions total.",
            "30 seconds to prepare before each part.",
            "Audio starts automatically and cannot be paused.",
            "30 seconds to review after each part.",
            "Ensure your volume is at a comfortable level."
          ]}
        />
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
        <Navbar />
        <main className="max-w-4xl mx-auto p-8 mt-10 w-full space-y-12 pb-32">
          {/* Hero Final Score Card */}
          <div className="bg-white border border-gray-100 shadow-2xl rounded-[3rem] p-12 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#7E3AF2] via-emerald-400 to-[#7E3AF2] animate-gradient-x" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-sm font-black text-[#7E3AF2] uppercase tracking-[0.4em]">Final Results</h2>
              <div className="flex flex-col items-center justify-center">
                  <div className="relative bg-white w-48 h-48 rounded-full border-8 border-gray-50 flex flex-col items-center justify-center shadow-xl">
                    <span className="text-7xl font-black text-gray-900 tracking-tight">{calculateListeningBand(result.score).toFixed(1)}</span>
                    <span className="text-[10px] font-black text-[#7E3AF2] uppercase tracking-[0.2em]">Band Score</span>
                  </div>
              </div>
              <div className="flex justify-center items-center gap-12">
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Raw Score</p>
                  <p className="text-2xl font-black text-gray-800">{result.score}<span className="text-gray-300 text-sm">/{result.total}</span></p>
                </div>
              </div>
              <div className="pt-6">
                <button onClick={() => navigate('/dashboard')} className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all hover:shadow-2xl active:scale-95">Return to Dashboard</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestions = questions.filter(q => q.phase === currentPart);
  const groupedQuestions = currentQuestions.reduce((acc, q) => {
    const heading = q.meta?.heading || "General Questions";
    if (!acc[heading]) acc[heading] = [];
    acc[heading].push(q);
    return acc;
  }, {});

  const audioSrc = `${BACKEND}/api/listening-audios/5.${currentPart}.mp3`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 9.5l-.75.75a3.5 3.5 0 000 4.95l.75.75m0-6.45v6.45M6.464 8.464a5 5 0 000 7.072" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-800">Part {currentPart} of 4</h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                  {phase === 'playing' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                  {phase === 'prep' ? `Preparing: ${phaseTime}s` : phase === 'playing' ? 'Live Audio' : phase === 'review' ? `Review: ${phaseTime}s` : 'Evaluating...'}
                </p>
              </div>
            </div>

            {/* Part section bubbles */}
            <div className="flex gap-1">
              {[1,2,3,4].map(p => (
                <div key={p} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                  p < currentPart ? 'bg-blue-600 text-white border-blue-600' :
                  p === currentPart ? 'bg-white text-blue-600 border-blue-400 ring-2 ring-blue-200' :
                  'bg-gray-100 text-gray-400 border-gray-200'
                }`}>{p}</div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed controls */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Speed</span>
              {[0.9, 1.0, 1.25].map(rate => (
                <button
                  key={rate}
                  onClick={() => {
                    setPlaybackRate(rate);
                    if (audioRef.current) audioRef.current.playbackRate = rate;
                  }}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    playbackRate === rate
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {rate}×
                </button>
              ))}
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
              phase === 'review' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {Math.floor(totalTime/60)}:{(totalTime%60).toString().padStart(2,'0')}
            </div>
          </div>
        </div>

        {/* Audio progress bar */}
        <div className="h-1 w-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-500 ease-linear" style={{ width: `${phase === 'playing' ? audioProgress : 0}%` }} />
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 pb-24">

        {/* Visible Audio player */}
        <div className={`mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4 ${phase !== 'playing' ? 'opacity-60' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            phase === 'playing' ? 'bg-blue-600' : 'bg-gray-300'
          }`}>
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-700 mb-1">Section {currentPart} Audio</p>
            <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${audioProgress}%` }} />
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600">{Math.round(audioProgress)}%</span>
          <audio
            ref={audioRef}
            src={audioSrc}
            onEnded={handleAudioEnd}
            onTimeUpdate={(e) => setAudioProgress((e.target.currentTime / e.target.duration) * 100)}
            className="hidden"
          />
        </div>
        
        {showSectionReview && !isSectionEvaluating ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#7E3AF2] to-emerald-400" />
                <div className="text-center mb-12">
                   <h2 className="text-3xl font-black text-gray-800 tracking-tight mb-2">Section {currentPart} Summary</h2>
                   <div className="bg-gray-50 inline-flex items-center gap-6 px-12 py-8 rounded-[2rem] border-2 border-gray-100 shadow-sm mt-4">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Accuracy</p>
                        <p className="text-5xl font-black text-gray-900 tracking-tighter">{sectionResult?.score || "0/0"}</p>
                      </div>
                   </div>
                </div>

                {/* Per-Question Detailed Review List */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-[#7E3AF2] flex items-center gap-3">
                      <span className="w-8 h-px bg-[#7E3AF2]/30"></span>
                      Question-by-Question Analysis
                      <span className="flex-1 h-px bg-[#7E3AF2]/30"></span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {questions.filter(q => q.phase === currentPart && !q.meta?.isExample && q.meta?.qNumber !== 0).map((q, idx) => {
                      const resultStatus = sectionResult?.results?.find(r => r.questionNumber === q.meta?.qNumber);
                      const isCorrect = resultStatus?.isCorrect;
                      const userAns = resultStatus?.userAnswer;
                      const correctAns = q.correctAnswer;
                      const unanswered = !userAns || userAns === "";

                      return (
                        <div key={q._id} className={`bg-white rounded-2xl border transition-all p-6 ${unanswered ? 'border-gray-200' : isCorrect ? 'border-emerald-200 shadow-sm' : 'border-rose-200 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-4">
                              <span className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl font-bold text-sm ${unanswered ? 'bg-gray-100 text-gray-500 border border-gray-200' : isCorrect ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                                {q.meta?.qNumber}
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {unanswered ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">— Unanswered</span>
                                  ) : isCorrect ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">✓ Correct</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">✗ Incorrect</span>
                                  )}
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{q.meta?.renderType?.replace(/_/g, ' ')}</span>
                                </div>
                                <p className="text-[#333333] font-semibold text-sm leading-relaxed">{q.text || q.meta?.label || "Question " + q.meta?.qNumber}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 mt-4 text-xs ml-13">
                            <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                              <span className="text-gray-500 font-semibold uppercase tracking-wide mr-2">Your Answer: </span>
                              <span className={`font-bold ${unanswered ? "text-gray-500 italic" : isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                                {unanswered ? "(blank)" : userAns}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                <span className="text-emerald-700 font-semibold uppercase tracking-wide mr-2">Correct: </span>
                                <span className="font-bold text-emerald-600">{correctAns}</span>
                              </div>
                            )}
                          </div>

                          {/* AI Feedback - Standardized with Reading Module */}
                          <div className="mt-6 pt-5 border-t border-gray-100">
                             <div className="flex gap-4 p-4 rounded-xl bg-[#7E3AF2]/5 border border-[#7E3AF2]/20">
                                <div className="flex-1">
                                   <span className="block text-[10px] font-bold text-[#7E3AF2] uppercase tracking-widest mb-2 flex items-center gap-2">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                      Expert AI Feedback
                                   </span>
                                   <p className="text-gray-700 text-sm leading-relaxed italic">
                                      {resultStatus?.feedback || "Grok is analyzing your answer based on the transcript context..."}
                                   </p>
                                </div>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center pt-16">
                    <button onClick={handleNextSection} className="btn-primary w-full max-w-md py-4 text-lg">
                        {currentPart < 4 ? "Continue to Next Section" : "Finish Test and Save Score"}
                    </button>
                  </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedQuestions).map(([heading, qs]) => (
              <section key={heading} className="bg-white rounded-[2rem] border border-gray-200 shadow-xl overflow-hidden border-t-8 border-t-[#7E3AF2]">
                <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">{heading}</h2>
                    <p className="text-sm font-medium text-gray-500 italic mt-2">{qs[0]?.meta?.instruction}</p>
                  </div>
                  {qs[0]?.meta?.renderType === "checkbox_group" && (
                    <div className="px-4 py-2 bg-[#7E3AF2]/10 rounded-xl">
                      <p className="text-[10px] font-black text-[#7E3AF2] uppercase tracking-widest">Selected</p>
                      <p className="text-lg font-black text-[#7E3AF2]">{(answers[qs[0].meta.groupId] || []).length} / {qs.length}</p>
                    </div>
                  )}
                </div>

                <div className="p-8 space-y-6">
                  {qs[0]?.meta?.renderType === "table" ? (
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-[#7E3AF2] text-center bg-[#7E3AF2]/5 py-2 rounded-xl border border-[#7E3AF2]/20">{qs[0].meta.tableTitle}</h3>
                      <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50/80">
                              {qs[0].meta.tableHeaders.map(h => (
                                <th key={h} className="p-4 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {qs.map(q => (
                              <tr key={q._id} className={`transition-colors border-b border-gray-50 last:border-0 ${q.meta?.isExample ? 'bg-gray-100/40' : 'hover:bg-gray-50/30'}`}>
                                <td className="p-3 font-bold text-gray-700 text-sm w-1/3">
                                  <div className="flex items-center gap-2">
                                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-white text-[9px] font-black text-gray-400 border border-gray-100 shadow-sm">{q.meta.qNumber === 0 ? "EX" : q.meta.qNumber}</span>
                                    {q.meta.label}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    {q.meta?.prefix && <span className="text-sm font-bold text-gray-500 leading-none">{q.meta.prefix}</span>}
                                    {q.meta?.isExample ? (
                                      <div className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-emerald-600 shadow-sm text-sm">
                                        {q.correctAnswer}
                                        <span className="ml-2 text-[8px] font-black text-emerald-400 uppercase tracking-widest">EXAMPLE</span>
                                      </div>
                                    ) : (
                                      <input type="text" value={answers[q._id] || ""} onChange={(e) => handleAnswerChange(q._id, e.target.value)} className="flex-1 px-4 py-2 bg-white border-2 border-gray-100 rounded-lg focus:border-[#7E3AF2] focus:ring-2 focus:ring-[#7E3AF2]/20 outline-none font-bold text-gray-800 shadow-sm text-sm transition-all" placeholder="..." />
                                    )}
                                    {q.meta.suffix && <span className="text-sm font-bold text-gray-500 leading-none">{q.meta.suffix}</span>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : qs[0]?.meta?.renderType === "checkbox_group" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {qs[0].options.map(opt => {
                        const groupId = qs[0].meta.groupId;
                        const selected = answers[groupId] || [];
                        const isChecked = selected.includes(opt.value);
                        const limit = qs.length;
                        return (
                          <button key={opt.value} disabled={!isChecked && selected.length >= limit} onClick={() => handleMultiSelectChange(groupId, opt.value, limit)} className={`flex items-center gap-6 p-6 rounded-[1.5rem] border-2 transition-all text-left ${isChecked ? 'border-[#7E3AF2] bg-[#7E3AF2]/5 text-[#7E3AF2] shadow-md' : (!isChecked && selected.length >= limit) ? 'opacity-40 cursor-not-allowed border-gray-50 bg-gray-50/30' : 'border-white bg-white hover:border-gray-200 text-gray-600 shadow-sm'}`}>
                            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${isChecked ? 'border-[#7E3AF2] bg-[#7E3AF2]' : 'border-gray-300 bg-white'}`}>{isChecked && <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}</div>
                            <span className="text-base font-black">{opt.value}. {opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50/50 rounded-[2rem] border-2 border-gray-50 p-6 space-y-4">
                      {qs.map((q, idx) => {
                        const isSentence = q.meta?.renderType === "sentence_completion";
                        return (
                          <div key={q._id} className={`flex gap-6 items-start transition-all group ${isSentence ? 'py-3 border-b border-gray-100 last:border-0' : 'p-5 bg-white rounded-2xl border-2 border-transparent hover:border-[#7E3AF2]/20 hover:shadow-lg'}`}>
                            <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white text-[#7E3AF2] font-black text-sm shadow-sm border-2 border-gray-100 group-hover:border-[#7E3AF2]/20">{q.meta?.qNumber || idx + 1}</span>
                            <div className="flex-1">
                              {q.options?.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                  <p className="font-black text-gray-800 leading-tight text-lg mb-2">{q.text}</p>
                                  {q.options.map(opt => (
                                    <button key={opt.value} onClick={() => handleAnswerChange(q._id, opt.value)} className={`flex items-center gap-4 py-3 px-6 rounded-2xl border-2 transition-all text-left ${answers[q._id] === opt.value ? 'border-[#7E3AF2] bg-[#7E3AF2]/5 text-[#7E3AF2] shadow-md' : 'border-white bg-white hover:border-gray-200 shadow-sm'}`}>
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${answers[q._id] === opt.value ? 'border-[#7E3AF2] bg-[#7E3AF2]' : 'border-gray-300 bg-white'}`}>{answers[q._id] === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}</div>
                                      <span className="text-base font-black">{opt.value}. {opt.text}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
                                  {q.meta?.prefix && <span className="text-lg font-black text-gray-800 leading-tight">{q.meta.prefix}</span>}
                                  {q.meta?.isExample ? (
                                    <div className="px-8 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl font-black text-emerald-600 shadow-inner text-xl min-w-[220px]">{q.correctAnswer} <span className="ml-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">EXAMPLE</span></div>
                                  ) : (
                                    <input type="text" value={answers[q._id] || ""} onChange={(e) => handleAnswerChange(q._id, e.target.value)} className="flex-1 min-w-[300px] px-8 py-4 bg-white border-2 border-gray-100 rounded-[2rem] focus:border-[#7E3AF2] focus:ring-8 focus:ring-[#7E3AF2]/5 outline-none font-black text-gray-900 shadow-sm text-xl transition-all" placeholder="Type your answer..." />
                                  )}
                                  {q.meta?.suffix && <span className="text-lg font-black text-gray-800 leading-tight">{q.meta.suffix}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <ConfirmSubmitModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} onConfirm={handleFinalSubmit} unattemptedCount={questions.length - Object.keys(answers).length} />
      <AIEvaluationModal isOpen={isSectionEvaluating || isEvaluating} module="listening" expectedTime={isSectionEvaluating ? 30 : 120} score={isSectionEvaluating ? sectionRawScore : null} />
    </div>
  );
}

export default Listening;
