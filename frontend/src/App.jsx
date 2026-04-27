import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyCode from "./pages/VerifyCode";
import Dashboard from "./pages/Dashboard";
import Modules from "./pages/Modules";
import Test from "./pages/Test";
import Results from "./pages/Results";
import PracticePhase from "./pages/PracticePhase";
import Listening from "./pages/Listening";
import Writing from "./pages/Writing";
import Speaking from "./pages/Speaking";
import Reading from "./pages/Reading";
import Profile from "./pages/Profile";

function App() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#333333]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyCode />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice/reading" element={<Reading />} />
        <Route path="/practice/listening" element={<Listening />} />
        <Route path="/practice/writing" element={<Writing />} />
        <Route path="/practice/speaking" element={<Speaking />} />
        <Route path="/practice/:phaseId" element={<PracticePhase />} />
        <Route path="/modules" element={<Modules />} />
        <Route path="/test" element={<Test />} />
        <Route path="/results" element={<Results />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;