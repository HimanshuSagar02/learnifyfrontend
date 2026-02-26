import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
import { FaStar, FaUser, FaBuilding, FaCheckCircle } from "react-icons/fa";

function Feedback() {
  const [feedbackType, setFeedbackType] = useState("teacher");
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("overall");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);

  useEffect(() => {
    if (feedbackType === "teacher") {
      fetchTeachers();
    }
    fetchMyFeedbacks();
  }, [feedbackType]);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/feedback/teachers`, {
        withCredentials: true,
      });
      setTeachers(res.data);
    } catch {
      setTeachers([]);
    }
  };

  const fetchMyFeedbacks = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/feedback/my`, {
        withCredentials: true,
      });
      setMyFeedbacks(res.data);
    } catch {
      setMyFeedbacks([]);
    }
  };

  const handleTeacherSelect = (e) => {
    const teacherId = e.target.value;
    setSelectedTeacher(teacherId);
    const teacher = teachers.find((t) => t._id === teacherId);
    if (teacher) {
      setTeacherName(teacher.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating || rating === 0) {
      toast.error("Please provide a rating");
      return;
    }
    
    if (!comment.trim()) {
      toast.error("Please provide your feedback comment");
      return;
    }

    if (feedbackType === "teacher" && !selectedTeacher && !teacherName.trim()) {
      toast.error("Please select a teacher or enter teacher name");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        feedbackType,
        rating,
        comment: comment.trim(),
        category,
        isAnonymous,
      };

      if (feedbackType === "teacher") {
        if (selectedTeacher) {
          payload.teacherId = selectedTeacher;
        }
        if (teacherName.trim()) {
          payload.teacherName = teacherName.trim();
        }
      }

      await axios.post(`${serverUrl}/api/feedback`, payload, {
        withCredentials: true,
      });

      toast.success("Feedback submitted successfully!");
      setRating(0);
      setComment("");
      setSelectedTeacher("");
      setTeacherName("");
      setCategory("overall");
      setIsAnonymous(false);
      fetchMyFeedbacks();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryOptions = () => {
    if (feedbackType === "teacher") {
      return [
        { value: "teaching_quality", label: "Teaching Quality" },
        { value: "communication", label: "Communication" },
        { value: "punctuality", label: "Punctuality" },
        { value: "support", label: "Support" },
        { value: "overall", label: "Overall" },
      ];
    } else {
      return [
        { value: "infrastructure", label: "Infrastructure" },
        { value: "technology", label: "Technology" },
        { value: "resources", label: "Resources" },
        { value: "environment", label: "Environment" },
        { value: "overall", label: "Overall" },
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-24 pb-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-8 mb-8 border-2 border-[#3B82F6] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6] opacity-10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-[#3B82F6] mb-2">Submit Feedback</h1>
            <p className="text-white text-lg">Help us improve by sharing your experience</p>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Feedback Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackType("teacher");
                    setSelectedTeacher("");
                    setTeacherName("");
                  }}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                    feedbackType === "teacher"
                      ? "border-[#3B82F6] bg-[#3B82F6] bg-opacity-10 text-black font-semibold"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <FaUser className="text-xl" />
                  <span>Teacher Feedback</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackType("facilities");
                    setSelectedTeacher("");
                    setTeacherName("");
                  }}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                    feedbackType === "facilities"
                      ? "border-[#3B82F6] bg-[#3B82F6] bg-opacity-10 text-black font-semibold"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <FaBuilding className="text-xl" />
                  <span>Facilities Feedback</span>
                </button>
              </div>
            </div>

            {/* Teacher Selection (for teacher feedback) */}
            {feedbackType === "teacher" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Teacher <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-colors"
                    value={selectedTeacher}
                    onChange={handleTeacherSelect}
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Or Enter Teacher Name
                  </label>
                  <input
                    type="text"
                    className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-colors"
                    placeholder="Enter teacher name if not in list"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-colors"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {getCategoryOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <FaStar
                      className={`text-4xl transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-[#3B82F6]"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {rating} out of 5 stars
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-colors resize-none"
                placeholder="Please share your detailed feedback..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="anonymous"
                className="w-5 h-5 accent-[#3B82F6]"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">
                Submit anonymously
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-black text-[#3B82F6] font-bold rounded-xl hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3B82F6]"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle /> Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>

        {/* My Feedbacks */}
        {myFeedbacks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Submitted Feedbacks</h2>
            <div className="space-y-4">
              {myFeedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:border-[#3B82F6] transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          feedback.feedbackType === "teacher"
                            ? "bg-[#3B82F6] text-black"
                            : "bg-black text-[#3B82F6]"
                        }`}>
                          {feedback.feedbackType === "teacher" ? "Teacher" : "Facilities"}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          feedback.status === "pending"
                            ? "bg-blue-100 text-blue-800"
                            : feedback.status === "reviewed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {feedback.status}
                        </span>
                      </div>
                      {feedback.feedbackType === "teacher" && feedback.teacherName && (
                        <p className="text-sm text-gray-600">
                          Teacher: <span className="font-semibold">{feedback.teacherName}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={`text-lg ${
                            star <= feedback.rating ? "text-[#3B82F6]" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{feedback.comment}</p>
                  <p className="text-xs text-gray-500">
                    Submitted: {new Date(feedback.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Feedback;

