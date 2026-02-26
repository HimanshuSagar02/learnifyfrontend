import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-black text-gray-300 py-10 px-6">
      <div className="max-w-7xl mx-auto flex lg:items-center items-start justify-center gap-[40px] lg:gap-[150px] flex-col lg:flex-row">
        <div className="lg:w-[40%] md:w-[50%] w-[100%]">
          <img src={logo} alt="Logo" className="h-10 mb-3 border-1 rounded-[5px]" />
          <h2 className="text-xl font-bold text-[#3B82F6] mb-3">Learnify</h2>
          <p className="text-sm text-white">
            Learnify is an AI-powered technical learning platform for software development, data and engineering skills.
          </p>
        </div>

        <div className="lg:w-[30%] md:w-[100%]">
          <h3 className="text-white font-semibold mb-2">Quick Links</h3>
          <ul className="space-y-1 text-sm">
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors" onClick={() => navigate("/")}>Home</li>
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors" onClick={() => navigate("/allcourses")}>Courses</li>
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors" onClick={() => navigate("/login")}>Login</li>
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors" onClick={() => navigate("/profile")}>My Profile</li>
          </ul>
        </div>

        <div className="lg:w-[30%] md:w-[100%]">
          <h3 className="text-white font-semibold mb-2">Explore Categories</h3>
          <ul className="space-y-1 text-sm">
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Data Structures</li>
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Web Development</li>
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">AI/ML</li>
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Cloud & DevOps</li>
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Cybersecurity</li>
            <li className="hover:text-[#3B82F6] cursor-pointer transition-colors">Language Learning</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#3B82F6] border-opacity-30 mt-10 pt-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
          <div className="text-center md:text-left text-[#3B82F6]">
            © {new Date().getFullYear()} Learnify. All rights reserved.
          </div>
          <div className="text-center md:text-right text-gray-400 text-xs md:text-sm">
            <p className="text-[#3B82F6]">Made by <span className="font-semibold">Himanshu Sagar</span></p>
            <p className="mt-1">Contact: <a href="tel:6395034795" className="text-[#3B82F6] hover:underline">6395034795</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


