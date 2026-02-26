import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { FaCertificate, FaDownload, FaQrcode, FaCheckCircle, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function MyCertificates() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    if (userData) {
      fetchCertificates();
    }
  }, [userData]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/cert/my-certificates`, {
        withCredentials: true
      });
      setCertificates(res.data.certificates || []);
    } catch {
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (cert) => {
    const courseId = cert.courseId?._id || cert.courseId;
    const certificateId = cert.certificateId;
    
    if (!courseId) {
      toast.error("Course information not available");
      return;
    }

    setDownloading(prev => ({ ...prev, [courseId]: true }));
    try {
      const response = await axios.get(
        `${serverUrl}/api/cert/generate/${courseId}`,
        {
          responseType: "blob",
          withCredentials: true
        }
      );

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificateId || "certificate"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Download certificate error:", error);
      toast.error(error.response?.data?.message || "Failed to download certificate");
    } finally {
      setDownloading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const viewVerification = (certificateId) => {
    navigate(`/certificate/verify/${certificateId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-6 mb-6 border-2 border-[#3B82F6]">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3B82F6] mb-2 flex items-center gap-3">
            <FaCertificate className="text-4xl" />
            My Certificates
          </h1>
          <p className="text-white text-sm md:text-base">
            View and download your course completion certificates
          </p>
        </div>

        {/* Certificates List */}
        {certificates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <FaCertificate className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Certificates Yet</h2>
            <p className="text-gray-600 mb-6">
              Complete courses to earn certificates. Certificates are automatically generated when you complete a course.
            </p>
            <button
              onClick={() => navigate("/enrolledcourses")}
              className="px-6 py-3 bg-black text-[#3B82F6] font-bold rounded-xl hover:bg-gray-900 transition-all"
            >
              View My Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.certificateId}
                className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200 hover:border-[#3B82F6] transition-all hover:shadow-2xl"
              >
                {/* Certificate Icon */}
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#3B82F6] to-blue-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <FaCertificate className="text-4xl text-black" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                    {cert.courseTitle}
                  </h3>
                </div>

                {/* Certificate Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <FaQrcode className="text-[#3B82F6]" />
                    <span className="font-mono text-gray-700">{cert.certificateId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCheckCircle className="text-green-500" />
                    <span>
                      Issued: {new Date(cert.issuedOn).toLocaleDateString()}
                    </span>
                  </div>
                  {cert.verificationCount > 0 && (
                    <div className="text-xs text-gray-500">
                      Verified {cert.verificationCount} time(s)
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadCertificate(cert)}
                    disabled={downloading[cert.courseId?._id || cert.courseId]}
                    className="flex-1 px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {downloading[cert.courseId?._id || cert.courseId] ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FaDownload />
                        Download
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => viewVerification(cert.certificateId)}
                    className="px-4 py-2 bg-[#3B82F6] text-black font-semibold rounded-lg hover:bg-[#2563EB] transition-all flex items-center justify-center gap-2"
                  >
                    <FaQrcode />
                    Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCertificates;

