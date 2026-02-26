import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import LiveVideoPlayer from "../components/LiveVideoPlayer";
import LiveKitPlayer from "../components/LiveKitPlayer";
import { FaBook, FaClipboardList, FaBell, FaGraduationCap, FaEnvelope, FaClock, FaCalendarCheck, FaVideo, FaPlay, FaMoneyBillWave, FaPrint } from "react-icons/fa";
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

const hasVenueDetails = (details) =>
  Boolean(details?.centerName || details?.classroom || details?.address);
const GRADE_ORDER = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];
const GRADE_COLORS = {
  "A+": "#15803d",
  A: "#22c55e",
  "B+": "#2563eb",
  B: "#3b82f6",
  "C+": "#d97706",
  C: "#f59e0b",
  D: "#ea580c",
  F: "#dc2626",
};
const ATTENDANCE_COLORS = {
  Present: "#22c55e",
  Late: "#f59e0b",
  Absent: "#ef4444",
};
const SHORT_TITLE_LIMIT = 18;

function StudentDashboard() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const { courseData } = useSelector((state) => state.course);

  const [activeTab, setActiveTab] = useState("mycourses");

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [submitForm, setSubmitForm] = useState({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Shared course notes
  const [sharedNotes, setSharedNotes] = useState([]);
  const [sharedNoteForm, setSharedNoteForm] = useState({ title: "", content: "", courseId: "" });
  const [sharedFile, setSharedFile] = useState(null);

  // Attendance
  const [attendance, setAttendance] = useState([]);

  // Live Classes
  const [liveClasses, setLiveClasses] = useState([]);
  const [loadingLiveClasses, setLoadingLiveClasses] = useState(false);

  // Grades
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Fees
  const [feeRecords, setFeeRecords] = useState([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feePaymentForms, setFeePaymentForms] = useState({});
  const [processingFeePaymentId, setProcessingFeePaymentId] = useState("");

  // Video Player
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentLiveClassId, setCurrentLiveClassId] = useState(null);
  const [currentPlatformType, setCurrentPlatformType] = useState("portal");

  const enrolledCourses = useMemo(() => {
    const ids = (userData?.enrolledCourses || []).map((c) =>
      typeof c === "string" ? c : c._id
    );
    return courseData?.filter((c) => ids.includes(c._id)) || [];
  }, [userData, courseData]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await axios.get(`${serverUrl}/api/notifications/my`, {
        withCredentials: true,
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.post(`${serverUrl}/api/notifications/${notificationId}/read`, {}, { withCredentials: true });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent
    }
  };

  const fetchAssignments = async () => {
    if (!enrolledCourses || !enrolledCourses.length) {
      setAssignments([]);
      return;
    }
    setLoadingAssignments(true);
    try {
      const requests = enrolledCourses.map((c) =>
        axios.get(`${serverUrl}/api/assignments/${c._id}`, { withCredentials: true })
          .catch(() => {
            return { data: [] }; // Return empty array on error
          })
      );
      const results = await Promise.all(requests);
      const list = [];
      results.forEach((res, idx) => {
        const course = enrolledCourses[idx];
        if (course && res && res.data && Array.isArray(res.data)) {
          res.data.forEach((a) => {
            if (a && a._id) {
              list.push({ ...a, course });
            }
          });
        }
      });
      setAssignments(list);

      // fetch submissions for each assignment
      const submissionPairs = await Promise.all(
        list.map((a) =>
          axios
            .get(`${serverUrl}/api/assignments/${a._id}/my`, { withCredentials: true })
            .then((r) => [a._id, r.data])
            .catch(() => [a._id, null])
        )
      );
      setSubmissions(Object.fromEntries(submissionPairs));
    } catch {
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolledCourses.length]);

  const fetchSharedNotes = async () => {
    try {
      // For students, show notes from all enrolled courses
      // For educators, allow filtering by course
      const params = {};
      if (userData?.role === "educator" || userData?.role === "admin") {
        if (sharedNoteForm.courseId) params.courseId = sharedNoteForm.courseId;
      }
      // Students will get filtered notes from backend (only enrolled courses)
      const res = await axios.get(`${serverUrl}/api/sharednotes`, {
        params,
        withCredentials: true,
      });
      setSharedNotes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSharedNotes([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/attendance/my`, {
        withCredentials: true,
      });
      const attendanceData = Array.isArray(res.data) ? res.data : [];
      // Populate course information using Redux courseData if available, otherwise fetch from API
      const attendanceWithCourses = await Promise.all(
        attendanceData.map(async (a) => {
          if (!a) return null;
          if (a.courseId && typeof a.courseId === 'string') {
            // First try to find course in Redux store
            const courseFromStore = courseData?.find(c => c && c._id === a.courseId);
            if (courseFromStore) {
              return { ...a, courseId: courseFromStore };
            }
            // If not in store, fetch from API
            try {
              const courseRes = await axios.get(`${serverUrl}/api/course/getcourse/${a.courseId}`, {
                withCredentials: true,
              });
              return { ...a, courseId: courseRes.data };
            } catch {
              return a;
            }
          }
          return a;
        })
      );
      setAttendance(attendanceWithCourses.filter(a => a !== null));
    } catch {
      setAttendance([]);
    }
  };

  useEffect(() => {
    fetchSharedNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedNoteForm.courseId]);

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLiveClasses = async () => {
    setLoadingLiveClasses(true);
    try {
      const res = await axios.get(`${serverUrl}/api/liveclass/my`, {
        withCredentials: true,
      });
      setLiveClasses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLiveClasses([]);
    } finally {
      setLoadingLiveClasses(false);
    }
  };

  useEffect(() => {
    if (activeTab === "liveclasses") {
      fetchLiveClasses();
    }
  }, [activeTab]);

  const fetchGrades = async () => {
    setLoadingGrades(true);
    try {
      const res = await axios.get(`${serverUrl}/api/grades/my`, {
        withCredentials: true,
      });
      setGrades(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (activeTab === "grades") {
      fetchGrades();
    }
  }, [activeTab]);

  const fetchFees = async () => {
    setLoadingFees(true);
    try {
      const res = await axios.get(`${serverUrl}/api/fee/my`, {
        withCredentials: true,
      });
      const records = Array.isArray(res.data?.records) ? res.data.records : [];
      setFeeRecords(records);

      const nextFeePaymentForms = {};
      records.forEach((record) => {
        if (!record?._id) return;
        nextFeePaymentForms[record._id] = {
          amount: Number(record.dueAmount || 0) > 0 ? String(record.dueAmount) : "",
        };
      });
      setFeePaymentForms(nextFeePaymentForms);
    } catch {
      setFeeRecords([]);
      setFeePaymentForms({});
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    if (activeTab === "fees") {
      fetchFees();
    }
  }, [activeTab]);

  const handleOnlineFeePayment = async (record) => {
    try {
      if (!record?._id) {
        return;
      }

      if (!razorpayPublicKey) {
        toast.error("Online payment is not configured. Please contact admin.");
        return;
      }

      if (!window?.Razorpay) {
        toast.error("Payment gateway failed to load. Please refresh and try again.");
        return;
      }

      const enteredAmount = Number(feePaymentForms[record._id]?.amount || 0);
      const dueAmount = Number(record.dueAmount || 0);
      const amountToPay = Number.isFinite(enteredAmount) && enteredAmount > 0 ? enteredAmount : dueAmount;

      if (!Number.isFinite(amountToPay) || amountToPay < 1) {
        toast.error("Please enter a valid amount");
        return;
      }
      if (amountToPay - dueAmount > 0.01) {
        toast.error("Amount cannot exceed due amount");
        return;
      }

      setProcessingFeePaymentId(record._id);

      const orderRes = await axios.post(
        `${serverUrl}/api/fee/${record._id}/create-online-order`,
        { amount: amountToPay },
        { withCredentials: true }
      );

      const options = {
        key: razorpayPublicKey,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency || "INR",
        name: "Learnify",
        description: record.title || "Fee Payment",
        order_id: orderRes.data.id,
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
        },
        modal: {
          ondismiss: () => setProcessingFeePaymentId(""),
        },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              `${serverUrl}/api/fee/${record._id}/verify-online-payment`,
              response,
              { withCredentials: true }
            );
            toast.success(verifyRes.data?.message || "Fee payment successful");
            await fetchFees();
          } catch (error) {
            toast.error(error?.response?.data?.message || "Fee payment verification failed");
          } finally {
            setProcessingFeePaymentId("");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error(response?.error?.description || "Payment failed");
        setProcessingFeePaymentId("");
      });
      rzp.open();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to start online payment");
      setProcessingFeePaymentId("");
    }
  };


  const handleSubmitAssignment = async (assignmentId) => {
    const payload = submitForm[assignmentId] || {};
    try {
      const formData = new FormData();
      if (payload.submissionUrl) formData.append("submissionUrl", payload.submissionUrl);
      if (payload.attachment) formData.append("attachment", payload.attachment);
      if (payload.comment) formData.append("comment", payload.comment);
      const res = await axios.post(
        `${serverUrl}/api/assignments/${assignmentId}/submit`,
        formData,
        { withCredentials: true }
      );
      setSubmissions((prev) => ({ ...prev, [assignmentId]: res.data.submission || res.data }));
      
      if (res.data.alreadySubmitted) {
        toast.info("Assignment submission updated successfully");
      } else {
        toast.success("Assignment submitted successfully");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Submit failed");
    }
  };

  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "No due date");

  const uploadSharedNote = async () => {
    if (!sharedNoteForm.title || !sharedNoteForm.courseId) {
      toast.error("Course and title required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", sharedNoteForm.title);
      formData.append("courseId", sharedNoteForm.courseId);
      if (sharedNoteForm.content) formData.append("content", sharedNoteForm.content);
      if (sharedFile) formData.append("file", sharedFile);
      await axios.post(`${serverUrl}/api/sharednotes`, formData, { withCredentials: true });
      toast.success("Note uploaded");
      setSharedNoteForm({ title: "", content: "", courseId: sharedNoteForm.courseId });
      setSharedFile(null);
      fetchSharedNotes();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Upload failed");
    }
  };

  // Calculate statistics
  const totalEnrolledCourses = enrolledCourses.length;
  const totalAssignments = assignments.length;
  const completedAssignments = submissions && typeof submissions === 'object' 
    ? Object.values(submissions).filter(s => s && (s?.status === "submitted" || s?.status === "graded")).length 
    : 0;
  const totalNotifications = notifications && Array.isArray(notifications) ? notifications.length : 0;
  const unreadNotifications = notifications && Array.isArray(notifications) 
    ? notifications.filter(n => n && !n.isRead).length 
    : 0;

  // Calculate average grade if grades exist
  const averageGrade = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length)
    : null;

  const gradeDistributionData = useMemo(() => {
    const distribution = GRADE_ORDER.reduce((acc, grade) => ({ ...acc, [grade]: 0 }), {});
    (grades || []).forEach((grade) => {
      const key = grade?.grade || "F";
      distribution[key] = (distribution[key] || 0) + 1;
    });
    return GRADE_ORDER.map((grade) => ({ grade, count: distribution[grade] || 0 })).filter((entry) => entry.count > 0);
  }, [grades]);

  const gradeTrendData = useMemo(
    () =>
      [...(grades || [])]
        .filter((grade) => Boolean(grade?.date))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-8)
        .map((grade, index) => ({
          index: index + 1,
          percentage: Number(grade?.percentage) || 0,
          label: grade?.assignmentName || grade?.subject || "Assessment",
        })),
    [grades]
  );

  const coursePerformanceChartData = useMemo(() => {
    const courseMap = {};
    (grades || []).forEach((grade) => {
      const courseId = grade?.courseId?._id || grade?.courseId || "unknown";
      const courseTitle = grade?.courseId?.title || "Unknown Course";
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          courseTitle,
          total: 0,
          count: 0,
        };
      }
      courseMap[courseId].total += Number(grade?.percentage) || 0;
      courseMap[courseId].count += 1;
    });

    return Object.values(courseMap)
      .map((entry) => ({
        courseTitle: entry.courseTitle,
        shortTitle:
          entry.courseTitle.length > SHORT_TITLE_LIMIT
            ? `${entry.courseTitle.slice(0, SHORT_TITLE_LIMIT)}...`
            : entry.courseTitle,
        averagePercentage: entry.count ? Math.round(entry.total / entry.count) : 0,
        exams: entry.count,
      }))
      .sort((a, b) => b.averagePercentage - a.averagePercentage);
  }, [grades]);

  const attendanceSummary = useMemo(() => {
    const summary = { totalRecords: 0, present: 0, absent: 0, late: 0 };
    (attendance || []).forEach((entry) => {
      summary.totalRecords += 1;
      if (entry?.status === "present") summary.present += 1;
      else if (entry?.status === "late") summary.late += 1;
      else summary.absent += 1;
    });

    return {
      ...summary,
      attendancePercentage:
        summary.totalRecords > 0
          ? Math.round(((summary.present + summary.late) / summary.totalRecords) * 100)
          : 0,
    };
  }, [attendance]);

  const attendanceStatusChartData = useMemo(
    () =>
      [
        { name: "Present", value: attendanceSummary.present },
        { name: "Late", value: attendanceSummary.late },
        { name: "Absent", value: attendanceSummary.absent },
      ].filter((entry) => entry.value > 0),
    [attendanceSummary]
  );

  const attendanceByCourseChartData = useMemo(() => {
    const courseMap = {};
    (attendance || []).forEach((entry) => {
      const courseId = entry?.courseId?._id || entry?.courseId || "unknown";
      const courseTitle = entry?.courseId?.title || "Unknown Course";
      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          courseTitle,
          present: 0,
          late: 0,
          absent: 0,
          total: 0,
        };
      }
      courseMap[courseId].total += 1;
      if (entry?.status === "present") courseMap[courseId].present += 1;
      else if (entry?.status === "late") courseMap[courseId].late += 1;
      else courseMap[courseId].absent += 1;
    });

    return Object.values(courseMap)
      .map((entry) => ({
        courseTitle: entry.courseTitle,
        shortTitle:
          entry.courseTitle.length > SHORT_TITLE_LIMIT
            ? `${entry.courseTitle.slice(0, SHORT_TITLE_LIMIT)}...`
            : entry.courseTitle,
        present: entry.present,
        late: entry.late,
        absent: entry.absent,
        percentage: entry.total ? Math.round(((entry.present + entry.late) / entry.total) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [attendance]);

  const feeSummary = (feeRecords || []).reduce(
    (acc, item) => {
      acc.totalFee += item.finalFee || 0;
      acc.totalPaid += item.amountPaid || 0;
      acc.totalDue += item.dueAmount || 0;
      return acc;
    },
    { totalFee: 0, totalPaid: 0, totalDue: 0 }
  );

const formatCurrency = (value) =>
    `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "N/A");
  const razorpayPublicKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-20 sm:pt-24 pb-6 md:pb-8 px-3 sm:px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Student Profile Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mb-6 md:mb-8 border-2 border-[#3B82F6] relative overflow-hidden">
          {/* Decorative Elements */}
          <div className='absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-[#3B82F6] opacity-10 rounded-full blur-3xl'></div>
          <div className='absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-[#3B82F6] opacity-10 rounded-full blur-3xl'></div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#3B82F6] flex items-center justify-center border-4 border-white shadow-2xl">
              {userData?.photoUrl ? (
                <img
                  src={userData.photoUrl}
                  alt="Student"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold text-[#3B82F6]" style={{ display: userData?.photoUrl ? 'none' : 'flex' }}>
                {userData?.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
            </div>
            <div className="text-center md:text-left space-y-2 md:space-y-3 flex-1">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#3B82F6] mb-2">
                  Welcome, {userData?.name || "Student"} 👋
                </h1>
                {userData?.class && (
                  <span className="inline-block px-4 py-1 bg-[#3B82F6] text-black rounded-full text-sm font-semibold mb-2">
                    {userData.class} Grade
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1 md:gap-2 text-white">
                  <FaEnvelope className="text-[#3B82F6] text-xs sm:text-sm" />
                  <span className="font-semibold text-[#3B82F6]">Email:</span>
                  <span className="text-gray-200 truncate max-w-[150px] sm:max-w-none">{userData?.email || "N/A"}</span>
                </div>
                {userData?.subject && (
                  <div className="flex items-center gap-1 md:gap-2 text-white">
                    <FaBook className="text-[#3B82F6] text-xs sm:text-sm" />
                    <span className="font-semibold text-[#3B82F6]">Subject:</span>
                    <span className="text-gray-200">{userData.subject}</span>
                  </div>
                )}
                {userData?.totalActiveMinutes && (
                  <div className="flex items-center gap-1 md:gap-2 text-white">
                    <FaClock className="text-[#3B82F6] text-xs sm:text-sm" />
                    <span className="text-gray-200">Activity: {Math.round((userData.totalActiveMinutes || 0) / 60)} hours</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 border-2 border-[#3B82F6] hover:shadow-2xl transition-all hover:scale-105 hover:border-[#2563EB] relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-[#3B82F6] opacity-10 rounded-full -mr-8 md:-mr-12 -mt-8 md:-mt-12 group-hover:opacity-20 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-2 md:mb-4 relative z-10">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FaBook className="text-white text-lg sm:text-xl md:text-2xl" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide">My Courses</p>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5">Enrolled Programs</p>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-black mb-1 tracking-tight">{totalEnrolledCourses}</p>
              <p className="text-[10px] sm:text-xs font-bold text-[#3B82F6] uppercase tracking-wider mt-1 md:mt-2">Active Learning</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 border-2 border-black hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-black opacity-5 rounded-full -mr-8 md:-mr-12 -mt-8 md:-mt-12 group-hover:opacity-10 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-2 md:mb-4 relative z-10">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-black to-gray-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FaClipboardList className="text-white text-lg sm:text-xl md:text-2xl" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide">My Tasks</p>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5">Assignments</p>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-black mb-1 tracking-tight">
                {completedAssignments}/{totalAssignments}
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider mt-1 md:mt-2">Completed Tasks</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 border-2 border-[#3B82F6] hover:shadow-2xl transition-all hover:scale-105 hover:border-[#2563EB] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-[#3B82F6] opacity-10 rounded-full -mr-8 md:-mr-12 -mt-8 md:-mt-12 group-hover:opacity-20 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-2 md:mb-4 relative z-10">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FaBell className="text-white text-lg sm:text-xl md:text-2xl" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide">Alerts</p>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5">Notifications</p>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-black mb-1 tracking-tight">{totalNotifications}</p>
              {unreadNotifications > 0 ? (
                <p className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wider mt-1 md:mt-2">{unreadNotifications} Unread</p>
              ) : (
                <p className="text-[10px] sm:text-xs font-bold text-[#3B82F6] uppercase tracking-wider mt-1 md:mt-2">All Read</p>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 border-2 border-black hover:shadow-2xl transition-all hover:scale-105 hover:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-black opacity-5 rounded-full -mr-8 md:-mr-12 -mt-8 md:-mt-12 group-hover:opacity-10 transition-opacity"></div>
            
            <div className="flex items-center justify-between mb-2 md:mb-4 relative z-10">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-black to-gray-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FaGraduationCap className="text-white text-lg sm:text-xl md:text-2xl" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide">Performance</p>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5">Average Grade</p>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-black mb-1 tracking-tight">
                {averageGrade !== null ? `${averageGrade}%` : "N/A"}
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider mt-1 md:mt-2">Overall Score</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 border-2 border-gray-100">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-8 pb-3 md:pb-4 border-b-2 border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("mycourses")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === "mycourses" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaBook className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">My Courses</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === "notifications" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaBell className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === "assignments" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaClipboardList className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Assignments</span>
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === "shared" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaBook className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Shared Notes</span>
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === "attendance" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaCalendarCheck className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab("fees")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === "fees"
                  ? "bg-black text-[#3B82F6] shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaMoneyBillWave className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Fees</span>
            </button>
            <button
              onClick={() => setActiveTab("liveclasses")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === "liveclasses" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaVideo className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Live Classes</span>
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                activeTab === "grades" 
                  ? "bg-black text-[#3B82F6] shadow-lg" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaGraduationCap className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">My Grades</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "mycourses" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3B82F6] bg-opacity-20 rounded-lg flex items-center justify-center">
                    <FaBook className="text-[#3B82F6] text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">My Enrolled Courses</h2>
                </div>
                <button
                  onClick={() => navigate("/allcourses")}
                  className="px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
                >
                  <FaBook className="text-sm" /> Browse More
                </button>
              </div>
              
              {!enrolledCourses || enrolledCourses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FaBook className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-600 mb-2">No Enrolled Courses</p>
                  <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
                  <button
                    onClick={() => navigate("/allcourses")}
                    className="px-6 py-3 bg-black text-[#3B82F6] font-semibold rounded-xl hover:bg-gray-900 transition-all"
                  >
                    Browse Courses
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course._id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:border-[#3B82F6] hover:shadow-2xl transition-all hover:scale-105 group"
                    >
                      {/* Course Thumbnail */}
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaBook className="text-6xl text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                          {course.category || "Course"}
                        </div>
                      </div>

                      {/* Course Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                          {course.title || "Untitled Course"}
                        </h3>
                        {course.subTitle && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {course.subTitle}
                          </p>
                        )}
                        
                        {/* Course Details */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {course.class && (
                            <span className="px-2 py-1 bg-[#3B82F6] bg-opacity-20 text-[#3B82F6] rounded-lg text-xs font-semibold">
                              {course.class}
                            </span>
                          )}
                          {course.subject && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                              {course.subject}
                            </span>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => navigate(`/viewlecture/${course._id}`)}
                          className="w-full bg-black text-[#3B82F6] font-semibold py-2.5 rounded-xl hover:bg-gray-900 transition-all flex items-center justify-center gap-2 group"
                        >
                          <FaPlay className="text-sm group-hover:translate-x-1 transition-transform" />
                          Continue Learning
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3B82F6] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FaBell className="text-[#3B82F6] text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications & Events</h2>
              </div>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaBell className="text-sm" /> Refresh
              </button>
            </div>
            {loadingNotifications && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Loading notifications...</p>
              </div>
            )}
            {!loadingNotifications && notifications.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No notifications yet.</p>
                <p className="text-gray-400 text-sm mt-2">You'll see announcements and events here.</p>
              </div>
            )}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {notifications && Array.isArray(notifications) && notifications.map((notif) => {
                if (!notif || !notif._id) return null;
                return (
                <div
                  key={notif._id}
                  className={`border rounded-lg p-4 shadow-sm transition-all ${
                    !notif.isRead
                      ? "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                  onClick={() => {
                    if (!notif.isRead) {
                      markNotificationAsRead(notif._id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-semibold ${
                            notif.type === "event"
                              ? "bg-black text-[#3B82F6]"
                              : notif.type === "assignment"
                              ? "bg-[#3B82F6] text-black"
                              : "bg-black text-[#3B82F6]"
                          }`}
                        >
                          {notif.type === "event"
                            ? "📅 Event"
                            : notif.type === "assignment"
                            ? "📝 Assignment"
                            : "📢 Announcement"}
                        </span>
                        {!notif.isRead && (
                          <span className="w-3 h-3 bg-[#3B82F6] rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{notif.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notif.createdBy?.name || "System"}
                        {notif.courseId?.title && ` • ${notif.courseId.title}`}
                        {notif.eventDate && ` • ${formatDate(notif.eventDate)}`}
                      </p>
                      <p className="text-gray-700 mt-2 whitespace-pre-wrap">{notif.message}</p>
                      {notif.eventDate && (
                        <p className="text-sm text-gray-500 mt-2">
                          📅 Event Date: {new Date(notif.eventDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(notif.createdAt)}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
          )}

          {activeTab === "assignments" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#3B82F6] bg-opacity-20 rounded-lg flex items-center justify-center">
                <FaClipboardList className="text-[#3B82F6] text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">My Assignments</h2>
            </div>
            {loadingAssignments && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading assignments...</p>
              </div>
            )}
            {!loadingAssignments && assignments.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No assignments yet.</p>
                <p className="text-gray-400 text-sm mt-2">Assignments from your enrolled courses will appear here.</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {assignments && Array.isArray(assignments) && assignments.map((a) => {
                if (!a || !a._id) return null;
                const sub = submissions[a._id];
                const payload = submitForm[a._id] || {};
                return (
                  <div key={a._id} className="border-2 border-gray-200 rounded-xl p-5 shadow-md bg-white hover:shadow-xl hover:border-[#3B82F6] transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#3B82F6] bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaClipboardList className="text-[#3B82F6] text-xl" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1">
                          <FaBook className="text-[#3B82F6]" /> {a.course?.title || "Course"}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                        <p className="text-sm text-gray-700 mt-2">{a.description}</p>
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                          <FaClock className="text-[#3B82F6]" /> Due: {formatDate(a.dueDate)}
                        </p>
                      </div>
                    </div>
                    {a.resourceUrl && (
                      <a
                        className="text-sm text-blue-600 underline"
                        href={a.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Resource
                      </a>
                    )}
                    {a.attachmentUrl && (
                      <a
                        className="text-sm text-blue-600 underline ml-2"
                        href={a.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Attachment
                      </a>
                    )}

                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full border rounded-lg p-2 text-sm text-black"
                        placeholder="Submission URL"
                        value={payload.submissionUrl || ""}
                        onChange={(e) =>
                          setSubmitForm((p) => ({
                            ...p,
                            [a._id]: { ...p[a._id], submissionUrl: e.target.value },
                          }))
                        }
                      />
                      <input
                        type="file"
                        className="w-full border rounded-lg p-2 text-sm text-black"
                        onChange={(e) =>
                          setSubmitForm((p) => ({
                            ...p,
                            [a._id]: { ...p[a._id], attachment: e.target.files[0] },
                          }))
                        }
                      />
                      <input
                        className="w-full border rounded-lg p-2 text-sm text-black"
                        placeholder="Attachment URL (optional)"
                        value={payload.attachmentUrl || ""}
                        onChange={(e) =>
                          setSubmitForm((p) => ({
                            ...p,
                            [a._id]: { ...p[a._id], attachmentUrl: e.target.value },
                          }))
                        }
                      />
                      <textarea
                        className="w-full border rounded-lg p-2 text-sm text-black"
                        placeholder="Comment (optional)"
                        value={payload.comment || ""}
                        onChange={(e) =>
                          setSubmitForm((p) => ({
                            ...p,
                            [a._id]: { ...p[a._id], comment: e.target.value },
                          }))
                        }
                      />
                      <button
                        onClick={() => handleSubmitAssignment(a._id)}
                        className="w-full py-2 rounded-lg bg-black text-white"
                      >
                        Submit / Update
                      </button>
                    </div>

                    {sub && (
                      <div className="mt-3 border-t pt-2 text-sm text-gray-700">
                        <p>Status: {sub.status}</p>
                        {sub.score !== undefined && <p>Score: {sub.score}</p>}
                        {sub.feedback && <p>Feedback: {sub.feedback}</p>}
                        {sub.attachmentUrl && (
                          <a
                            className="text-blue-600 underline"
                            href={sub.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download submission
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {activeTab === "shared" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#3B82F6] bg-opacity-20 rounded-lg flex items-center justify-center">
                <FaBook className="text-[#3B82F6] text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Shared Notes</h2>
            </div>
            {userData?.role === "educator" || userData?.role === "admin" ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FaBook className="text-[#3B82F6]" /> Upload Shared Note
                  </h3>
                  <select
                    className="w-full border rounded-lg p-2 text-black"
                    value={sharedNoteForm.courseId}
                    onChange={(e) => setSharedNoteForm((p) => ({ ...p, courseId: e.target.value }))}
                  >
                    <option value="">Select course</option>
                    {enrolledCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <input
                    className="w-full border rounded-lg p-2 text-black"
                    placeholder="Title"
                    value={sharedNoteForm.title}
                    onChange={(e) => setSharedNoteForm((p) => ({ ...p, title: e.target.value }))}
                  />
                  <textarea
                    className="w-full border rounded-lg p-2 min-h-[120px] text-black"
                    placeholder="Content (optional)"
                    value={sharedNoteForm.content}
                    onChange={(e) => setSharedNoteForm((p) => ({ ...p, content: e.target.value }))}
                  />
                  <input
                    type="file"
                    className="w-full border rounded-lg p-2 text-black"
                    onChange={(e) => setSharedFile(e.target.files[0])}
                  />
                  <button onClick={uploadSharedNote} className="px-4 py-2 bg-black text-white rounded-lg">
                    Upload Note
                  </button>
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Shared Notes</h2>
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {(!sharedNotes || sharedNotes.length === 0) && <p className="text-gray-500">No shared notes.</p>}
                    {sharedNotes && Array.isArray(sharedNotes) && sharedNotes.map((n) => {
                      if (!n || !n._id) return null;
                      return (
                      <div key={n._id} className="border rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">
                          {formatDate(n.createdAt)} • {n.uploaderId?.name || "User"}
                          {n.courseId?.title && ` • ${n.courseId.title}`}
                        </p>
                        <h3 className="font-semibold">{n.title}</h3>
                        {n.content && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.content}</p>}
                        {n.fileUrl && (
                          <a
                            className="text-blue-600 underline text-sm mt-2 inline-block"
                            href={n.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            📥 Download file
                          </a>
                        )}
                      </div>
                    );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Shared Notes from Educators</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Download notes uploaded by your course educators. Only educators can upload notes.
                </p>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {(!sharedNotes || sharedNotes.length === 0) && (
                    <p className="text-gray-500 text-center py-8">No shared notes available for your enrolled courses.</p>
                  )}
                  {sharedNotes && Array.isArray(sharedNotes) && sharedNotes.map((n) => {
                    if (!n || !n._id) return null;
                    return (
                    <div key={n._id} className="border rounded-lg p-4 shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-gray-500">
                            {formatDate(n.createdAt)} • {n.uploaderId?.name || "Educator"}
                            {n.courseId?.title && ` • ${n.courseId.title}`}
                          </p>
                          <h3 className="font-semibold text-lg mt-1">{n.title}</h3>
                        </div>
                      </div>
                      {n.content && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {n.content}
                        </p>
                      )}
                      {n.fileUrl && (
                        <div className="mt-3">
                          <a
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            href={n.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            <span>📥</span>
                            <span>Download Note File</span>
                          </a>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )}

          {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3B82F6] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FaCalendarCheck className="text-[#3B82F6] text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">My Attendance Records</h2>
              </div>
              <button
                onClick={fetchAttendance}
                className="px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaCalendarCheck className="text-sm" /> Refresh
              </button>
            </div>
            {attendance.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaCalendarCheck className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No attendance records found.</p>
                <p className="text-gray-400 text-sm mt-2">Your attendance will appear here once your educators mark it.</p>
              </div>
            )}
            {attendance.length > 0 && (
              <>
                {/* Attendance Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Total Records</p>
                    <p className="text-2xl font-bold text-gray-800">{attendanceSummary.totalRecords}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-green-700 mb-1">Present</p>
                    <p className="text-2xl font-bold text-green-800">{attendanceSummary.present}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-red-700 mb-1">Absent</p>
                    <p className="text-2xl font-bold text-red-800">{attendanceSummary.absent}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-blue-700 mb-1">Late</p>
                    <p className="text-2xl font-bold text-blue-800">{attendanceSummary.late}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-blue-700 mb-1">Attendance %</p>
                    <p className="text-2xl font-bold text-blue-800">{attendanceSummary.attendancePercentage}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                  {attendanceStatusChartData.length > 0 && (
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-base font-semibold text-gray-800 mb-3">Attendance Status Split</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={attendanceStatusChartData} dataKey="value" nameKey="name" outerRadius={90}>
                              {attendanceStatusChartData.map((entry) => (
                                <Cell key={`status-${entry.name}`} fill={ATTENDANCE_COLORS[entry.name]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, "Records"]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {attendanceByCourseChartData.length > 0 && (
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-base font-semibold text-gray-800 mb-3">Course-wise Attendance %</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={attendanceByCourseChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="shortTitle" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                            <Bar dataKey="percentage" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Attendance Table */}
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Day
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendance.map((a) => {
                          const attendanceDate = new Date(a.date);
                          const dayOfWeek = attendanceDate.toLocaleDateString("en-US", { weekday: "long" });
                          const formattedDate = attendanceDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          });

                          const getStatusBadge = (status) => {
                            switch (status?.toLowerCase()) {
                              case "present":
                                return (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                                    ✓ Present
                                  </span>
                                );
                              case "absent":
                                return (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                                    ✗ Absent
                                  </span>
                                );
                              case "late":
                                return (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                    ⏰ Late
                                  </span>
                                );
                              default:
                                return (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">
                                    ? Unknown
                                  </span>
                                );
                            }
                          };

                          return (
                            <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formattedDate}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {dayOfWeek}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {a.courseId?.title || (typeof a.courseId === 'string' ? "Loading..." : "Unknown Course")}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {getStatusBadge(a.status)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
          )}

          {activeTab === "fees" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3B82F6] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="text-[#3B82F6] text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">My Fee Status</h2>
              </div>
              <button
                onClick={fetchFees}
                className="px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaMoneyBillWave className="text-sm" /> Refresh
              </button>
            </div>

            {loadingFees && (
              <div className="text-center py-10 text-gray-500">Loading fee records...</div>
            )}

            {!loadingFees && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Fee</p>
                  <p className="text-2xl font-bold text-black">{formatCurrency(feeSummary.totalFee)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">Paid</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(feeSummary.totalPaid)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">Due</p>
                  <p className="text-2xl font-bold text-red-800">{formatCurrency(feeSummary.totalDue)}</p>
                </div>
              </div>
            )}

            {!loadingFees && feeRecords.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaMoneyBillWave className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No fee records found.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Fee plans created by admin will appear here.
                </p>
              </div>
            )}

            {!loadingFees && feeRecords.length > 0 && (
              <div className="space-y-3">
                {feeRecords.map((record) => (
                  <div key={record._id} className="border rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {record.title || "Coaching Fee"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Course: {record.courseId?.title || "General Fee"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Plan:{" "}
                          {record.totalInstallments > 1
                            ? `Monthly (${record.installmentNumber}/${record.totalInstallments})`
                            : "One-time"}
                        </p>
                        {record.centerName && (
                          <p className="text-xs text-gray-500">Center: {record.centerName}</p>
                        )}
                        {record.dueDate && (
                          <p className="text-xs text-gray-500">
                            Due Date: {formatDateTime(record.dueDate)}
                          </p>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : record.status === "partial"
                            ? "bg-blue-100 text-blue-800"
                            : record.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {record.status}
                        </span>
                        <p>Total: {formatCurrency(record.finalFee)}</p>
                        <p className="text-green-700">Paid: {formatCurrency(record.amountPaid)}</p>
                        <p className="text-red-700">Due: {formatCurrency(record.dueAmount)}</p>
                      </div>
                    </div>

                    {Number(record.dueAmount || 0) > 0 && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          className="border rounded-lg px-3 py-2 text-sm text-black"
                          placeholder="Amount to pay"
                          value={feePaymentForms[record._id]?.amount || ""}
                          onChange={(e) =>
                            setFeePaymentForms((prev) => ({
                              ...prev,
                              [record._id]: {
                                amount: e.target.value,
                              },
                            }))
                          }
                        />
                        <button
                          onClick={() => handleOnlineFeePayment(record)}
                          disabled={
                            processingFeePaymentId === record._id ||
                            !razorpayPublicKey
                          }
                          className="md:col-span-2 bg-black text-[#3B82F6] rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-900 disabled:opacity-60"
                        >
                          {processingFeePaymentId === record._id ? "Processing..." : "Pay Online (Razorpay)"}
                        </button>
                        <p className="text-xs text-gray-500 flex items-center">
                          {razorpayPublicKey
                            ? `Max payable now: ${formatCurrency(record.dueAmount)}`
                            : "Online payment not configured"}
                        </p>
                      </div>
                    )}

                    {Array.isArray(record.installments) && record.installments.length > 0 && (
                      <div className="mt-4 border-t pt-3">
                        <p className="text-sm font-semibold text-gray-800 mb-2">My Payments</p>
                        <div className="space-y-2">
                          {[...record.installments]
                            .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
                            .map((payment) => (
                              <div
                                key={payment._id}
                                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50 rounded-lg p-2"
                              >
                                <div className="text-xs text-gray-700">
                                  <p>
                                    Amount:{" "}
                                    <span className="font-semibold text-black">
                                      {formatCurrency(payment.amount)}
                                    </span>
                                  </p>
                                  <p>
                                    Date: {formatDateTime(payment.paidAt)} | Mode:{" "}
                                    {(payment.paymentMode || "cash").toUpperCase()}
                                  </p>
                                  {payment.referenceId && <p>Ref: {payment.referenceId}</p>}
                                </div>
                                <a
                                  href={`${serverUrl}/api/fee/${record._id}/receipt/${payment._id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-black text-[#3B82F6] text-xs font-semibold hover:bg-gray-900"
                                >
                                  <FaPrint /> Print Receipt
                                </a>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {activeTab === "liveclasses" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Classes (Online + Offline)</h2>
              <button
                onClick={fetchLiveClasses}
                className="px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaVideo className="text-sm" /> Refresh
              </button>
            </div>
            {loadingLiveClasses && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading classes...</p>
              </div>
            )}
            {!loadingLiveClasses && liveClasses.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No classes scheduled.</p>
                <p className="text-gray-400 text-sm mt-2">Upcoming online/offline classes will appear here.</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {liveClasses.map((liveClass) => {
                const scheduledDate = new Date(liveClass.scheduledDate);
                const isUpcoming = scheduledDate > new Date();
                const isLive = liveClass.status === "live";
                const isCompleted = liveClass.status === "completed";
                const canJoin = isUpcoming || isLive;
                const deliveryMode = liveClass.deliveryMode || (liveClass.platformType === "offline" ? "offline" : "online");
                const offlineOnly = deliveryMode === "offline";
                const portalBased = !offlineOnly && (liveClass.platformType === "portal" || liveClass.platformType === "other");
                const venue = liveClass.offlineDetails || {};
                const platformLabel =
                  liveClass.platformType === "zoom" ? "Zoom" :
                  liveClass.platformType === "google-meet" ? "Google Meet" :
                  liveClass.platformType === "portal" ? "Our Portal (Built-in Video)" :
                  liveClass.platformType === "other" ? "Other (Our Portal)" : "Offline Classroom";

                const handleJoin = async () => {
                  try {
                    const response = await axios.post(`${serverUrl}/api/liveclass/${liveClass._id}/join`, {}, { withCredentials: true });
                    if (response.data.alreadyJoined) {
                      toast.info("Attendance already marked");
                    } else if (offlineOnly) {
                      toast.success("Attendance marked for offline class");
                    } else {
                      toast.success("Successfully joined class");
                    }
                    if (portalBased) {
                      setCurrentLiveClassId(liveClass._id);
                      setCurrentPlatformType("portal");
                      setShowVideoPlayer(true);
                    }
                    fetchLiveClasses();
                  } catch (error) {
                    toast.error(error.response?.data?.message || "Failed to join class");
                  }
                };

                return (
                  <div key={liveClass._id} className={`border rounded-xl p-5 shadow-lg transition-all ${isLive ? "bg-red-50 border-red-300 border-l-4 border-l-red-500" : isCompleted ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200 hover:shadow-xl"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-800">{liveClass.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isLive ? "bg-red-100 text-red-800" : isCompleted ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"}`}>{liveClass.status.toUpperCase()}</span>
                    </div>
                    {liveClass.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{liveClass.description}</p>}
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div><span className="font-medium">Course:</span> {liveClass.courseId?.title || "General Session (No course)"}</div>
                      <div><span className="font-medium">Educator:</span> {liveClass.educatorId?.name || "Unknown"}</div>
                      <div><span className="font-medium">Date:</span> {scheduledDate.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      <div><span className="font-medium">Duration:</span> {liveClass.duration} minutes</div>
                      <div><span className="font-medium">Participants:</span> {liveClass.enrolledStudents?.length || 0} / {liveClass.maxParticipants}</div>
                    </div>
                    <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs"><span className="font-semibold">Mode:</span> <span className="capitalize text-blue-700">{deliveryMode}</span></div>
                    {(deliveryMode === "offline" || deliveryMode === "hybrid") && hasVenueDetails(venue) && (
                      <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                        {venue.centerName && <p>Center: {venue.centerName}</p>}
                        {venue.classroom && <p>Room: {venue.classroom}</p>}
                        {venue.address && <p>Address: {venue.address}</p>}
                      </div>
                    )}
                    {!offlineOnly && <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs"><span className="font-semibold">Platform:</span> <span className="text-blue-700">{platformLabel}</span></div>}
                    <div className="flex gap-2">
                      {canJoin && (offlineOnly ? (
                        <button onClick={handleJoin} className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 font-semibold">Mark Attendance</button>
                      ) : portalBased ? (
                        <button onClick={handleJoin} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold">{isLive ? "Join Now" : "Join Live Class"}</button>
                      ) : liveClass.meetingLink ? (
                        <a href={liveClass.meetingLink} target="_blank" rel="noopener noreferrer" onClick={handleJoin} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center font-semibold">{isLive ? "Join Now" : "Join Meeting"}</a>
                      ) : (
                        <button disabled className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed font-semibold">Meeting link not available</button>
                      ))}
                      {isCompleted && liveClass.recordingUrl && (
                        <a href={liveClass.recordingUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center font-semibold">Watch Recording</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
          {activeTab === "grades" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">My Grades & Marks</h2>
              <button
                onClick={fetchGrades}
                className="px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
              >
                <FaGraduationCap className="text-sm" /> Refresh
              </button>
            </div>
            {loadingGrades && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
                <p className="text-gray-500">Loading grades...</p>
              </div>
            )}
            {!loadingGrades && grades.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <FaGraduationCap className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No grades available yet.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Your grades will appear here once your educators upload them.
                </p>
              </div>
            )}
            {!loadingGrades && grades.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {gradeDistributionData.length > 0 && (
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-base font-semibold text-gray-800 mb-3">Grade Distribution</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={gradeDistributionData} dataKey="count" nameKey="grade" outerRadius={90}>
                              {gradeDistributionData.map((entry) => (
                                <Cell key={`grade-${entry.grade}`} fill={GRADE_COLORS[entry.grade] || "#6b7280"} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, "Records"]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {gradeTrendData.length > 0 && (
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      <h3 className="text-base font-semibold text-gray-800 mb-3">Recent Performance Trend</h3>
                      <div className="h-64">
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
                    <div className="bg-white border rounded-lg shadow-sm p-4 xl:col-span-2">
                      <h3 className="text-base font-semibold text-gray-800 mb-3">Course-wise Average Score</h3>
                      <div className="h-64">
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
                </div>

                {/* Group by course */}
                {Object.entries(
                  grades.reduce((acc, grade) => {
                    const courseId = grade.courseId?._id || grade.courseId;
                    const courseTitle = grade.courseId?.title || "Unknown Course";
                    if (!acc[courseId]) {
                      acc[courseId] = { title: courseTitle, grades: [] };
                    }
                    acc[courseId].grades.push(grade);
                    return acc;
                  }, {})
                ).map(([courseId, { title, grades: courseGrades }]) => {
                  const averagePercentage =
                    courseGrades.reduce((sum, g) => sum + g.percentage, 0) /
                    courseGrades.length;

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

                  return (
                    <div key={courseId} className="bg-white border rounded-lg shadow-sm p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Average</p>
                          <p className="text-2xl font-bold">{Math.round(averagePercentage)}%</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Subject
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Assignment
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Type
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Marks
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Percentage
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Grade
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {courseGrades.map((grade) => (
                              <tr key={grade._id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm font-medium">{grade.subject}</td>
                                <td className="px-3 py-2 text-sm">
                                  {grade.assignmentName || "-"}
                                </td>
                                <td className="px-3 py-2 text-sm capitalize">{grade.examType}</td>
                                <td className="px-3 py-2 text-sm">
                                  {grade.marksObtained} / {grade.totalMarks}
                                </td>
                                <td className="px-3 py-2 text-sm font-semibold">
                                  {grade.percentage}%
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold ${getGradeColor(
                                      grade.grade
                                    )}`}
                                  >
                                    {grade.grade}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {new Date(grade.date).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {courseGrades.some((g) => g.remarks) && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-2">Remarks:</h4>
                          {courseGrades
                            .filter((g) => g.remarks)
                            .map((grade) => (
                              <div key={grade._id} className="text-sm text-gray-700 mb-1">
                                <span className="font-medium">{grade.subject}:</span>{" "}
                                {grade.remarks}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Live Video Player */}
      {showVideoPlayer && currentLiveClassId && (
        currentPlatformType === "portal" ? (
          <LiveKitPlayer
            liveClassId={currentLiveClassId}
            userRole={userData?.role}
            isEducator={false}
            onClose={() => {
              setShowVideoPlayer(false);
              setCurrentLiveClassId(null);
            }}
          />
        ) : (
          <LiveVideoPlayer
            liveClassId={currentLiveClassId}
            userRole={userData?.role}
            isEducator={false}
            onClose={() => {
              setShowVideoPlayer(false);
              setCurrentLiveClassId(null);
            }}
          />
        )
      )}
    </div>
  );
}

export default StudentDashboard;

