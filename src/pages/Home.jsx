import React from "react";
import home from "../assets/home1.jpg";
import Nav from "../components/Nav";
import { SiViaplay } from "react-icons/si";
import Logos from "../components/Logos";
import Cardspage from "../components/Cardspage";
import ExploreCourses from "../components/ExploreCourses";
import About from "../components/About";
import ai from "../assets/ai.png";
import ai1 from "../assets/SearchAi.png";
import ReviewPage from "../components/ReviewPage";
import Footer from "../components/Footer";
import LandingFeatures from "../components/LandingFeatures";
import DashboardMarketingPanel from "../components/DashboardMarketingPanel";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const classPills = [
  "DSA",
  "Web Development",
  "AI/ML",
  "Data Science",
  "Cloud & DevOps",
  "Cybersecurity",
  "Language Learning",
];

function Home() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);

  const stats = [
    { label: "Total Courses", value: 120 },
    { label: "Published Courses", value: 112 },
    { label: "Tech Domains Covered", value: 24 },
    { label: "Learner Reviews", value: 4800 },
  ];

  return (
    <div className="w-full overflow-hidden bg-white">
      <section className="w-full min-h-[82vh] relative">
        <Nav />
        <img src={home} className="object-cover w-full h-[82vh]" alt="Learnify learning" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

        <div className="absolute top-[17%] md:top-[22%] left-0 right-0 px-4 md:px-10 text-center">
          <h1 className="lg:text-[68px] md:text-[52px] sm:text-[34px] text-[26px] text-[#3B82F6] font-extrabold leading-tight drop-shadow-2xl">
            Build Real Tech Skills
          </h1>
          <h2 className="lg:text-[60px] md:text-[44px] sm:text-[28px] text-[22px] text-white font-bold drop-shadow-2xl">
            For Developers, Engineers and Career Switchers
          </h2>
          <p className="max-w-3xl mx-auto mt-4 text-white/90 text-sm md:text-base">
            Learn technical domains and language courses with project-based modules, mentor support and AI guidance.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <button
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 bg-[#3B82F6] text-black font-bold rounded-lg sm:rounded-xl text-sm sm:text-base flex gap-2 cursor-pointer items-center justify-center hover:bg-[#2563EB] transition-all shadow-lg"
              onClick={() => navigate("/allcourses")}
            >
              Explore Tech Courses <SiViaplay className="w-[20px] h-[20px] fill-black" />
            </button>
            <button
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 border-2 border-[#3B82F6] bg-black/40 text-[#3B82F6] font-bold rounded-lg sm:rounded-xl text-sm sm:text-base flex gap-2 cursor-pointer items-center justify-center hover:bg-[#3B82F6] hover:text-black transition-all shadow-lg backdrop-blur-sm"
              onClick={() => navigate("/searchwithai")}
            >
              Search with AI{" "}
              <img src={ai} className="w-[20px] h-[20px] rounded-full hidden lg:block" alt="AI icon" />
              <img src={ai1} className="w-[24px] h-[24px] rounded-full lg:hidden" alt="AI icon" />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {classPills.map((item) => (
              <span
                key={item}
                className="text-xs md:text-sm px-3 py-1 rounded-full border border-[#3B82F6]/70 text-[#3B82F6] bg-black/30"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Logos />

      <section className="w-full px-4 md:px-8 py-2">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((item) => (
            <div key={item.label} className="bg-[#111] text-white rounded-xl p-4 border border-[#3B82F6]/35">
              <p className="text-2xl md:text-3xl font-extrabold text-[#3B82F6]">{item.value}</p>
              <p className="text-xs md:text-sm text-gray-300 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <ExploreCourses />
      <Cardspage />
      <LandingFeatures userData={userData} />
      <section className="w-full px-4 md:px-8 py-6 md:py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <DashboardMarketingPanel userData={userData} />
        </div>
      </section>
      <About />
      <ReviewPage />
      <Footer />
    </div>
  );
}

export default Home;


