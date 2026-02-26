import React from "react";
import { SiViaplay } from "react-icons/si";
import { FaAtom, FaFlask, FaDna, FaCalculator, FaChalkboardTeacher, FaBrain } from "react-icons/fa";
import { GiTargetArrows, GiNotebook } from "react-icons/gi";
import { useNavigate } from "react-router-dom";

const categories = [
  { label: "Physics", icon: <FaAtom className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Chemistry", icon: <FaFlask className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Biology", icon: <FaDna className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Mathematics", icon: <FaCalculator className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "NEET Strategy", icon: <GiTargetArrows className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "JEE Strategy", icon: <FaBrain className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Board Revision", icon: <GiNotebook className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
  { label: "Mentor Sessions", icon: <FaChalkboardTeacher className="w-[44px] h-[44px] text-[#1D4ED8]" /> },
];

function ExploreCourses() {
  const navigate = useNavigate();

  return (
    <section className="w-full min-h-[50vh] flex flex-col lg:flex-row items-center justify-center gap-6 px-4 sm:px-5 md:px-6 py-6">
      <div className="w-full lg:w-[360px] max-w-xl flex flex-col items-start justify-center gap-3 md:px-4">
        <span className="text-2xl sm:text-3xl font-semibold leading-tight">Explore Our Tracks</span>
        <p className="text-sm sm:text-base text-gray-700">
          Structured paths for 9th to 12th and competitive prep with concept videos, tests and revision support.
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
