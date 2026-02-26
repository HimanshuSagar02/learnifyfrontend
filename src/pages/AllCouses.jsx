/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import Card from "../components/Card.jsx";
import { FaArrowLeftLong, FaFilter } from "react-icons/fa6";
import { FaSearch, FaGraduationCap, FaBook, FaFlask, FaAtom, FaDna, FaCalculator, FaStethoscope, FaChalkboardTeacher, FaAward, FaTimes } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import ai from '../assets/SearchAi.png'
import { useSelector } from 'react-redux';

function AllCourses() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const navigate = useNavigate()
  const [category, setCategory] = useState([])
  const [selectedClass, setSelectedClass] = useState("")
  const [filterCourses, setFilterCourses] = useState([])
  const { courseData } = useSelector(state => state.course)
  const { userData } = useSelector(state => state.user)

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory(prev => prev.filter(item => item !== e.target.value))
    } else {
      setCategory(prev => [...prev, e.target.value])
    }
  }

  const applyFilter = () => {
    let courseCopy = courseData.slice();

    // Filter by class (for students, show courses matching their class)
    if (userData?.role === "student" && userData?.class) {
      courseCopy = courseCopy.filter(item => item.class === userData.class)
    } else if (selectedClass) {
      courseCopy = courseCopy.filter(item => item.class === selectedClass)
    }

    if (category.length > 0) {
      courseCopy = courseCopy.filter(item => category.includes(item.category))
    }

    setFilterCourses(courseCopy)
  }

  useEffect(() => {
    setFilterCourses(courseData)
  }, [courseData])

  useEffect(() => {
    applyFilter()
  }, [category, selectedClass, userData])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-20">
      <Nav />
      
      {/* Mobile Filter Toggle Button */}
      <button
        onClick={() => setIsSidebarVisible(prev => !prev)}
        className="fixed top-24 left-4 z-50 bg-black text-[#3B82F6] px-4 py-2 rounded-xl md:hidden border-2 border-[#3B82F6] shadow-lg flex items-center gap-2 font-semibold"
      >
        <FaFilter /> {isSidebarVisible ? 'Hide' : 'Show'} Filters
      </button>

      {isSidebarVisible && (
        <button
          type="button"
          aria-label="Close filters"
          onClick={() => setIsSidebarVisible(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}

      {/* Professional Filter Sidebar */}
      <aside className={`w-[88vw] max-w-[320px] md:w-[320px] h-screen overflow-y-auto bg-gradient-to-b from-black via-gray-900 to-black fixed top-0 left-0 p-6 pt-32 border-r-2 border-[#3B82F6] shadow-2xl transition-transform duration-300 z-40 
        ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'} 
        md:block md:translate-x-0`}>
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3B82F6] rounded-lg flex items-center justify-center">
              <FaFilter className="text-black text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-[#3B82F6]">Filter Courses</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarVisible(false)}
              className="text-[#3B82F6] hover:text-[#2563EB] transition-colors md:hidden"
              aria-label="Close filter sidebar"
            >
              <FaTimes className="text-xl" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-[#3B82F6] hover:text-[#2563EB] transition-colors hidden md:inline-flex"
              aria-label="Back to home"
            >
              <FaArrowLeftLong className="text-xl" />
            </button>
          </div>
        </div>

        {/* Search with AI Button */}
        <button
          className='w-full px-4 py-3 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all shadow-lg flex items-center justify-center gap-2 mb-6'
          onClick={() => navigate("/searchwithai")}
        >
          <FaSearch className="text-xl" />
          Search with AI
          <img src={ai} className='w-6 h-6 rounded-full' alt="" />
        </button>

        {/* Class Filter */}
        {userData?.role !== "student" && (
          <div className="mb-6 bg-white bg-opacity-10 rounded-xl p-4 border border-[#3B82F6] border-opacity-30">
            <label className="font-bold text-[#3B82F6] mb-3 flex items-center gap-2">
              <FaGraduationCap /> Filter by Class
            </label>
            <select
              className="w-full border-2 border-[#3B82F6] rounded-xl px-4 py-3 bg-black text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="" className="bg-black">All Classes</option>
              <option value="9th" className="bg-black">9th Grade</option>
              <option value="10th" className="bg-black">10th Grade</option>
              <option value="11th" className="bg-black">11th Grade</option>
              <option value="12th" className="bg-black">12th Grade</option>
              <option value="NEET Dropper" className="bg-black">NEET Dropper</option>
            </select>
          </div>
        )}

        {/* Student Class Info */}
        {userData?.role === "student" && userData?.class && (
          <div className="mb-6 bg-[#3B82F6] border-2 border-[#3B82F6] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaGraduationCap className="text-black text-xl" />
              <p className="font-bold text-black">Your Class: {userData.class}</p>
            </div>
            <p className="text-black text-sm">Showing courses for your class</p>
          </div>
        )}

        {/* Category Filter */}
        <div className="bg-white bg-opacity-10 rounded-xl p-4 border border-[#3B82F6] border-opacity-30">
          <label className="font-bold text-[#3B82F6] mb-4 flex items-center gap-2">
            <FaBook /> Filter by Category
          </label>
          <div className="space-y-3">
            {[
              { value: 'Physics', icon: <FaAtom /> },
              { value: 'Chemistry', icon: <FaFlask /> },
              { value: 'Biology', icon: <FaDna /> },
              { value: 'Mathematics', icon: <FaCalculator /> },
              { value: 'NEET Preparation', icon: <FaStethoscope /> },
              { value: 'JEE Preparation', icon: <FaChalkboardTeacher /> },
              { value: 'Board Exam Preparation', icon: <FaAward /> },
              { value: 'Others', icon: <FaBook /> }
            ].map((cat) => (
              <label
                key={cat.value}
                className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all ${
                  category.includes(cat.value)
                    ? 'bg-[#3B82F6] bg-opacity-30 border-2 border-[#3B82F6]'
                    : 'bg-white bg-opacity-5 border-2 border-transparent hover:bg-opacity-10'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-[#3B82F6] cursor-pointer"
                  value={cat.value}
                  checked={category.includes(cat.value)}
                  onChange={toggleCategory}
                />
                <span
                  className={`flex items-center gap-2 font-semibold ${
                    category.includes(cat.value) ? "text-black" : "text-[#3B82F6]"
                  }`}
                >
                  {cat.icon}
                  {cat.value}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters Button */}
        {(category.length > 0 || selectedClass) && (
          <button
            onClick={() => {
              setCategory([]);
              setSelectedClass("");
            }}
            className="w-full mt-6 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            <FaTimes /> Clear All Filters
          </button>
        )}
      </aside>

      {/* Main Courses Section */}
      <main className="w-full transition-all duration-300 py-8 md:pl-[340px] flex items-start justify-center md:justify-start flex-wrap gap-6 px-4">
        {filterCourses?.length === 0 ? (
          <div className="w-full text-center py-20">
            <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No courses found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more courses</p>
          </div>
        ) : (
          filterCourses?.map((item, index) => (
            <Card
              key={index}
              thumbnail={item.thumbnail}
              title={item.title}
              price={item.price}
              category={item.category}
              id={item._id}
              reviews={item.reviews}
              class={item.class}
              subject={item.subject}
            />
          ))
        )}
      </main>
    </div>
  );
}

export default AllCourses;
