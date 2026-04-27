import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import InstructionsModal from "../components/InstructionsModal";
import ConfirmSubmitModal from "../components/ConfirmSubmitModal";
import AIEvaluationModal from "../components/AIEvaluationModal";
import { useAuth } from "../AuthContext";
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

const BACKEND = "http://localhost:4000";

const DEFAULT_PARTS = [
  {
    part: 1,
    title: "Part 1: Introduction & Interview",
    prompt: "Loading prompt...",
    duration: 45,
  },
  {
    part: 2,
    title: "Part 2: Long Turn",
    prompt: "Loading prompt...",
    duration: 120,
  },
  {
    part: 3,
    title: "Part 3: Discussion",
    prompt: "Loading prompt...",
    duration: 60,
  },
];

function Speaking() {
  const navigate = useNavigate();
  const { student, token, handleAuthError } = useAuth();

  const [parts, setParts] = useState(DEFAULT_PARTS);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${BACKEND}/api/tests/speaking-prompts`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          handleAuthError({ status: 401 });
          return;
        }

        const data = await res.json();
        if (res.ok && data) {
          setParts([
            {
              part: 1,
              title: "Part 1: Introduction & Interview",
              prompt: Array.isArray(data.part1) ? data.part1.join(" ") : data.part1,
              duration: 45,
            },
            {
              part: 2,
              title: "Part 2: Long Turn",
              prompt: data.part2,
              duration: 120,
            },
            {
              part: 3,
              title: "Part 3: Discussion",
              prompt: Array.isArray(data.part3) ? data.part3.join(" ") : data.part3,
              duration: 60,
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch speaking prompts:", err);
      }
    };
    fetchTasks();
  }, [token]);

  // ── Phase state ──
  const [hasStarted, setHasStarted] = useState(false);
  const [currentPart, setCurrentPart] = useState(0); // 0-indexed
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // ── Timer ──
  const [timeLeft, setTimeLeft] = useState(DEFAULT_PARTS[0].duration);
  const [timerRunning, setTimerRunning] = useState(false);

  // ── Answer collection (Blob) ──
  const [answers, setAnswers] = useState([null, null, null]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // ── AI evaluation ──
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null); // { band_score, feedback }
  const [evalError, setEvalError] = useState(null);

  const [partScores, setPartScores] = useState([null, null, null]);
  const textareaRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (!timerRunning) return;
    if (timeLeft <= 0) {
      setTimerRunning(false);
      if (isRecording) stopRecording();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timeLeft, isRecording]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progress = Math.round(((parts[currentPart].duration - timeLeft) / parts[currentPart].duration) * 100);

  // ── Recording Logic ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000
      });
      recorder.camera = stream;
      mediaRecorderRef.current = recorder;

      recorder.startRecording();
      setIsRecording(true);
      setTimeLeft(parts[currentPart].duration); // Reset timer on start/re-record
      setTimerRunning(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Please allow microphone access to record your answer.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stopRecording(() => {
        const audioBlob = mediaRecorderRef.current.getBlob();
        const updated = [...answers];
        updated[currentPart] = audioBlob;
        setAnswers(updated);
        if (mediaRecorderRef.current.camera) {
          mediaRecorderRef.current.camera.getTracks().forEach((track) => track.stop());
        }
      });
      setIsRecording(false);
      setTimerRunning(false);
    }
  };

  const evaluateWithAI = async (partIndex, audioBlob) => {
    setEvaluating(true);
    setEvalResult(null);
    setEvalError(null);

    const formData = new FormData();
    formData.append("question", parts[partIndex].prompt);
    formData.append("audio", audioBlob, `part${partIndex + 1}.wav`);

    try {
      const res = await fetch(`${BACKEND}/api/ai/evaluate-speaking-audio`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (res.status === 401) {
        handleAuthError({ status: 401 });
        throw new Error("Session expired. Please login again.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Evaluation failed.");
      }

      console.log("🤖 Speaking AI Response:", data);
      setEvalResult(data);
    } catch (err) {
      setEvalError(err.message || "Could not connect to the AI service.");
    } finally {
      setEvaluating(false);
    }
  };

  // ── Handle Next / Complete ──
  const handleNext = async () => {
    const audioBlob = answers[currentPart];
    if (!audioBlob) {
      alert("Please record your response before continuing.");
      return;
    }
    await evaluateWithAI(currentPart, audioBlob);
    // After evaluation result is shown, user clicks "Continue"
  };

  const [finalResult, setFinalResult] = useState(null);

  // Called after user views the result for one part
  const handleContinueAfterResult = async () => {
    const currentScore = evalResult?.band_score || 0;

    // 1. Store the score for this part
    const updatedScores = [...partScores];
    updatedScores[currentPart] = currentScore;
    setPartScores(updatedScores);

    setEvalResult(null);
    setEvalError(null);

    if (currentPart < parts.length - 1) {
      const next = currentPart + 1;
      setCurrentPart(next);
      setTimeLeft(parts[next].duration);
      setTimerRunning(false);
    } else {
      // All parts done — Calculate Average & Save
      try {
        const validScores = updatedScores.filter(s => s !== null);
        const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        // Round to nearest 0.5, cap at 9
        const finalBand = Math.min(Math.round(avgScore * 2) / 2, 9);

        const userId = student?.id;
        const saveRes = await fetch(`${BACKEND}/api/tests/scores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            module: "speaking",
            bandScore: finalBand,
            feedback: "Detailed scores per part available below."
          })
        });

        if (!saveRes.ok) console.warn("Failed to save speaking score.");

        setFinalResult({ bandScore: finalBand, partScores: updatedScores });
      } catch (err) {
        console.error("Save speaking error:", err);
        const avgScore = updatedScores.reduce((a, b) => a + b, 0) / 3;
        setFinalResult({ bandScore: Math.round(avgScore * 2) / 2, partScores: updatedScores });
      }
    }
  };

  if (finalResult) {
    const radius = 88;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - ((finalResult.bandScore || 0) / 9) * circumference;

    return (
      <div className="min-h-screen flex flex-col pb-20">
        <Navbar />
        <main className="max-w-4xl mx-auto p-6 mt-10 w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[#333333] mb-1">Test Completed</h2>
            <p className="text-gray-500">AI Evaluation Final Result — IELTS Speaking Module</p>
          </div>

          {/* Overall Score Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 mb-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#7E3AF2]"></div>
            <h2 className="text-sm font-bold text-[#7E3AF2] uppercase tracking-[0.2em] mb-10">Final Performance</h2>

            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" className="stroke-gray-100" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="44" className="stroke-[#7E3AF2]" strokeWidth="10" fill="none"
                    strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * (finalResult.bandScore / 9))} strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s" }} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-[#333333] tracking-tight">{finalResult.bandScore?.toFixed(1)}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Overall Band</span>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Part Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((partNum, idx) => (
              <div key={partNum} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md hover:border-[#7E3AF2]/30">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Part {partNum} Result</span>
                <div className="w-16 h-16 rounded-full bg-[#7E3AF2]/5 flex items-center justify-center border border-[#7E3AF2]/10 mb-4">
                  <span className="text-2xl font-black text-[#7E3AF2]">{finalResult.partScores[idx]?.toFixed(1) || "N/A"}</span>
                </div>
                <p className="text-xs font-bold text-gray-500">{getBandLabel(finalResult.partScores[idx])}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary w-full py-4 text-lg shadow-lg shadow-[#7E3AF2]/20"
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  // ── INSTRUCTIONS SCREEN ──
  if (!hasStarted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <InstructionsModal
          isOpen={true}
          onClose={() => navigate("/dashboard")}
          onStart={() => {
            setHasStarted(true);
            setTimeLeft(parts[0].duration);
          }}
          title="Speaking Module Instructions"
          instructions={[
            "The Speaking test has 3 parts of increasing complexity.",
            "Read the prompt carefully before you start the timer.",
            "Click the microphone icon to record your response.",
            "Click 'Start Timer' when ready — the countdown will begin.",
            "After each part, click 'Evaluate' — the AI will score your spoken response.",
            "Your band score and detailed feedback will be shown before the next part.",
          ]}
        />
      </div>
    );
  }

  const currentDetails = parts[currentPart];

  // ── RESULT/EVALUATING SCREEN (after evaluation) ──
  if (evaluating || evalResult || evalError) {
    const isLast = currentPart === parts.length - 1;
    return (
      <div className="min-h-screen flex flex-col pb-20">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center items-center h-full">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-10 w-full text-center relative overflow-hidden">
            {evaluating ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <AIEvaluationModal isOpen={true} module="speaking" />
                <p className="text-gray-500 font-medium animate-pulse">AI is analyzing your speaking performance...</p>
              </div>
            ) : evalError ? (
              <div className="py-8">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-200">
                  <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#333333] mb-4">Evaluation Failed</h2>
                <p className="text-rose-700 text-sm mb-6 bg-rose-50 rounded-xl p-4 border border-rose-200">{evalError}</p>
                <p className="text-xs text-gray-500 mb-6">Make sure the backend API is running.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setEvalError(null); setEvalResult(null); }} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm">
                    ← Try Again
                  </button>
                  <button
                    onClick={() => navigate("/results", { state: { module: "Speaking", score: 6.0, feedback: "AI evaluation was unavailable." } })}
                    className="btn-primary text-sm"
                  >
                    Skip to Results
                  </button>
                </div>
              </div>
            ) : evalResult ? (
              <>
                <div className="text-center mb-8">
                  <p className="text-sm font-bold uppercase tracking-widest text-[#7E3AF2] mb-2">Part {currentPart + 1} Score</p>

                  {/* Dynamic Circular Progress */}
                  <div className="relative w-36 h-36 mx-auto mb-6 group">
                    <div className="absolute inset-0 bg-[#7E3AF2]/10 rounded-full blur-2xl group-hover:bg-[#7E3AF2]/20 transition-all"></div>
                    <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="45" fill="none"
                        stroke="#7E3AF2"
                        strokeWidth="8"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * (evalResult.band_score / 9))}
                        strokeLinecap="round"
                        className="transition-all duration-1500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                      <span className="text-5xl font-black text-[#333333] group-hover:scale-110 transition-transform">{evalResult.band_score?.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Band Score</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-[#333333] tracking-tight">{getBandLabel(evalResult.band_score)}</h2>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gray-200"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Detailed Assessment</span>
                  <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                {evalResult.criteria && (
                  <div className="flex flex-col gap-8 mb-12 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <CriterionCard
                        title="Fluency & Coherence"
                        data={evalResult.criteria.fluency}
                        color="indigo"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      />
                      <CriterionCard
                        title="Lexical Resource"
                        data={evalResult.criteria.lexical}
                        color="purple"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                      />
                      <CriterionCard
                        title="Grammatical Range"
                        data={evalResult.criteria.grammar}
                        color="emerald"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                      />
                      <CriterionCard
                        title="Pronunciation"
                        data={evalResult.criteria.pronunciation}
                        color="pink"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                      />
                    </div>
                  </div>
                )}

                {evalResult.transcript && (
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-6 text-left shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#7E3AF2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      What the AI Heard (Generated Transcript)
                    </h3>
                    <p className="text-gray-700 text-sm italic border-l-2 border-[#7E3AF2]/50 pl-4 py-1 bg-white rounded-r-lg">
                      "{evalResult.transcript}"
                    </p>
                  </div>
                )}

                <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-10 text-left shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#7E3AF2]"></div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#7E3AF2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Overall Feedback Summary
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {evalResult.feedback
                      .replace(/(Overall Band|Fluency|Lexical|Grammar|Pronunciation|Detailed Feedback)(_feedback)?\s*[:\-].*?(\n|$)/gi, '')
                      .replace(/["{}]/g, '')
                      .trim() || "Review the criteria above for details."}
                  </p>
                </div>

                <button
                  onClick={handleContinueAfterResult}
                  className="btn-primary w-full py-4 text-lg"
                >
                  {isLast ? "View Final Results →" : `Continue to Part ${currentPart + 2} →`}
                </button>
              </>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  // ── MAIN TEST SCREEN ──
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm min-h-[72px]">
        <h1 className="text-xl font-bold text-[#333333] tracking-tight">IELTS Speaking</h1>
        <PartDots current={currentPart} />
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Question card */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7E3AF2] mb-2">
            Part {currentDetails.part} of {parts.length}
          </p>
          <h2 className="text-2xl font-bold text-[#333333] mb-4">{currentDetails.title}</h2>
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
            {currentDetails.prompt.split("\n").map((line, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "font-semibold text-[#333333] mb-3"
                    : "text-gray-600 text-sm mb-2 ml-4 relative before:absolute before:-left-4 before:content-['•'] before:text-[#7E3AF2]"
                }
              >
                {line.replace(/^-\s/, "")}
              </p>
            ))}
          </div>
        </div>

        {/* Timer card */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 flex items-center gap-6">
          <div className="flex flex-col items-center min-w-[80px]">
            <span className={`text-3xl font-mono font-bold ${timeLeft <= 15 ? "text-rose-500 animate-pulse" : "text-[#333333]"}`}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">remaining</span>
          </div>
          {/* Progress bar */}
          <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
            <div
              className="h-full rounded-full bg-[#7E3AF2] transition-all duration-1000 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-50 border border-gray-200 text-gray-500 uppercase tracking-widest">
            {isRecording ? "🔴 Recording" : "🕒 Timer Auto-Starts"}
          </div>
        </div>

        {/* Recording Interface */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 flex flex-col items-center justify-center gap-6 min-h-[240px]">
          <h3 className="text-lg font-bold text-[#333333]">Your Response</h3>

          {isRecording ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center relative border border-rose-200">
                <div className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-50" />
                <svg className="w-10 h-10 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <button onClick={stopRecording} className="px-8 py-3 bg-rose-600 hover:bg-rose-700 focus-ring text-white font-bold rounded-xl shadow-sm transition-colors border border-rose-700">
                Stop Recording
              </button>
            </div>
          ) : answers[currentPart] ? (
            <div className="flex flex-col items-center gap-5 w-full max-w-md">
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex flex-col items-center gap-4 w-full">
                <audio src={URL.createObjectURL(answers[currentPart])} controls className="h-12 w-full rounded-xl" />
                <button onClick={startRecording} className="px-6 py-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 focus-ring text-gray-700 font-bold rounded-xl transition-colors text-sm">
                  Re-record
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="w-24 h-24 bg-[#7E3AF2]/10 border border-[#7E3AF2]/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#7E3AF2]/20 hover:scale-105 transition-all group focus-ring" onClick={startRecording} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && startRecording()}>
                <svg className="w-10 h-10 text-[#7E3AF2] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">Click microphone to start recording</p>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="flex justify-end pb-10 mt-4">
          <button
            onClick={handleNext}
            disabled={!answers[currentPart] || isRecording}
            className="btn-primary py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {currentPart === parts.length - 1 ? "✨ Evaluate & Complete" : "✨ Evaluate Part & Continue →"}
          </button>
        </div>
      </main>

      <ConfirmSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={() => navigate("/results", { state: { module: "Speaking", score: 6.0, feedback: "Good fluency. Ensure complex grammar structures." } })}
      />

      <AIEvaluationModal
        isOpen={evaluating}
        module="speaking"
        expectedTime={330}
      />
    </div>
  );
}

// ── Helper: Part progress dots ──
function PartDots({ current }) {
  return (
    <div className="flex gap-2 items-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${i < current ? "w-6 bg-[#7E3AF2]" : i === current ? "w-10 bg-[#7E3AF2]" : "w-6 bg-gray-200"
            }`}
        />
      ))}
    </div>
  );
}

// ── Helper: Band label ──
function getBandLabel(score) {
  if (score >= 8.5) return "Expert Speaker 🏆";
  if (score >= 7.5) return "Very Good Speaker ⭐";
  if (score >= 6.5) return "Good Speaker 👍";
  if (score >= 5.5) return "Competent Speaker";
  if (score >= 4.5) return "Modest Speaker";
  return "Limited Speaker";
}

// ── Helper: Criterion Card ──
// ── Helper: Criterion Card ──────────────────────────────────────────────────
const CRITERION_COLORS = {
  indigo: { bg: "bg-[#7E3AF2]/5", border: "border-[#7E3AF2]/20", text: "text-[#7E3AF2]", progress: "bg-[#7E3AF2]" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", progress: "bg-purple-500" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", progress: "bg-emerald-500" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-600", progress: "bg-pink-500" },
};

function CriterionCard({ title, data, icon, color = "indigo" }) {
  if (!data) return null;

  // Extract band score and feedback text
  // Pattern: looks for a number like 7.0 or 7
  const scoreMatch = data.match(/\b([1-9](?:\.[05])?)\b/);
  const band = scoreMatch ? parseFloat(scoreMatch[1]) : 5.0;

  // Clean feedback text (remove the score and repetitive keys)
  const cleanFeedback = data
    .replace(/\b([1-9](?:\.[05])?)\b\.?/, '') // remove first band number
    .replace(/^(Fluency|Lexical|Grammar|Pronunciation).{0,5}[:\-]/i, '') // remove leading keys
    .trim();

  const c = CRITERION_COLORS[color] || CRITERION_COLORS.indigo;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-6 flex flex-col gap-4 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={c.text}>{icon}</span>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</h4>
        </div>
        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${c.border} ${c.text} bg-white shadow-sm`}>
          BAND {band.toFixed(1)}
        </div>
      </div>

      <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${c.progress} transition-all duration-1000`}
          style={{ width: `${(band / 9) * 100}%` }}
        />
      </div>

      <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
        {cleanFeedback || "Review focus areas in this category."}
      </p>
    </div>
  );
}

export default Speaking;
