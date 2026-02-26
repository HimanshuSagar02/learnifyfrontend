import React from "react";
import { MdCastForEducation } from "react-icons/md";
import { SiOpenaccess } from "react-icons/si";
import { FaSackDollar } from "react-icons/fa6";
import { BiSupport } from "react-icons/bi";
import { FaUsers } from "react-icons/fa";

const highlights = [
  { icon: <MdCastForEducation className="w-[32px] h-[32px] fill-[#03394b]" />, text: "Exam Focused Courses" },
  { icon: <SiOpenaccess className="w-[28px] h-[28px] fill-[#03394b]" />, text: "Lifetime Access" },
  { icon: <FaSackDollar className="w-[28px] h-[28px] fill-[#03394b]" />, text: "Value For Money" },
  { icon: <BiSupport className="w-[32px] h-[32px] fill-[#03394b]" />, text: "Mentor Support" },
  { icon: <FaUsers className="w-[30px] h-[30px] fill-[#03394b]" />, text: "Learner Community" },
];

function Logos() {
  return (
    <section className="w-full min-h-[90px] flex items-center justify-center flex-wrap gap-3 md:mb-[35px] px-4">
      {highlights.map((item) => (
        <div
          key={item.text}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 transition-all"
        >
          {item.icon}
          <span className="text-[#03394b] font-medium text-sm md:text-base">{item.text}</span>
        </div>
      ))}
    </section>
  );
}

export default Logos;
