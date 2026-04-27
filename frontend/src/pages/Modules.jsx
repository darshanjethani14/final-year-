import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ModuleCard from "../components/ModuleCard";

const modules = [
  {
    title: "Listening",
    description:
      "Audio recordings with IELTS-style questions and answer sheets.",
    accent: "bg-blue-500"
  },
  {
    title: "Reading",
    description:
      "Passages, question sets, and instant feedback on your answers.",
    accent: "bg-sky-500"
  },
  {
    title: "Writing",
    description:
      "Task 1 & 2 prompts, structures, and model responses to compare.",
    accent: "bg-violet-500"
  },
  {
    title: "Speaking",
    description:
      "Cue cards, sample questions, and timing to simulate the test.",
    accent: "bg-amber-500"
  }
];

function Modules() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <Navbar />
      <div className="section-max-width flex flex-1 gap-6 py-6">
        <Sidebar />

        <main className="flex-1 pb-10">
          <header className="mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7E3AF2]">
                IELTS Modules
              </p>
              <h1 className="mt-1 text-3xl font-black text-[#333333]">
                Practice by skill
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Choose a module to start a focused practice session.
              </p>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            {modules.map((mod) => (
              <ModuleCard
                key={mod.title}
                title={mod.title}
                description={mod.description}
                accent={mod.accent}
                onStart={() => navigate(`/practice/${mod.title.toLowerCase()}`)}
              />
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Modules;

