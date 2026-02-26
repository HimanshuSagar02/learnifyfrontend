/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import {
  FaStar,
  FaUser,
  FaBuilding,
  FaDownload,
  FaFilter,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    feedbackType: "",
    status: "",
    teacherId: "",
  });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [filters]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.feedbackType) params.feedbackType = filters.feedbackType;
      if (filters.status) params.status = filters.status;
      if (filters.teacherId) params.teacherId = filters.teacherId;

      const res = await axios.get(`${serverUrl}/api/feedback/all`, {
        params,
        withCredentials: true,
      });
      setFeedbacks(res.data);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/feedback/stats`, {
        withCredentials: true,
      });
      setStats(res.data);
    } catch {
      setStats(null);
    }
  };

  const handleStatusUpdate = async (feedbackId, status) => {
    try {
      await axios.patch(
        `${serverUrl}/api/feedback/${feedbackId}/status`,
        { status, adminResponse },
        { withCredentials: true }
      );
      toast.success("Feedback status updated");
      setSelectedFeedback(null);
      setAdminResponse("");
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const downloadReport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.feedbackType) params.append("feedbackType", filters.feedbackType);
      if (filters.status) params.append("status", filters.status);
      if (filters.teacherId) params.append("teacherId", filters.teacherId);

      const url = `${serverUrl}/api/feedback/report?${params.toString()}`;
      window.open(url, "_blank");
      toast.success("Report download started");
    } catch {
      toast.error("Failed to download report");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-blue-100", text: "text-blue-800", icon: FaClock },
      reviewed: { bg: "bg-blue-100", text: "text-blue-800", icon: FaCheckCircle },
      resolved: { bg: "bg-green-100", text: "text-green-800", icon: FaCheckCircle },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badge.bg} ${badge.text}`}>
        <Icon className="text-xs" /> {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-24 pb-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-8 mb-8 border-2 border-[#3B82F6] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6] opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-[#3B82F6] mb-2">Feedback Management</h1>
              <p className="text-white text-lg">View and manage all student feedbacks</p>
            </div>
            <button
              onClick={downloadReport}
              className="px-6 py-3 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all shadow-lg flex items-center gap-2"
            >
              <FaDownload /> Download PDF Report
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#3B82F6]">
              <p className="text-sm text-gray-600 font-semibold mb-2">Total Feedbacks</p>
              <p className="text-3xl font-bold text-black">{stats.totalFeedbacks}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-black">
              <p className="text-sm text-gray-600 font-semibold mb-2">Teacher Feedbacks</p>
              <p className="text-3xl font-bold text-black">{stats.teacherFeedbacks}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#3B82F6]">
              <p className="text-sm text-gray-600 font-semibold mb-2">Facilities Feedbacks</p>
              <p className="text-3xl font-bold text-black">{stats.facilitiesFeedbacks}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-black">
              <p className="text-sm text-gray-600 font-semibold mb-2">Average Rating</p>
              <p className="text-3xl font-bold text-black">
                {parseFloat(stats.avgRating).toFixed(1)}/5
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <FaFilter className="text-[#3B82F6] text-xl" />
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6]"
                value={filters.feedbackType}
                onChange={(e) => setFilters({ ...filters, feedbackType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="teacher">Teacher</option>
                <option value="facilities">Facilities</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6]"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setFilters({ feedbackType: "", status: "", teacherId: "" })}
                className="w-full h-12 px-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Feedbacks List */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Feedbacks</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading feedbacks...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold">No feedbacks found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#3B82F6] transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {feedback.feedbackType === "teacher" ? (
                          <FaUser className="text-[#3B82F6] text-xl" />
                        ) : (
                          <FaBuilding className="text-[#3B82F6] text-xl" />
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          feedback.feedbackType === "teacher"
                            ? "bg-[#3B82F6] text-black"
                            : "bg-black text-[#3B82F6]"
                        }`}>
                          {feedback.feedbackType === "teacher" ? "Teacher" : "Facilities"}
                        </span>
                        {getStatusBadge(feedback.status)}
                      </div>
                      {feedback.feedbackType === "teacher" && feedback.teacherName && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold">Teacher:</span> {feedback.teacherName}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Student:</span>{" "}
                        {feedback.isAnonymous
                          ? "Anonymous"
                          : feedback.studentId?.name || "Unknown"}
                        {feedback.studentId?.class && ` (Branch: ${feedback.studentId.class})`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={`text-xl ${
                            star <= feedback.rating ? "text-[#3B82F6]" : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-bold text-gray-700">{feedback.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 bg-gray-50 p-4 rounded-lg">
                    {feedback.comment}
                  </p>
                  {feedback.adminResponse && (
                    <div className="bg-[#3B82F6] bg-opacity-10 border-l-4 border-[#3B82F6] p-4 rounded-lg mb-4">
                      <p className="text-sm font-semibold text-gray-900 mb-1">Admin Response:</p>
                      <p className="text-gray-700">{feedback.adminResponse}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedFeedback(feedback);
                        setAdminResponse(feedback.adminResponse || "");
                      }}
                      className="px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-lg hover:bg-gray-900 transition-all"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Update Feedback Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6]"
                    value={selectedFeedback.status}
                    onChange={(e) =>
                      setSelectedFeedback({ ...selectedFeedback, status: e.target.value })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Response (Optional)
                  </label>
                  <textarea
                    className="w-full h-24 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6] resize-none"
                    placeholder="Add your response..."
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedFeedback._id, selectedFeedback.status)}
                    className="flex-1 px-4 py-3 bg-black text-[#3B82F6] font-bold rounded-xl hover:bg-gray-900 transition-all"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFeedback(null);
                      setAdminResponse("");
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminFeedback;


