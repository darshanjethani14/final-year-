import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";

function PracticePhase() {
  const { phaseId } = useParams();
  const skill = phaseId || "practice";
  const label = skill.charAt(0).toUpperCase() + skill.slice(1);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <Navbar />
      <main className="section-max-width flex flex-1 flex-col justify-center py-10">
        <div className="max-w-xl bg-white border border-gray-200 p-8 rounded-3xl shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7E3AF2]">
            Practice module
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#333333]">
            {label} Practice
          </h1>
          <p className="mt-4 text-gray-500 leading-relaxed">
            This page can be connected to your full IELTS mock test engine. For
            now it serves as a placeholder for {label.toLowerCase()} practice
            tests.
          </p>
          <button className="btn-primary mt-8">
            Explore {label} Tests
          </button>
        </div>
      </main>
    </div>
  );
}

export default PracticePhase;

