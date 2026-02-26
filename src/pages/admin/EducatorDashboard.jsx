import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../../App";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { 
  FaBook, 
  FaClipboardList, 
  FaUsers, 
  FaCalendarCheck, 
  FaBell, 
  FaVideo, 
  FaGraduationCap,
  FaQuestionCircle,
  FaTachometerAlt,
  FaCog
} from "react-icons/fa";
import { FaArrowLeftLong } from "react-icons/fa6";

function EducatorDashboard() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const { creatorCourseData } = useSelector((state) => state.course);

  const [activeTab, setActiveTab] = useState("overview");
  const [pendingDoubtsCount, setPendingDoubtsCount] = useState(0);

  // Sample data for charts with safety checks
  const courseProgressData = (creatorCourseData || []).map(course => ({
    name: (course.title || "Course").slice(0, 10) + "...",
    lectures: (course.lectures || []).length
  }));

  const enrollData = (creatorCourseData || []).map(course => ({
    name: (course.title || "Course").slice(0, 10) + "...",
    enrolled: (course.enrolledStudents || []).length
  }));

  const totalEarnings = (creatorCourseData || []).reduce((sum, course) => {
    const studentCount = (course.enrolledStudents || []).length;
    const courseRevenue = course.price ? course.price * studentCount : 0;
    return sum + courseRevenue;
  }, 0);

  // Fetch pending doubts count
  useEffect(() => {
    if (!userData || (userData.role !== "educator" && userData.role !== "admin")) {
      setPendingDoubtsCount(0);
      return;
    }

    const fetchPendingDoubts = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/doubts/assigned?status=pending`, {
          withCredentials: true,
        });
        setPendingDoubtsCount(res.data?.length || 0);
      } catch {
        setPendingDoubtsCount(0);
      }
    };
    fetchPendingDoubts();
  }, [userData]);

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading user data...</p>
      </div>
    );
  }

  if (userData.role !== "educator" && userData.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-2">Access denied.</p>
          <p className="text-gray-500">Educator access required. Current role: {userData.role}</p>
          <button 
            onClick={() => navigate("/student-dashboard")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-24 pb-8 px-4 md:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className='fixed top-[100px] left-[10px] md:left-[20px] z-10 bg-black text-[#3B82F6] p-2 md:p-3 rounded-full shadow-lg hover:bg-gray-900 transition-all border-2 border-[#3B82F6]'
          aria-label="Go back"
        >
          <FaArrowLeftLong className='w-[18px] h-[18px] md:w-[22px] md:h-[22px]' />
        </button>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mb-6 md:mb-8 border-2 border-[#3B82F6] relative overflow-hidden">
          {/* Decorative Elements */}
          <div className='absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-[#3B82F6] opacity-10 rounded-full blur-3xl'></div>
          <div className='absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-[#3B82F6] opacity-10 rounded-full blur-3xl'></div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#3B82F6] flex items-center justify-center border-4 border-white shadow-2xl">
              {userData?.photoUrl ? (
                <img
                  src={userData.photoUrl}
                  alt="Educator"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold text-[#3B82F6]" style={{ display: userData?.photoUrl ? 'none' : 'flex' }}>
                {userData?.name?.charAt(0)?.toUpperCase() || "E"}
              </div>
            </div>
            <div className="text-center md:text-left space-y-3 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3B82F6] mb-2">
                Welcome, {userData?.name || "Educator"} 👋
              </h1>
              <h2 className='text-lg sm:text-xl md:text-2xl font-semibold text-white'>
                Total Earnings: <span className='font-bold text-[#3B82F6]'>₹{totalEarnings.toLocaleString()}</span>
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                {userData?.description || "Start creating amazing courses for your students!"}
              </p>
            </div>
            <button 
              className='w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all shadow-lg flex items-center justify-center gap-2 text-sm md:text-base' 
              onClick={() => navigate("/courses")}
            >
              Create Courses
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-3 md:p-4 border-2 border-gray-100">
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "overview" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaTachometerAlt 
                className={`w-4 h-4 md:w-5 md:h-5 transition-all ${activeTab === "overview" ? "text-[#3B82F6]" : "text-[#93C5FD]"}`} 
                style={{ 
                  filter: activeTab !== "overview" ? "drop-shadow(0 2px 4px rgba(255, 235, 59, 0.4))" : "drop-shadow(0 2px 4px rgba(255, 215, 0, 0.6))",
                  opacity: activeTab === "overview" ? 1 : 0.85
                }} 
              />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "courses" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaBook className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Courses</span>
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "assignments" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaClipboardList className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Assignments</span>
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "students" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaUsers className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">My Students</span>
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "attendance" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaCalendarCheck className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "notifications" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaBell className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab("liveclasses")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "liveclasses" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaVideo className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Live Classes</span>
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "grades" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaGraduationCap className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Grades</span>
            </button>
            <button
              onClick={() => setActiveTab("doubts")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "doubts" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaQuestionCircle className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Doubts</span>
            </button>
            {userData?.role === "admin" && (
              <button
                onClick={() => navigate("/admin/portal")}
                className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base bg-red-600 text-white hover:bg-red-700`}
              >
                <FaCog className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Portal Management</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-6">
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-[#3B82F6] hover:shadow-2xl transition-all hover:scale-105 hover:border-[#2563EB] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6] opacity-10 rounded-full -mr-12 -mt-12 group-hover:opacity-20 transition-opacity"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FaBook className="text-white text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">My Courses</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">Total Programs</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-4xl font-black text-black mb-1 tracking-tight">{(creatorCourseData || []).length}</p>
                    <p className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mt-2">Active Courses</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-black hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-700 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-black opacity-5 rounded-full -mr-12 -mt-12 group-hover:opacity-10 transition-opacity"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-black to-gray-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FaUsers className="text-white text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">Students</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">Total Enrolled</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-4xl font-black text-black mb-1 tracking-tight">
                      {(creatorCourseData || []).reduce((sum, course) => 
                        sum + ((course.enrolledStudents || []).length), 0)}
                    </p>
                    <p className="text-xs font-bold text-black uppercase tracking-wider mt-2">Active Learners</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-[#3B82F6] hover:shadow-2xl transition-all hover:scale-105 hover:border-[#2563EB] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6] opacity-10 rounded-full -mr-12 -mt-12 group-hover:opacity-20 transition-opacity"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-white text-2xl font-bold">₹</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">Revenue</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">Total Earnings</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-4xl font-black text-black mb-1 tracking-tight">₹{totalEarnings.toLocaleString()}</p>
                    <p className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mt-2">Total Income</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-black hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-700 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-black opacity-5 rounded-full -mr-12 -mt-12 group-hover:opacity-10 transition-opacity"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-black to-gray-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FaBook className="text-white text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">Lectures</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">Total Content</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-4xl font-black text-black mb-1 tracking-tight">
                      {(creatorCourseData || []).reduce((sum, course) => 
                        sum + ((course.lectures || []).length), 0)}
                    </p>
                    <p className="text-xs font-bold text-black uppercase tracking-wider mt-2">Video Lessons</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-[#3B82F6] hover:shadow-2xl transition-all hover:scale-105 hover:border-[#2563EB] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6] opacity-10 rounded-full -mr-12 -mt-12 group-hover:opacity-20 transition-opacity"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FaQuestionCircle className="text-white text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">Doubts</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">Pending Questions</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-4xl font-black text-black mb-1 tracking-tight">{pendingDoubtsCount}</p>
                    {pendingDoubtsCount > 0 ? (
                      <>
                        <p className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mt-2">Awaiting Response</p>
                        <button
                          onClick={() => {
                            setActiveTab("doubts");
                            navigate("/doubts");
                          }}
                          className="mt-3 text-xs bg-black text-[#3B82F6] px-4 py-2 rounded-lg hover:bg-gray-900 font-bold transition-all shadow-md"
                        >
                          View Doubts →
                        </button>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mt-2">All Resolved</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              {courseProgressData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold mb-4">Course Progress (Lectures)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={courseProgressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="lectures" fill="#3B82F6" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold mb-4">Student Enrollment</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={enrollData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="enrolled" fill="#3B82F6" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {courseProgressData.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No courses yet. Create your first course to see statistics!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "courses" && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBook className="text-5xl text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Course Management</h3>
              <p className="text-gray-600 mb-6">Manage your courses, create new ones, and edit existing courses</p>
              <button
                onClick={() => navigate("/courses")}
                className="bg-black text-[#3B82F6] font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <FaBook /> Go to Courses
              </button>
            </div>
          )}
          {activeTab === "assignments" && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClipboardList className="text-5xl text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Assignments</h3>
              <p className="text-gray-600 mb-6">Create and manage assignments for your students</p>
              <button
                onClick={() => navigate("/assignments")}
                className="bg-black text-[#3B82F6] font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <FaClipboardList /> Go to Assignments
              </button>
            </div>
          )}
          {activeTab === "students" && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-5xl text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">My Students</h3>
              <p className="text-gray-600 mb-6">View and manage all students enrolled in your courses</p>
              <button
                onClick={() => navigate("/my-students")}
                className="bg-black text-[#3B82F6] font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <FaUsers /> Go to My Students
              </button>
            </div>
          )}
          {activeTab === "attendance" && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCalendarCheck className="text-5xl text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Attendance</h3>
              <p className="text-gray-600 mb-6">Track and manage student attendance</p>
              <button
                onClick={() => navigate("/attendance")}
                className="bg-black text-[#3B82F6] font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <FaCalendarCheck /> Go to Attendance
              </button>
            </div>
          )}
          {activeTab === "notifications" && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBell className="text-5xl text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h3>
              <p className="text-gray-600 mb-6">Create and manage notifications and events for students</p>
              <button
                onClick={() => navigate("/notifications")}
                className="bg-black text-[#3B82F6] font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <FaBell /> Go to Notifications
              </button>
            </div>
          )}
          {activeTab === "liveclasses" && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaVideo className="text-5xl text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Live Classes</h3>
              <p className="text-gray-600 mb-6">Schedule and manage live classes for your students</p>
              <button
                onClick={() => navigate("/liveclasses")}
                className="bg-black text-[#3B82F6] font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <FaVideo /> Go to Live Classes
              </button>
            </div>
          )}
          {activeTab === "grades" && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGraduationCap className="text-5xl text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Grades & Marks</h3>
              <p className="text-gray-600 mb-6">Upload and manage student grades and marks</p>
              <button
                onClick={() => navigate("/grades")}
                className="bg-black text-[#3B82F6] font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <FaGraduationCap /> Go to Grades
              </button>
            </div>
          )}
          {activeTab === "doubts" && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-[#3B82F6] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaQuestionCircle className="text-5xl text-[#3B82F6]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Doubts & Questions</h3>
              <p className="text-gray-600 mb-6">View and respond to student doubts and questions</p>
              <button
                onClick={() => navigate("/doubts")}
                className="bg-black text-[#3B82F6] font-bold px-8 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2 mx-auto"
              >
                <FaQuestionCircle /> Go to Doubts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EducatorDashboard;
