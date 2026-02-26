import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaQrcode, FaCertificate, FaUser, FaBook, FaCalendarAlt, FaShieldAlt } from "react-icons/fa";

function VerifyCertificate() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState(certificateId || "");

  useEffect(() => {
    if (certificateId) {
      verifyCertificate(certificateId);
    } else {
      setLoading(false);
    }
  }, [certificateId]);

  const verifyCertificate = async (id) => {
    if (!id || !id.trim()) {
      setError("Please enter a certificate ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCertificate(null);

    try {
      console.log("[VerifyCertificate] Verifying certificate ID:", id);
      const response = await axios.get(`${serverUrl}/api/cert/verify/${id.trim().toUpperCase()}`);
      
      if (response.data.valid) {
        setCertificate(response.data.certificate);
        toast.success("Certificate verified successfully!");
      } else {
        setError(response.data.message || "Certificate is invalid");
        toast.error("Certificate verification failed");
      }
    } catch (err) {
      console.error("[VerifyCertificate] Error:", err);
      const errorMessage = err.response?.data?.message || "Failed to verify certificate";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/certificate/verify/${searchId.trim().toUpperCase()}`);
      verifyCertificate(searchId.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border-2 border-[#3B82F6] text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaShieldAlt className="text-4xl md:text-5xl text-[#3B82F6]" />
            <h1 className="text-3xl md:text-4xl font-bold text-[#3B82F6]">
              Certificate Verification
            </h1>
          </div>
          <p className="text-white text-sm md:text-base">
            Verify the authenticity of Learnify certificates using Certificate ID or QR Code
          </p>
        </div>

        {/* Search Form */}
        {!certificateId && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 border-2 border-gray-200">
            <form onSubmit={handleSearch} className="space-y-4">
              <label className="block text-lg font-semibold text-gray-800 mb-2">
                Enter Certificate ID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  placeholder="Learnify-YYYYMMDD-XXXXXX"
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-colors text-gray-900 font-mono"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-[#3B82F6] font-bold rounded-xl hover:bg-gray-900 transition-all shadow-lg flex items-center gap-2"
                >
                  <FaQrcode /> Verify
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Enter the Certificate ID found on the certificate (e.g., Learnify-20241215-ABC123)
              </p>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Verifying certificate...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && !certificate && (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border-2 border-red-200">
            <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <p className="text-sm text-red-800 font-semibold mb-2">Possible reasons:</p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>Certificate ID is incorrect or misspelled</li>
                <li>Certificate has been revoked or deactivated</li>
                <li>Certificate does not exist in our system</li>
              </ul>
            </div>
            {certificateId && (
              <button
                onClick={() => navigate("/certificate/verify")}
                className="mt-6 px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all"
              >
                Verify Another Certificate
              </button>
            )}
          </div>
        )}

        {/* Valid Certificate */}
        {!loading && certificate && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white text-center">
              <FaCheckCircle className="text-5xl mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Certificate Verified!</h2>
              <p className="text-lg">This certificate is authentic and valid</p>
            </div>

            {/* Certificate Details */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-[#3B82F6]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200">
                <FaCertificate className="text-3xl text-[#3B82F6]" />
                <h3 className="text-2xl font-bold text-gray-800">Certificate Details</h3>
              </div>

              <div className="space-y-4">
                {/* Certificate ID */}
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaQrcode className="text-[#3B82F6]" />
                    <span className="font-semibold text-gray-700">Certificate ID</span>
                  </div>
                  <p className="text-xl font-mono font-bold text-gray-900">{certificate.certificateId}</p>
                </div>

                {/* Student Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUser className="text-blue-600" />
                      <span className="font-semibold text-gray-700">Student Name</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{certificate.studentName}</p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBook className="text-purple-600" />
                      <span className="font-semibold text-gray-700">Course</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{certificate.courseTitle}</p>
                  </div>
                </div>

                {/* Issue Date */}
                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCalendarAlt className="text-green-600" />
                    <span className="font-semibold text-gray-700">Issued On</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(certificate.issuedOn).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Verification Info */}
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Verification Status</p>
                      <p className="text-sm text-gray-600">
                        Verified {certificate.verificationCount || 0} time(s)
                      </p>
                    </div>
                    <FaShieldAlt className="text-3xl text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-300">
              <p className="text-sm text-gray-700 text-center">
                <strong>Security Notice:</strong> This certificate has been verified through our secure server validation system. 
                All certificate data is stored securely and cannot be tampered with.
              </p>
            </div>

            {/* Verify Another Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  navigate("/certificate/verify");
                  setCertificate(null);
                  setSearchId("");
                }}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all"
              >
                Verify Another Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyCertificate;



