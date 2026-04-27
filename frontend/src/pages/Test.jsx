import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Timer from "../components/Timer";
import QuestionCard from "../components/QuestionCard";

const mockQuestions = [
  {
    type: "mcq",
    question:
      "In the IELTS Listening test, how many sections does each recording typically have?",
    options: [
      { value: "a", label: "Two sections" },
      { value: "b", label: "Three sections" },
      { value: "c", label: "Four sections" },
      { value: "d", label: "Five sections" }
    ]
  },
  {
    type: "mcq",
    question:
      "In the Reading test, which question type requires you to complete sentences using words from the passage?",
    options: [
      { value: "a", label: "Matching headings" },
      { value: "b", label: "Summary completion" },
      { value: "c", label: "Multiple choice" },
      { value: "d", label: "True / False / Not Given" }
    ]
  },
  {
    type: "writing",
    question:
      "Writing Task 2: Some people believe that studying abroad is the best way to improve educational outcomes. To what extent do you agree or disagree?"
  }
];

function Test() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = mockQuestions[currentIndex];

  const handleChange = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: value
    }));
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, mockQuestions.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const progress = useMemo(
    () => (Object.keys(answers).length / mockQuestions.length) * 100,
    [answers]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <Navbar />
      <div className="section-max-width flex flex-1 gap-6 py-6">
        <Sidebar />

        <main className="flex-1 pb-10">
          <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7E3AF2]">
                IELTS Mock Test
              </p>
              <h1 className="mt-1 text-3xl font-black text-[#333333]">
                Practice Test Interface
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Timed questions with navigation similar to real online exams.
              </p>
            </div>
            <Timer
              durationMinutes={30}
              onComplete={() => {
                if (!submitted) setSubmitted(true);
              }}
            />
          </header>

          <section className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Overall progress</span>
              <span className="tabular-nums">
                {Math.round(progress)}
                {"%"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#7E3AF2] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <QuestionCard
            index={currentIndex}
            total={mockQuestions.length}
            question={currentQuestion.question}
            type={currentQuestion.type}
            options={currentQuestion.options}
            value={answers[currentIndex]}
            onChange={handleChange}
          />

          <footer className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50 transition-colors focus-ring"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === mockQuestions.length - 1}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50 transition-colors focus-ring"
              >
                Next
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
            >
              Submit test
            </button>
          </footer>

          {submitted && (
            <div className="mt-8 rounded-2xl border border-[#7E3AF2]/30 bg-[#7E3AF2]/5 p-6 text-sm text-[#7E3AF2]">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-bold">Test submitted successfully!</p>
              </div>
              <p className="mt-2 text-gray-600">
                Connect this screen to your scoring logic and redirect to the Results page after evaluation.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Test;

