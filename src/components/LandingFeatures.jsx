import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBolt, FaChalkboardTeacher, FaChartLine, FaClock, FaArrowRight } from "react-icons/fa";
import { BiTestTube } from "react-icons/bi";
import { MdOutlineAutoGraph } from "react-icons/md";
import { TbMessageCircleQuestion } from "react-icons/tb";

const featureCards = [
  {
    title: "Fast Concept Clarity",
    desc: "Short concept videos and focused notes for quick revision.",
    icon: <FaBolt className="w-6 h-6" />,
  },
  {
    title: "Expert Mentor Support",
    desc: "Ask doubts and get guided strategies from educators.",
    icon: <FaChalkboardTeacher className="w-6 h-6" />,
  },
  {
    title: "Hybrid Class Delivery",
    desc: "Run online, offline or hybrid sessions with one integrated timetable.",
    icon: <FaClock className="w-6 h-6" />,
  },
  {
    title: "Performance Tracking",
    desc: "Monitor attendance, grades and assignment progress in one dashboard.",
    icon: <FaChartLine className="w-6 h-6" />,
  },
];

const journeySteps = [
  {
    title: "Choose Stream",
    detail: "Pick course by class, subject or exam target.",
    icon: <BiTestTube className="w-7 h-7" />,
  },
  {
    title: "Learn + Practice",
    detail: "Attend classroom or live sessions, solve assignments and revise with AI support.",
    icon: <MdOutlineAutoGraph className="w-7 h-7" />,
  },
  {
    title: "Track + Improve",
    detail: "Check dashboard insights and close weak topics fast.",
    icon: <TbMessageCircleQuestion className="w-7 h-7" />,
  },
];

function LandingFeatures({ userData }) {
  const navigate = useNavigate();
  const dashboardPath =
    userData?.role === "educator" || userData?.role === "admin" ? "/dashboard" : "/student-dashboard";

  return (
    <section className="w-full px-4 md:px-8 py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-black">Why Learners Pick Learnify</h2>
          <p className="text-gray-700 mt-3 max-w-3xl mx-auto">
            Built for competitive pace learning with clearer structure, better monitoring and stronger mentor feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((item) => (
            <div
              key={item.title}
              className="bg-gradient-to-b from-black to-gray-900 text-white rounded-2xl border border-[#3B82F6]/40 p-5 hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#3B82F6] text-black flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-gray-300">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#f7f7f7] border border-gray-200 rounded-2xl p-5 md:p-8">
          <h3 className="text-2xl md:text-3xl font-bold text-black text-center mb-6">Your Learning Journey</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {journeySteps.map((step, idx) => (
              <div key={step.title} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-lg bg-black text-[#3B82F6] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-500">Step {idx + 1}</span>
                </div>
                <h4 className="font-semibold text-black mb-1">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">Start Improving From Today</h3>
            <p className="text-gray-300 text-sm mt-1">
              Explore subject wise courses and move to a structured study system.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate("/allcourses")}
              className="px-5 py-2 rounded-lg bg-[#3B82F6] text-black font-semibold hover:bg-[#1D4ED8] transition-all"
            >
              Browse Courses
            </button>
            <button
              onClick={() => navigate(userData ? dashboardPath : "/signup")}
              className="px-5 py-2 rounded-lg border border-[#3B82F6] text-[#3B82F6] font-semibold hover:bg-[#3B82F6] hover:text-black transition-all flex items-center gap-2"
            >
              {userData ? "Open Dashboard" : "Create Account"} <FaArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingFeatures;
