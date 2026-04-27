import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../AuthContext";

function Profile() {
  const { student, login } = useAuth();
  
  // Local state for profile form
  const [name, setName] = useState(student?.name || "");
  const [email, setEmail] = useState(student?.email || "");
  
  // Local state for password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMsg("");
    
    // Mock save delay
    await new Promise((r) => setTimeout(r, 600));
    
    // Simulate updating context
    if (student) {
      const updatedUser = { ...student, name, email };
      // Pass existing token if available, using localStorage or simple string
      login(updatedUser, localStorage.getItem("ai-ielts-token") || "mock-token");
    }
    
    setProfileMsg("Profile updated successfully!");
    setLoading(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPwdMsg("");
    
    if (newPassword !== confirmPassword) {
      setPwdMsg("New passwords do not match.");
      setLoading(false);
      return;
    }

    // Mock save delay
    await new Promise((r) => setTimeout(r, 600));
    
    setPwdMsg("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  };

  const inputClass = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#7E3AF2] focus:bg-white focus:ring-2 focus:ring-[#7E3AF2]/20 transition-all duration-200";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="section-max-width flex flex-1 gap-6 py-6">
        <Sidebar />

        <main className="flex-1 pb-10 pl-6 border-l border-gray-200 min-h-[calc(100vh-100px)]">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-[#333333] mb-2 tracking-tight">My Profile</h1>
            <p className="text-gray-500">
              Manage your personal information and adjust account settings.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Profile Info Section */}
            <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
              <h2 className="text-xl font-bold text-[#333333] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7E3AF2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Details
              </h2>
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {profileMsg && (
                  <div className={`px-4 py-3 text-sm font-medium rounded-xl border ${profileMsg.includes('success') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                    {profileMsg}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 focus-ring"
                >
                  Save Profile
                </button>
              </form>
            </section>

            {/* Password Section */}
            <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
              <h2 className="text-xl font-bold text-[#333333] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7E3AF2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </h2>
              <form onSubmit={handlePasswordUpdate} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {pwdMsg && (
                  <div className={`px-4 py-3 text-sm font-medium rounded-xl border ${pwdMsg.includes('success') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                    {pwdMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition-colors focus-ring"
                >
                  Update Password
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Profile;
