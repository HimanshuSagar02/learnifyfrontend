import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  FaVideo,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaEdit,
  FaTrash,
  FaPlay,
  FaStop,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { serverUrl } from "../../App";
import LiveKitPlayer from "../../components/LiveKitPlayer";

const GENERAL_COURSE_VALUE = "__general__";

const defaultOfflineDetails = {
  centerName: "",
  classroom: "",
  address: "",
  landmark: "",
  notes: "",
};

const createDefaultFormData = () => ({
  title: "",
  description: "",
  courseId: "",
  deliveryMode: "online",
  platformType: "portal",
  meetingLink: "",
  meetingId: "",
  meetingPassword: "",
  offlineDetails: { ...defaultOfflineDetails },
  scheduleType: "scheduled",
  scheduledDate: "",
  duration: 60,
  maxParticipants: 100,
});

const isPortalPlatform = (platformType) =>
  platformType === "portal" || platformType === "other";

const isExternalPlatform = (platformType) =>
  platformType === "zoom" || platformType === "google-meet";

const getDeliveryMode = (liveClass) => {
  if (liveClass?.deliveryMode) return liveClass.deliveryMode;
  return liveClass?.platformType === "offline" ? "offline" : "online";
};

const hasVenueDetails = (details) =>
  Boolean(details?.centerName || details?.classroom || details?.address);

const getPlatformLabel = (platformType) => {
  if (platformType === "portal") return "Our Portal";
  if (platformType === "zoom") return "Zoom";
  if (platformType === "google-meet") return "Google Meet";
  if (platformType === "other") return "Other (Portal)";
  return "Offline Classroom";
};

const getValidDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function LiveClasses() {
  const { userData } = useSelector((state) => state.user);
  const { courseData, creatorCourseData } = useSelector((state) => state.course);

  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState(createDefaultFormData());
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentLiveClassId, setCurrentLiveClassId] = useState(null);

  const myCourses = useMemo(() => {
    if (creatorCourseData && creatorCourseData.length > 0) {
      return creatorCourseData;
    }
    return (
      courseData?.filter(
        (course) =>
          course.creator?._id === userData?._id || course.creator === userData?._id
      ) || []
    );
  }, [creatorCourseData, courseData, userData?._id]);

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/liveclass/educator`, {
        withCredentials: true,
      });
      setLiveClasses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLiveClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const resetForm = () => {
    setFormData(createDefaultFormData());
  };

  const prepareSubmitData = () => {
    const submitData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      meetingLink: formData.meetingLink.trim(),
      meetingId: formData.meetingId.trim(),
      meetingPassword: formData.meetingPassword.trim(),
      offlineDetails: {
        centerName: formData.offlineDetails.centerName.trim(),
        classroom: formData.offlineDetails.classroom.trim(),
        address: formData.offlineDetails.address.trim(),
        landmark: formData.offlineDetails.landmark.trim(),
        notes: formData.offlineDetails.notes.trim(),
      },
    };

    if (submitData.scheduleType === "startnow") {
      submitData.scheduledDate = new Date().toISOString();
    }

    if (submitData.courseId === GENERAL_COURSE_VALUE) {
      submitData.courseId = null;
    }

    if (submitData.deliveryMode === "offline") {
      submitData.platformType = "offline";
      submitData.meetingLink = "";
      submitData.meetingId = "";
      submitData.meetingPassword = "";
    } else if (!isExternalPlatform(submitData.platformType)) {
      submitData.meetingLink = "";
      submitData.meetingId = "";
      submitData.meetingPassword = "";
    }

    return submitData;
  };

  const validateSubmitData = (submitData) => {
    if (!submitData.title) return "Title is required";
    if (!submitData.courseId && submitData.courseId !== null) {
      return "Please select a course or Others / General";
    }
    if (submitData.scheduleType === "scheduled" && !submitData.scheduledDate) {
      return "Please select scheduled date and time";
    }
    if (
      (submitData.deliveryMode === "offline" || submitData.deliveryMode === "hybrid") &&
      !hasVenueDetails(submitData.offlineDetails)
    ) {
      return "Please provide classroom venue details";
    }
    if (
      submitData.deliveryMode !== "offline" &&
      isExternalPlatform(submitData.platformType) &&
      !submitData.meetingLink
    ) {
      return "Meeting link is required for Zoom/Google Meet";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = prepareSubmitData();
    const error = validateSubmitData(submitData);
    if (error) {
      toast.error(error);
      return;
    }

    const scheduleType = submitData.scheduleType;
    delete submitData.scheduleType;

    try {
      let liveClassId = editingClass?._id;

      if (editingClass) {
        await axios.patch(`${serverUrl}/api/liveclass/${editingClass._id}`, submitData, {
          withCredentials: true,
        });
        toast.success("Session updated successfully");
      } else {
        const response = await axios.post(`${serverUrl}/api/liveclass`, submitData, {
          withCredentials: true,
        });
        liveClassId = response.data?._id;
        toast.success("Session created successfully");
      }

      if (scheduleType === "startnow" && liveClassId) {
        await axios.patch(
          `${serverUrl}/api/liveclass/${liveClassId}/status`,
          { status: "live" },
          { withCredentials: true }
        );

        if (submitData.deliveryMode !== "offline" && isPortalPlatform(submitData.platformType)) {
          setCurrentLiveClassId(liveClassId);
          setShowVideoPlayer(true);
        } else if (submitData.meetingLink) {
          window.open(submitData.meetingLink, "_blank");
        } else {
          toast.info("Offline session started. Students can mark attendance.");
        }
      }

      setShowModal(false);
      setEditingClass(null);
      resetForm();
      fetchLiveClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save session");
    }
  };

  const handleEdit = (liveClass) => {
    const scheduledDate = getValidDate(liveClass?.scheduledDate) || new Date();
    const deliveryMode = getDeliveryMode(liveClass);

    setEditingClass(liveClass);
    setFormData({
      title: liveClass.title || "",
      description: liveClass.description || "",
      courseId: liveClass.courseId?._id || liveClass.courseId || GENERAL_COURSE_VALUE,
      deliveryMode,
      platformType: deliveryMode === "offline" ? "offline" : liveClass.platformType || "portal",
      meetingLink: liveClass.meetingLink || "",
      meetingId: liveClass.meetingId || "",
      meetingPassword: liveClass.meetingPassword || "",
      offlineDetails: {
        ...defaultOfflineDetails,
        ...(liveClass.offlineDetails || {}),
      },
      scheduleType: scheduledDate <= new Date() ? "startnow" : "scheduled",
      scheduledDate: scheduledDate.toISOString().slice(0, 16),
      duration: liveClass.duration || 60,
      maxParticipants: liveClass.maxParticipants || 100,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await axios.delete(`${serverUrl}/api/liveclass/${id}`, {
        withCredentials: true,
      });
      toast.success("Session deleted successfully");
      fetchLiveClasses();
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(
        `${serverUrl}/api/liveclass/${id}/status`,
        { status },
        { withCredentials: true }
      );
      toast.success(`Session marked ${status}`);
      fetchLiveClasses();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const formatDate = (dateString) => {
    const parsedDate = getValidDate(dateString);
    if (!parsedDate) return "Not scheduled";
    return parsedDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shouldShowVenueFields =
    formData.deliveryMode === "offline" || formData.deliveryMode === "hybrid";

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800 sm:text-3xl">
            <FaVideo className="text-blue-600" />
            Class Sessions (Online + Offline)
          </h1>
          <button
            onClick={() => {
              resetForm();
              setEditingClass(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <FaVideo /> Create Session
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center">Loading...</div>
        ) : liveClasses.length === 0 ? (
          <div className="rounded-lg bg-white py-12 text-center shadow">
            <FaVideo className="mx-auto mb-4 text-6xl text-gray-300" />
            <p className="text-gray-500">No sessions created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveClasses.map((liveClass) => {
              if (!liveClass || typeof liveClass !== "object") {
                return null;
              }

              const deliveryMode = getDeliveryMode(liveClass);
              const offlineOnly = deliveryMode === "offline";
              const internalSession = !offlineOnly && isPortalPlatform(liveClass.platformType);
              const externalSession = !offlineOnly && isExternalPlatform(liveClass.platformType);
              const venue = liveClass.offlineDetails || {};
              const status = String(liveClass.status || "scheduled").toLowerCase();
              const enrolledCount = Array.isArray(liveClass.enrolledStudents)
                ? liveClass.enrolledStudents.length
                : 0;
              const maxParticipants = Number.isFinite(Number(liveClass.maxParticipants))
                ? Number(liveClass.maxParticipants)
                : 0;
              const liveClassTitle = String(liveClass.title || "Untitled Session");

              return (
                <div key={liveClass._id || liveClassTitle} className="rounded-lg bg-white p-5 shadow-lg">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">{liveClassTitle}</h3>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                      {status.toUpperCase()}
                    </span>
                  </div>

                  {liveClass.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-gray-600">{liveClass.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <FaCalendarAlt /> {formatDate(liveClass.scheduledDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FaClock /> {liveClass.duration} min
                    </p>
                    <p className="flex items-center gap-2">
                      <FaUsers /> {enrolledCount}/{maxParticipants} students
                    </p>
                    <p>Course: {liveClass.courseId?.title || "General Session (No course)"}</p>
                  </div>

                  <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs">
                    <span className="font-semibold">Mode:</span> {deliveryMode}
                  </div>

                  {(deliveryMode === "offline" || deliveryMode === "hybrid") && hasVenueDetails(venue) && (
                    <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                      <p className="mb-1 flex items-center gap-1 font-semibold">
                        <FaMapMarkerAlt /> Venue
                      </p>
                      {venue.centerName && <p>Center: {venue.centerName}</p>}
                      {venue.classroom && <p>Room: {venue.classroom}</p>}
                      {venue.address && <p>Address: {venue.address}</p>}
                    </div>
                  )}

                  {!offlineOnly && (
                    <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs">
                      <span className="font-semibold">Platform:</span> {getPlatformLabel(liveClass.platformType)}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {status === "scheduled" && (
                      <button
                        onClick={async () => {
                          try {
                            await handleStatusChange(liveClass._id, "live");
                            if (internalSession) {
                              setCurrentLiveClassId(liveClass._id);
                              setShowVideoPlayer(true);
                            } else if (externalSession && liveClass.meetingLink) {
                              window.open(liveClass.meetingLink, "_blank");
                            }
                          } catch {
                            toast.error("Failed to start session");
                          }
                        }}
                        className="flex-1 rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FaPlay /> {offlineOnly ? "Start Session" : "Start Now"}
                        </span>
                      </button>
                    )}

                    {status === "live" && internalSession && (
                      <button
                        onClick={() => {
                          setCurrentLiveClassId(liveClass._id);
                          setShowVideoPlayer(true);
                        }}
                        className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FaVideo /> Join
                        </span>
                      </button>
                    )}

                    {status === "live" && externalSession && liveClass.meetingLink && (
                      <a
                        href={liveClass.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded bg-blue-600 px-3 py-2 text-center text-sm text-white hover:bg-blue-700"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FaVideo /> Join Meeting
                        </span>
                      </a>
                    )}

                    {status === "live" && (
                      <button
                        onClick={() => handleStatusChange(liveClass._id, "completed")}
                        className="flex-1 rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FaStop /> End
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => handleEdit(liveClass)}
                      className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(liveClass._id)}
                      className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white">
            <div className="p-4 sm:p-6">
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                {editingClass ? "Edit Session" : "Create Session"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Delivery Mode *</label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {["online", "hybrid", "offline"].map((mode) => (
                      <label
                        key={mode}
                        className={`cursor-pointer rounded-lg border-2 p-3 ${
                          formData.deliveryMode === mode
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryMode"
                          value={mode}
                          checked={formData.deliveryMode === mode}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              deliveryMode: e.target.value,
                              platformType:
                                e.target.value === "offline"
                                  ? "offline"
                                  : prev.platformType === "offline"
                                  ? "portal"
                                  : prev.platformType,
                            }))
                          }
                          className="mr-2"
                        />
                        <span className="font-semibold capitalize">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Course *</label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, courseId: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="">Select a course</option>
                    <option value={GENERAL_COURSE_VALUE}>Others / General (No course)</option>
                    {myCourses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.deliveryMode !== "offline" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium">Platform Type *</label>
                    <select
                      value={formData.platformType}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, platformType: e.target.value }))
                      }
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="portal">Our Portal</option>
                      <option value="other">Other (Portal)</option>
                      <option value="zoom">Zoom</option>
                      <option value="google-meet">Google Meet</option>
                    </select>
                  </div>
                )}

                {shouldShowVenueFields && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <FaMapMarkerAlt /> Offline Venue
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Center Name"
                        value={formData.offlineDetails.centerName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            offlineDetails: {
                              ...prev.offlineDetails,
                              centerName: e.target.value,
                            },
                          }))
                        }
                        className="rounded-lg border px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="Room / Classroom"
                        value={formData.offlineDetails.classroom}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            offlineDetails: {
                              ...prev.offlineDetails,
                              classroom: e.target.value,
                            },
                          }))
                        }
                        className="rounded-lg border px-3 py-2"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={formData.offlineDetails.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          offlineDetails: {
                            ...prev.offlineDetails,
                            address: e.target.value,
                          },
                        }))
                      }
                      className="mt-3 w-full rounded-lg border px-3 py-2"
                    />
                  </div>
                )}

                {formData.deliveryMode !== "offline" && isExternalPlatform(formData.platformType) && (
                  <>
                    <input
                      type="url"
                      required
                      placeholder="Meeting Link"
                      value={formData.meetingLink}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, meetingLink: e.target.value }))
                      }
                      className="w-full rounded-lg border px-3 py-2"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Meeting ID"
                        value={formData.meetingId}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, meetingId: e.target.value }))
                        }
                        className="rounded-lg border px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="Meeting Password"
                        value={formData.meetingPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, meetingPassword: e.target.value }))
                        }
                        className="rounded-lg border px-3 py-2"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium">Schedule Type *</label>
                  <select
                    value={formData.scheduleType}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, scheduleType: e.target.value }))
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="scheduled">Schedule for Later</option>
                    <option value="startnow">Start Now</option>
                  </select>
                </div>

                {formData.scheduleType === "scheduled" && (
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))
                    }
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    min="15"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: Number(e.target.value) || 60,
                      }))
                    }
                    className="rounded-lg border px-3 py-2"
                    placeholder="Duration (minutes)"
                  />
                  <input
                    type="number"
                    min="1"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxParticipants: Number(e.target.value) || 100,
                      }))
                    }
                    className="rounded-lg border px-3 py-2"
                    placeholder="Max Participants"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    {editingClass ? "Update Session" : "Create Session"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingClass(null);
                      resetForm();
                    }}
                    className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showVideoPlayer && currentLiveClassId && (
        <LiveKitPlayer
          liveClassId={currentLiveClassId}
          userRole={userData?.role}
          isEducator={true}
          onClose={() => {
            setShowVideoPlayer(false);
            setCurrentLiveClassId(null);
          }}
        />
      )}
    </div>
  );
}

export default LiveClasses;
