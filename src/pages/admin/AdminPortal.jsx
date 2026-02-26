/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../../App";
import MarketingManager from "../../components/admin/MarketingManager";
import { 
  FaUsers, 
  FaBook, 
  FaClipboardList, 
  FaCalendarCheck, 
  FaBell, 
  FaVideo,
  FaGraduationCap,
  FaExclamationTriangle,
  FaChartLine,
  FaCog,
  FaDatabase,
  FaServer,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFilter,
  FaBullhorn
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";

function AdminPortal() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [portalStats, setPortalStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [problems, setProblems] = useState([]);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7d"); // 7d, 30d, all

  // Fetch portal statistics
  const fetchPortalStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/admin/portal/stats`, {
        withCredentials: true
      });
      setPortalStats(res.data);
    } catch {
      setPortalStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities by section
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {
        section: sectionFilter !== "all" ? sectionFilter : undefined,
        days: dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : undefined
      };
      const res = await axios.get(`${serverUrl}/api/admin/portal/activities`, {
        params,
        withCredentials: true
      });
      setActivities(res.data || []);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch problems/issues
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/admin/portal/problems`, {
        withCredentials: true
      });
      setProblems(res.data || []);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") {
      fetchPortalStats();
    } else if (activeTab === "activities") {
      fetchActivities();
    } else if (activeTab === "problems") {
      fetchProblems();
    }
  }, [activeTab, sectionFilter, dateFilter]);

  const sections = [
    { value: "all", label: "All Sections" },
    { value: "authentication", label: "Authentication" },
    { value: "courses", label: "Courses" },
    { value: "assignments", label: "Assignments" },
    { value: "live-classes", label: "Live Classes" },
    { value: "attendance", label: "Attendance" },
    { value: "notifications", label: "Notifications" },
    { value: "grades", label: "Grades" },
    { value: "feedback", label: "Feedback" },
    { value: "payments", label: "Payments" }
  ];

  const getSectionIcon = (section) => {
    const icons = {
      authentication: FaUsers,
      courses: FaBook,
      assignments: FaClipboardList,
      "live-classes": FaVideo,
      attendance: FaCalendarCheck,
      notifications: FaBell,
      grades: FaClipboardList,
      feedback: FaBell,
      payments: FaCog
    };
    return icons[section] || FaCog;
  };

  const getProblemSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium": return "bg-blue-100 text-blue-800 border-blue-300";
      case "low": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const COLORS = ['#3B82F6', '#FFA500', '#FF6347', '#32CD32', '#1E90FF', '#9370DB'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-6 mb-6 border-2 border-[#3B82F6]">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3B82F6] mb-2 flex items-center gap-3">
            <FaCog className="text-4xl" />
            Admin Portal Management
          </h1>
          <p className="text-white text-sm md:text-base">Complete portal overview, activity monitoring, and problem tracking</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-3 md:p-4 border-2 border-gray-100">
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "overview" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaChartLine /> Overview
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "activities" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaClock /> Activities
            </button>
            <button
              onClick={() => setActiveTab("problems")}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "problems" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaExclamationTriangle /> Problems
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "database" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaDatabase /> Database
            </button>
            <button
              onClick={() => setActiveTab("server")}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "server" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaServer /> Server
            </button>
            <button
              onClick={() => setActiveTab("marketing")}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base ${
                activeTab === "marketing"
                  ? "bg-black text-[#3B82F6] shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaBullhorn /> Marketing
            </button>
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {/* Overview Tab */}
        {!loading && activeTab === "overview" && portalStats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{portalStats.totalUsers || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Students: {portalStats.students || 0} • Educators: {portalStats.educators || 0}
                    </p>
                  </div>
                  <FaUsers className="text-4xl md:text-5xl text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Courses</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{portalStats.totalCourses || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Published: {portalStats.publishedCourses || 0} • Draft: {portalStats.draftCourses || 0}
                    </p>
                  </div>
                  <FaBook className="text-4xl md:text-5xl text-green-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Enrollments</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{portalStats.totalEnrollments || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Active: {portalStats.activeEnrollments || 0}
                    </p>
                  </div>
                  <FaGraduationCap className="text-4xl md:text-5xl text-purple-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Problems</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{portalStats.activeProblems || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Critical: {portalStats.criticalProblems || 0}
                    </p>
                  </div>
                  <FaExclamationTriangle className="text-4xl md:text-5xl text-red-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">User Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={portalStats.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Section Activity Distribution */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Activity by Section</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portalStats.sectionActivity || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(portalStats.sectionActivity || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold">{portalStats.todayActivity || 0}</p>
                  <p className="text-xs text-gray-500">activities</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">{portalStats.weekActivity || 0}</p>
                  <p className="text-xs text-gray-500">activities</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">{portalStats.monthActivity || 0}</p>
                  <p className="text-xs text-gray-500">activities</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {!loading && activeTab === "activities" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-600" />
                  <span className="font-semibold">Filters:</span>
                </div>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-black"
                >
                  {sections.map(section => (
                    <option key={section.value} value={section.value}>{section.label}</option>
                  ))}
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-black"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            {/* Activities List */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No activities found</p>
                ) : (
                  activities.map((activity, index) => {
                    const Icon = getSectionIcon(activity.section);
                    return (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${activity.type === 'error' ? 'bg-red-100' : activity.type === 'warning' ? 'bg-blue-100' : 'bg-blue-100'}`}>
                            <Icon className={`text-xl ${activity.type === 'error' ? 'text-red-600' : activity.type === 'warning' ? 'text-blue-600' : 'text-blue-600'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-800">{activity.action || 'Activity'}</h4>
                              <span className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{activity.description || 'No description'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">{activity.section}</span>
                              {activity.user && (
                                <span className="text-xs text-gray-500">by {activity.user}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Problems Tab */}
        {!loading && activeTab === "problems" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Portal Problems & Issues</h3>
              <div className="space-y-4">
                {problems.length === 0 ? (
                  <div className="text-center py-12">
                    <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No problems detected. Portal is running smoothly!</p>
                  </div>
                ) : (
                  problems.map((problem, index) => (
                    <div key={index} className={`border-2 rounded-xl p-4 md:p-6 ${getProblemSeverityColor(problem.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FaExclamationTriangle className="text-2xl" />
                            <h4 className="text-lg font-bold">{problem.title}</h4>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase">
                              {problem.severity}
                            </span>
                          </div>
                          <p className="text-sm mb-3">{problem.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-white bg-opacity-50 rounded">Section: {problem.section}</span>
                            <span className="px-2 py-1 bg-white bg-opacity-50 rounded">
                              Detected: {new Date(problem.detectedAt).toLocaleString()}
                            </span>
                            {problem.affectedUsers && (
                              <span className="px-2 py-1 bg-white bg-opacity-50 rounded">
                                Affected: {problem.affectedUsers} users
                              </span>
                            )}
                          </div>
                          {problem.solution && (
                            <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-lg">
                              <p className="text-xs font-semibold mb-1">Suggested Solution:</p>
                              <p className="text-xs">{problem.solution}</p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {problem.status === 'resolved' ? (
                            <FaCheckCircle className="text-2xl text-green-600" />
                          ) : (
                            <FaTimesCircle className="text-2xl text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Database Tab */}
        {!loading && activeTab === "database" && portalStats && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Database Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Connection Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    {portalStats.dbConnected ? (
                      <>
                        <FaCheckCircle className="text-green-500" />
                        <span className="font-semibold text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="text-red-500" />
                        <span className="font-semibold text-red-600">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Database Size</p>
                  <p className="text-xl font-bold mt-2">{portalStats.dbSize || 'N/A'}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Collections</p>
                  <p className="text-xl font-bold mt-2">{portalStats.collections || 0}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Documents</p>
                  <p className="text-xl font-bold mt-2">{portalStats.totalDocuments || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Server Tab */}
        {!loading && activeTab === "server" && portalStats && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Server Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Server Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FaCheckCircle className="text-green-500" />
                    <span className="font-semibold text-green-600">Running</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-xl font-bold mt-2">{portalStats.uptime || 'N/A'}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Memory Usage</p>
                  <p className="text-xl font-bold mt-2">{portalStats.memoryUsage || 'N/A'}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">CPU Usage</p>
                  <p className="text-xl font-bold mt-2">{portalStats.cpuUsage || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === "marketing" && <MarketingManager />}
      </div>
    </div>
  );
}

export default AdminPortal;

