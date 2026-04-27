import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ScoreChart from "../components/ScoreChart";
import { useAuth } from "../AuthContext";

function BookOpenIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function HeadphonesIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function EditIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function MicIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function TrendingUpIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
      <polyline points="17,6 23,6 23,12" />
    </svg>
  );
}

function TargetIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { student, token, handleAuthError } = useAuth();
  const name = student?.name || "Student";
  const [data, setData] = useState({ latest: null, history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.id) {
      setLoading(false);
      return;
    }
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/dashboard/summary/${student.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          handleAuthError({ status: 401 });
          return;
        }

        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [student, token]);

  const hasAttempted = data.latest !== null;
  const latestScores = data.latest || { listening: 0, reading: 0, writing: 0, speaking: 0, overall: 0 };

  const skills = [
    {
      name: "Listening",
      score: latestScores.listening,
      icon: HeadphonesIcon,
      colorClass: "stroke-blue-500",
      bgClass: "bg-blue-50 border-blue-200 text-blue-600",
      btnClass: "bg-blue-600 hover:bg-blue-700 shadow-sm"
    },
    {
      name: "Reading",
      score: latestScores.reading,
      icon: BookOpenIcon,
      colorClass: "stroke-emerald-500",
      bgClass: "bg-emerald-50 border-emerald-200 text-emerald-600",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-sm"
    },
    {
      name: "Writing",
      score: latestScores.writing,
      icon: EditIcon,
      colorClass: "stroke-purple-500",
      bgClass: "bg-purple-50 border-purple-200 text-purple-600",
      btnClass: "bg-purple-600 hover:bg-purple-700 shadow-sm"
    },
    {
      name: "Speaking",
      score: latestScores.speaking,
      icon: MicIcon,
      colorClass: "stroke-orange-500",
      bgClass: "bg-orange-50 border-orange-200 text-orange-600",
      btnClass: "bg-orange-600 hover:bg-orange-700 shadow-sm"
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#7E3AF2]/30 border-t-[#7E3AF2] rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getDisplayScore = (test) => {
    if (test.module === 'listening' && test.score > 9) {
      // Correct raw score to band on the fly if needed for history
      if (test.score >= 39) return 9.0;
      if (test.score >= 37) return 8.5;
      if (test.score >= 35) return 8.0;
      if (test.score >= 32) return 7.5;
      if (test.score >= 30) return 7.0;
      if (test.score >= 26) return 6.5;
      if (test.score >= 23) return 6.0;
      if (test.score >= 20) return 5.5;
      if (test.score >= 16) return 5.0;
      if (test.score >= 13) return 4.5;
      if (test.score >= 10) return 4.0;
      return 3.5;
    }
    return test.bandScore || test.score || 0;
  };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="section-max-width flex flex-1 gap-6 py-6 w-full">
        <Sidebar />

        <main className="flex-1 pb-10 overflow-hidden">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7E3AF2] mb-2">
                  Welcome back
                </p>
                <h1 className="text-4xl font-bold text-[#333333] tracking-tight mb-2 flex items-center gap-3">
                  Hello, {name}! <span className="animate-float inline-block">👋</span>
                </h1>
                <p className="text-gray-500 max-w-2xl">
                  Ready to practice? Choose a module below to start your IELTS mock test.
                </p>
              </div>
            </div>
          </header>

          <section className="grid gap-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {skills.map((skill, index) => (
                <div key={skill.name} 
                     className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center group cursor-default animate-in fade-in slide-in-from-bottom-4 duration-500 hover:border-gray-300 transition-colors"
                     style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`inline-flex p-3 rounded-xl border ${skill.bgClass} mb-4 group-hover:scale-110 transition-transform`}>
                    <skill.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-[#333333] mb-4">{skill.name}</h3>
                  
                  <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r={radius} className="stroke-gray-100" strokeWidth="6" fill="none" />
                      <circle cx="48" cy="48" r={radius} className={skill.colorClass} strokeWidth="6" fill="none" 
                              strokeDasharray={circumference} strokeDashoffset={circumference - (Math.min(9, skill.score) / 9) * circumference} strokeLinecap="round" 
                              style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s" }} />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[#333333]">{hasAttempted ? Math.min(9, skill.score) : "-"}</span>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">/ 9.0</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/practice/${skill.name.toLowerCase()}`)}
                    className={`w-full py-2.5 px-4 rounded-xl text-white font-bold transition-all text-sm ${skill.btnClass} active:scale-95 focus-ring`}
                  >
                    Start Test
                  </button>
                  <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest font-semibold group-hover:text-gray-500 transition-colors">Latest Score</p>
                </div>
              ))}
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-[2rem] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-800">Recent Test Activity</h3>
                <button className="text-xs font-black text-[#7E3AF2] uppercase tracking-widest hover:underline">View All History</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Module</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Band Score</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.history && data.history.length > 0 ? (
                      data.history.map((test, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-white transition-colors`}>
                                {test.module === 'listening' ? <HeadphonesIcon className="w-4 h-4 text-blue-500" /> : 
                                 test.module === 'reading' ? <BookOpenIcon className="w-4 h-4 text-emerald-500" /> :
                                 test.module === 'writing' ? <EditIcon className="w-4 h-4 text-purple-500" /> :
                                 <MicIcon className="w-4 h-4 text-orange-500" />}
                              </div>
                              <span className="font-bold text-gray-700 capitalize">{test.module}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm font-medium text-gray-500">
                            {new Date(test.takenAt || test.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-black text-xs border border-emerald-100">
                              {getDisplayScore(test).toFixed(1)} Band
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#7E3AF2] transition-colors">Details</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-8 py-12 text-center text-sm font-medium text-gray-400 italic">
                          No recent activity found. Take your first test to see history here!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

