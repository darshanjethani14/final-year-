import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import AISection from "../components/AISection";
import Stats from "../components/Stats";
import Features from "../components/Features";
import SuccessStories from "../components/SuccessStories";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <main>
        <Hero />
        <AISection />
        <Stats />
        <Features />
        <SuccessStories />
      </main>
      <Footer />
    </div>
  );
}

export default Home;

