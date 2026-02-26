import React from "react";
import { SiViaplay } from "react-icons/si";
import { FaCode, FaLaptopCode, FaMobileAlt, FaDatabase, FaBrain, FaCloud, FaShieldAlt, FaTools } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const categories = [
  { label: "Programming Fundamentals", icon: <FaCode className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Web Development", icon: <FaLaptopCode className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Mobile Development", icon: <FaMobileAlt className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Data Structures", icon: <FaDatabase className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "AI/ML", icon: <FaBrain className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Cloud & DevOps", icon: <FaCloud className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Cybersecurity", icon: <FaShieldAlt className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Language Learning", icon: <FaTools className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
];

function ExploreCourses() {
  const navigate = useNavigate();

  return (
    <section className="w-full min-h-[50vh] flex flex-col lg:flex-row items-center justify-center gap-6 px-4 sm:px-5 md:px-6 py-6">
      <div className="w-full lg:w-[360px] max-w-xl flex flex-col items-start justify-center gap-3 md:px-4">
        <span className="text-2xl sm:text-3xl font-semibold leading-tight">Explore Courses by Domain</span>
        <p className="text-sm sm:text-base text-gray-700">
          Structured technical paths with concept clarity, hands-on projects and mentor-backed growth.
        </p>
        <button
          className="px-5 py-2.5 border-2 bg-black border-[#3B82F6] text-[#3B82F6] rounded-[10px] text-sm sm:text-base font-semibold flex gap-2 mt-3 hover:bg-[#3B82F6] hover:text-black transition-all"
          onClick={() => navigate("/allcourses")}
        >
          Explore Courses <SiViaplay className="w-[24px] h-[24px] fill-current" />
        </button>
      </div>

      <div className="w-full lg:w-[860px] max-w-full flex items-center justify-center gap-4 sm:gap-[18px] flex-wrap">
        {categories.map((item) => (
          <div
            key={item.label}
            className="w-[46%] sm:w-[150px] min-h-[138px] bg-gradient-to-b from-black to-gray-900 text-[#3B82F6] border border-[#3B82F6]/40 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-all"
          >
            <div className="w-[72px] h-[72px] bg-[#1f1f1f] rounded-lg flex items-center justify-center">{item.icon}</div>
            <span className="text-[13px] font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ExploreCourses;
