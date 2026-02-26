/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import { 
  FaUser, 
  FaGraduationCap, 
  FaCalendarCheck, 
  FaChartLine, 
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaBook,
  FaDownload,
  FaReceipt,
  FaFilter
} from "react-icons/fa";
import { FaArrowLeftLong } from "react-icons/fa6";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const minutesToHours = (m = 0) => (m / 60).toFixed(1);
const GRADE_PIE_COLORS = ["#16a34a", "#22c55e", "#3b82f6", "#60a5fa", "#eab308", "#f59e0b", "#f97316", "#ef4444"];
const ATTENDANCE_PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];
const MAX_LABEL_LENGTH = 16;

function MyStudents() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("all"); // all, success, failure, pending
  const [downloadingReceipt, setDownloadingReceipt] = useState({});

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/user/mystudents`, { withCredentials: true });
      const studentsData = res.data || [];
      setStudents(studentsData);
      applyStatusFilter(studentsData, statusFilter);
    } catch {
      setStudents([]);
      setFilteredStudents([]);
    }
  };

  const applyStatusFilter = (studentsList, filter) => {
    if (filter === "all") {
      setFilteredStudents(studentsList);
    } else {
      setFilteredStudents(studentsList.filter(s => s.enrollmentStatus === filter));
    }
  };

  useEffect(() => {
    applyStatusFilter(students, statusFilter);
  }, [statusFilter, students]);

  const downloadReceipt = async (orderId, receiptId) => {
    setDownloadingReceipt(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await axios.get(
        `${serverUrl}/api/payment/receipt/generate/${orderId}`,
        {
          responseType: "blob",
          withCredentials: true
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt-${receiptId || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Download receipt error:", error);
      toast.error(error.response?.data?.message || "Failed to download receipt");
    } finally {
      setDownloadingReceipt(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      case "failure":
        return "bg-red-100 text-red-800 border-red-300";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <FaCheckCircle className="text-green-600" />;
      case "failure":
        return <FaTimes className="text-red-600" />;
      case "pending":
        return <FaClock className="text-blue-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const fetchStudentPerformance = async (studentId) => {
    setLoadingPerformance(true);
    try {
      const res = await axios.get(
        `${serverUrl}/api/user/student/${studentId}/performance`,
        { withCredentials: true }
      );
      setPerformanceData(res.data);
      setSelectedStudent(studentId);
      setActiveTab("overview");
    } catch {
      setPerformanceData(null);
      setSelectedStudent(null);
    } finally {
      setLoadingPerformance(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A+":
      case "A":
        return "bg-green-100 text-green-800";
      case "B+":
      case "B":
        return "bg-blue-100 text-blue-800";
      case "C+":
      case "C":
        return "bg-blue-100 text-blue-800";
      case "D":
        return "bg-orange-100 text-orange-800";
      case "F":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (selectedStudent && performanceData) {
    const { student, enrolledCourses, grades, gradeStats, attendance, attendanceStats, activity } = performanceData;
    const safeGradeDistribution = gradeStats?.gradeDistribution || {};
    const gradeDistributionData = Object.entries(safeGradeDistribution)
      .map(([grade, count]) => ({ grade, count: Number(count) || 0 }))
      .filter((entry) => entry.count > 0);

    const gradeTrendData = [...(grades || [])]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10)
      .map((grade, index) => ({
        index: index + 1,
        label: grade.assignmentName || grade.subject || "Assessment",
        percentage: Number(grade.percentage) || 0,
      }));

    const coursePerformanceChartData = Object.entries(gradeStats?.byCourse || {}).map(([courseId, data]) => {
      const title = data?.courseTitle || "Unknown";
      return {
        courseId,
        courseTitle: title,
        shortTitle: title.length > MAX_LABEL_LENGTH ? `${title.slice(0, MAX_LABEL_LENGTH)}...` : title,
        averagePercentage: Number(data?.averagePercentage) || 0,
        gradesCount: Array.isArray(data?.grades) ? data.grades.length : 0,
      };
    });

    const attendanceStatusData = [
      { name: "Present", value: Number(attendanceStats?.present) || 0 },
      { name: "Late", value: Number(attendanceStats?.late) || 0 },
      { name: "Absent", value: Number(attendanceStats?.absent) || 0 },
    ].filter((entry) => entry.value > 0);

    const attendanceByCourseChartData = Object.entries(attendanceStats?.byCourse || {}).map(([courseId, data]) => {
      const title = data?.courseTitle || "Unknown";
      const total = Number(data?.total) || 0;
      const present = Number(data?.present) || 0;
      const late = Number(data?.late) || 0;
      return {
        courseId,
        courseTitle: title,
        shortTitle: title.length > MAX_LABEL_LENGTH ? `${title.slice(0, MAX_LABEL_LENGTH)}...` : title,
        present,
        late,
        absent: Number(data?.absent) || 0,
        percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      };
    });

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => {
              setSelectedStudent(null);
              setPerformanceData(null);
            }}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeftLong className="w-5 h-5" />
            <span>Back to Students List</span>
          </button>

          {/* Student Header */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-black">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-600">
                    {student.name?.charAt(0)?.toUpperCase() || "S"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
                <p className="text-gray-600">{student.email}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>Active Time: {minutesToHours(activity.totalActiveMinutes)} hrs</span>
                  {activity.lastActiveAt && (
                    <span>Last Active: {new Date(activity.lastActiveAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaGraduationCap className="text-blue-600" />
                <p className="text-sm text-gray-600">Average Grade</p>
              </div>
              <p className="text-2xl font-bold">
                {gradeStats.averagePercentage > 0 ? `${gradeStats.averagePercentage}%` : "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-1">{gradeStats.totalGrades} grades recorded</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaCalendarCheck className="text-green-600" />
                <p className="text-sm text-gray-600">Attendance</p>
              </div>
              <p className="text-2xl font-bold">
                {attendanceStats.attendancePercentage > 0 ? `${attendanceStats.attendancePercentage}%` : "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {attendanceStats.present + attendanceStats.late} / {attendanceStats.totalRecords} present
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaBook className="text-purple-600" />
                <p className="text-sm text-gray-600">Enrolled Courses</p>
              </div>
              <p className="text-2xl font-bold">{enrolledCourses.length}</p>
              <p className="text-xs text-gray-500 mt-1">Active courses</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaClock className="text-orange-600" />
                <p className="text-sm text-gray-600">Activity</p>
              </div>
              <p className="text-2xl font-bold">{minutesToHours(activity.totalActiveMinutes)}</p>
              <p className="text-xs text-gray-500 mt-1">Total hours</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === "overview" ? "bg-black text-white" : "bg-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("grades")}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === "grades" ? "bg-black text-white" : "bg-white"
                }`}
              >
                <FaGraduationCap className="inline mr-2" /> Grades
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === "attendance" ? "bg-black text-white" : "bg-white"
                }`}
              >
                <FaCalendarCheck className="inline mr-2" /> Attendance
              </button>
              <button
                onClick={() => setActiveTab("courses")}
                className={`px-4 py-2 rounded-lg border ${
                  activeTab === "courses" ? "bg-black text-white" : "bg-white"
                }`}
              >
                <FaBook className="inline mr-2" /> Courses
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">Performance Overview</h2>

                {(gradeDistributionData.length > 0 ||
                  gradeTrendData.length > 0 ||
                  coursePerformanceChartData.length > 0 ||
                  attendanceStatusData.length > 0 ||
                  attendanceByCourseChartData.length > 0) && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {gradeDistributionData.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Grades Breakdown</h3>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={gradeDistributionData} dataKey="count" nameKey="grade" outerRadius={96}>
                                {gradeDistributionData.map((entry, index) => (
                                  <Cell key={`grade-${entry.grade}`} fill={GRADE_PIE_COLORS[index % GRADE_PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {gradeTrendData.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Recent Grade Trend</h3>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={gradeTrendData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="index" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip formatter={(value) => [`${value}%`, "Score"]} labelFormatter={(value) => `Assessment #${value}`} />
                              <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {coursePerformanceChartData.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Course-wise Average Score</h3>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={coursePerformanceChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="shortTitle" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip formatter={(value) => [`${value}%`, "Average"]} />
                              <Bar dataKey="averagePercentage" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {attendanceStatusData.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Attendance Status Split</h3>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={attendanceStatusData} dataKey="value" nameKey="name" outerRadius={96}>
                                {attendanceStatusData.map((entry, index) => (
                                  <Cell key={`attendance-${entry.name}`} fill={ATTENDANCE_PIE_COLORS[index % ATTENDANCE_PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value}`, "Records"]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {attendanceByCourseChartData.length > 0 && (
                      <div className="border rounded-lg p-4 xl:col-span-2">
                        <h3 className="font-semibold mb-3">Course-wise Attendance %</h3>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceByCourseChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="shortTitle" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                              <Bar dataKey="percentage" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Grade Distribution */}
                <div>
                  <h3 className="font-semibold mb-3">Grade Distribution</h3>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {Object.entries(gradeStats.gradeDistribution).map(([grade, count]) => (
                      <div key={grade} className="text-center">
                        <div className={`p-2 rounded ${getGradeColor(grade)}`}>
                          <p className="font-bold">{grade}</p>
                          <p className="text-xs">{count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course Performance */}
                {Object.keys(gradeStats.byCourse).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Course-wise Performance</h3>
                    <div className="space-y-2">
                      {Object.entries(gradeStats.byCourse).map(([courseId, data]) => (
                        <div key={courseId} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{data.courseTitle}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">
                                Avg: {data.averagePercentage}%
                              </span>
                              <span className="text-sm text-gray-600">
                                {data.grades.length} grades
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attendance Summary */}
                {Object.keys(attendanceStats.byCourse).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Course-wise Attendance</h3>
                    <div className="space-y-2">
                      {Object.entries(attendanceStats.byCourse).map(([courseId, data]) => {
                        const percentage = data.total > 0 
                          ? Math.round(((data.present + data.late) / data.total) * 100)
                          : 0;
                        return (
                          <div key={courseId} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{data.courseTitle}</span>
                              <span className="text-sm font-semibold">{percentage}%</span>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-600">
                              <span>Present: {data.present}</span>
                              <span>Absent: {data.absent}</span>
                              <span>Late: {data.late}</span>
                              <span>Total: {data.total}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "grades" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">All Grades</h2>
                {grades.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No grades recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Course</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Subject</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Assignment</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Marks</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Percentage</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Grade</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {grades.map((grade) => (
                          <tr key={grade._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">{grade.courseId?.title || "N/A"}</td>
                            <td className="px-4 py-2 text-sm font-medium">{grade.subject}</td>
                            <td className="px-4 py-2 text-sm">{grade.assignmentName || "-"}</td>
                            <td className="px-4 py-2 text-sm">
                              {grade.marksObtained} / {grade.totalMarks}
                            </td>
                            <td className="px-4 py-2 text-sm font-semibold">{grade.percentage}%</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold ${getGradeColor(
                                  grade.grade
                                )}`}
                              >
                                {grade.grade}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {new Date(grade.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "attendance" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Attendance Records</h2>
                {attendance.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No attendance records yet.</p>
                ) : (
                  <div className="space-y-3">
                    {attendance.map((record) => {
                      const studentRecord = record.records.find(
                        (r) => r.studentId.toString() === student._id
                      );
                      const status = studentRecord?.status || "absent";
                      return (
                        <div
                          key={record._id}
                          className="border rounded-lg p-4 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{record.courseId?.title || "Unknown Course"}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {status === "present" && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1">
                                <FaCheckCircle /> Present
                              </span>
                            )}
                            {status === "absent" && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold flex items-center gap-1">
                                <FaTimes /> Absent
                              </span>
                            )}
                            {status === "late" && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold flex items-center gap-1">
                                <FaClock /> Late
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "courses" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Enrolled Courses</h2>
                {enrolledCourses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No enrolled courses.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrolledCourses.map((course) => {
                      const courseGrades = gradeStats.byCourse[course._id] || { averagePercentage: 0, grades: [] };
                      const courseAttendance = attendanceStats.byCourse[course._id] || {
                        present: 0,
                        absent: 0,
                        late: 0,
                        total: 0
                      };
                      const attendancePercentage = courseAttendance.total > 0
                        ? Math.round(((courseAttendance.present + courseAttendance.late) / courseAttendance.total) * 100)
                        : 0;

                      return (
                        <div key={course._id} className="border rounded-lg p-4">
                          {course.thumbnail && (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          <h3 className="font-semibold mb-2">{course.title}</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Average Grade:</span>
                              <span className="font-semibold">
                                {courseGrades.averagePercentage > 0
                                  ? `${courseGrades.averagePercentage}%`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Attendance:</span>
                              <span className="font-semibold">
                                {attendancePercentage > 0 ? `${attendancePercentage}%` : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Grades Count:</span>
                              <span>{courseGrades.grades.length}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">My Students</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm text-black"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failure">Failure</option>
              </select>
            </div>
            <p className="text-sm text-gray-600">
              {filteredStudents.length}/{students.length} students
            </p>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No students enrolled yet.</p>
            <p className="text-gray-400 text-sm mt-2">
              Students will appear here once they enroll in your courses.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <FaFilter className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No students found for this status.</p>
            <p className="text-gray-400 text-sm mt-2">Try a different filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s) => (
              <div
                key={s._id}
                className="border rounded-xl p-4 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => fetchStudentPerformance(s._id)}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt={s.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-600">
                        {s.name?.charAt(0)?.toUpperCase() || "S"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <p className="text-sm text-gray-600">{s.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Enrollment:</span>
                    <span className={`px-2 py-1 rounded-full border text-xs font-semibold inline-flex items-center gap-1 ${getStatusColor(s.enrollmentStatus)}`}>
                      {getStatusIcon(s.enrollmentStatus)}
                      {(s.enrollmentStatus || "pending").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Time:</span>
                    <span className="font-medium">{minutesToHours(s.totalActiveMinutes)} hrs</span>
                  </div>
                  {s.lastActiveAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Active:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(s.lastActiveAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchStudentPerformance(s._id);
                    }}
                    className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
                    disabled={loadingPerformance}
                  >
                    <FaChartLine /> View
                  </button>
                  {s.lastOrder?.orderId && s.lastOrder?.receiptId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadReceipt(s.lastOrder.orderId, s.lastOrder.receiptId);
                      }}
                      className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 border border-gray-300 flex items-center justify-center gap-2 disabled:opacity-60"
                      disabled={!!downloadingReceipt[s.lastOrder.orderId]}
                    >
                      {downloadingReceipt[s.lastOrder.orderId] ? (
                        <>
                          <FaDownload /> Downloading
                        </>
                      ) : (
                        <>
                          <FaReceipt /> Receipt
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyStudents;
