import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import {
  FaBook,
  FaCalendarAlt,
  FaCertificate,
  FaCheckCircle,
  FaEnvelope,
  FaExternalLinkAlt,
  FaGlobe,
  FaIdBadge,
  FaQrcode,
  FaShareAlt,
  FaShieldAlt,
  FaTimesCircle,
  FaUser,
} from "react-icons/fa";
import logo from "../assets/logo.jpg";

const ORGANISATION = {
  name: "Learnify Education",
  website: "https://learnifyedu.store",
  email: "support@learnifyedu.store",
  social: "@learnifyedu",
};

const formatDisplayDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Not Available";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const buildVerificationLink = (certificateId) => {
  if (!certificateId || typeof window === "undefined") return "";

  const normalizedId = String(certificateId).trim().toUpperCase();
  const path = `/certificate/verify/${normalizedId}`;
  const routerMode = String(import.meta.env.VITE_ROUTER_MODE || "").toLowerCase();
  const shouldUseHashRouter = routerMode === "hash" || window.location.hash.startsWith("#/");

  return shouldUseHashRouter
    ? `${window.location.origin}/#${path}`
    : `${window.location.origin}${path}`;
};

const deriveEnrollmentId = (certificateId) => {
  const token = String(certificateId || "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(-8);

  return token ? `ENR-${token}` : "Not Assigned";
};

function VerifyCertificate() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState(certificateId || "");
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  const verificationLink = useMemo(
    () => buildVerificationLink(certificate?.certificateId),
    [certificate?.certificateId]
  );

  const courseHours = useMemo(() => {
    const matchedHours = String(certificate?.courseDescription || "").match(
      /(\d+)\s*(?:\+)?\s*(?:hours?|hrs?)/i
    );
    return matchedHours?.[1] ? `${matchedHours[1]} Hours` : "As per curriculum";
  }, [certificate?.courseDescription]);

  const qrCodeUrl = verificationLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(verificationLink)}`
    : "";

  useEffect(() => {
    if (certificateId) {
      verifyCertificate(certificateId);
    } else {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    setQrLoadFailed(false);
  }, [certificate?.certificateId]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border border-blue-500/40 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
            <img
              src={logo}
              alt="Learnify Logo"
              className="w-14 h-14 rounded-xl border-2 border-blue-300 object-cover shadow-lg"
            />
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
                  placeholder="Enter Certificate ID"
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
                Enter the certificate ID shown on your PDF certificate.
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
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl shadow-xl p-6 text-white text-center">
              <FaCheckCircle className="text-5xl mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Certificate Verified!</h2>
              <p className="text-lg">This certificate is authentic and valid</p>
            </div>

            {/* Certificate Preview */}
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-200">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-100 opacity-60" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-slate-100 opacity-80" />

              <div className="relative p-5 md:p-8 space-y-5">
                <div className="bg-slate-950 rounded-2xl text-white p-5 md:p-6">
                  <div className="flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={logo}
                        alt="Organisation Logo"
                        className="w-16 h-16 rounded-xl border border-blue-300 object-cover shadow-lg"
                      />
                      <div>
                        <p className="text-lg md:text-xl font-semibold text-blue-200">{ORGANISATION.name}</p>
                        <p className="text-xs md:text-sm text-blue-100">Official Online Learning Organisation</p>
                      </div>
                    </div>
                    <div className="text-left md:text-right text-sm text-slate-200">
                      <p>
                        <span className="text-blue-200 font-semibold">Issued On:</span>{" "}
                        {formatDisplayDate(certificate.issuedOn)}
                      </p>
                      <p className="mt-1">
                        <span className="text-blue-200 font-semibold">Certificate No:</span>{" "}
                        {`CERT-${certificate.certificateId}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-1">
                  <p className="text-sm md:text-base text-slate-600">Certificate of Completion</p>
                  <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1 mb-2">This is to certify that</h3>
                  <p className="text-2xl md:text-3xl text-blue-700 font-bold tracking-wide uppercase">
                    {certificate.studentName}
                  </p>
                  <p className="text-slate-600 mt-3 max-w-3xl mx-auto text-sm md:text-base">
                    has successfully completed the online course{" "}
                    <span className="font-semibold text-slate-900">{certificate.courseTitle}</span> conducted by{" "}
                    <span className="font-semibold text-slate-900">{ORGANISATION.name}</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-5">
                    <p className="text-xs font-semibold tracking-wide text-blue-700 mb-3">
                      ORGANISATION DETAILS
                    </p>
                    <div className="space-y-2 text-sm md:text-[15px] text-slate-700">
                      <p className="flex items-center gap-2">
                        <FaCertificate className="text-blue-600" />
                        <span>{ORGANISATION.name}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaGlobe className="text-blue-600" />
                        <a href={ORGANISATION.website} className="text-blue-700 hover:underline" target="_blank" rel="noreferrer">
                          {ORGANISATION.website}
                        </a>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaEnvelope className="text-blue-600" />
                        <span>{ORGANISATION.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaShareAlt className="text-blue-600" />
                        <span>{ORGANISATION.social}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-5">
                    <p className="text-xs font-semibold tracking-wide text-blue-700 mb-3">
                      CERTIFICATE HOLDER DETAILS
                    </p>
                    <div className="space-y-2 text-sm md:text-[15px] text-slate-700">
                      <p className="flex items-center gap-2">
                        <FaUser className="text-blue-600" />
                        <span>Full Name: {certificate.studentName}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaIdBadge className="text-blue-600" />
                        <span>Enrollment ID: {deriveEnrollmentId(certificate.certificateId)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaEnvelope className="text-blue-600" />
                        <span>Email: {certificate.studentEmail || "Not provided"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 md:p-5">
                    <p className="text-xs font-semibold tracking-wide text-blue-700 mb-3">PROGRAM DETAILS</p>
                    <div className="space-y-2 text-sm md:text-[15px] text-slate-700">
                      <p className="flex items-center gap-2">
                        <FaBook className="text-blue-600" />
                        <span>Course: {certificate.courseTitle}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaShieldAlt className="text-blue-600" />
                        <span>Mode: Online / Virtual</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-600" />
                        <span>Duration: Flexible (Optional)</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-600" />
                        <span>Total Hours: {courseHours}</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 md:p-5">
                    <p className="text-xs font-semibold tracking-wide text-blue-700 mb-3">VERIFICATION DETAILS</p>
                    <div className="space-y-2 text-sm md:text-[15px] text-slate-700">
                      <p className="flex items-center gap-2">
                        <FaQrcode className="text-blue-600" />
                        <span>Certificate ID: {certificate.certificateId}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaQrcode className="text-blue-600" />
                        <span>Certificate Number: {`CERT-${certificate.certificateId}`}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaShieldAlt className="text-blue-600" />
                        <span>Verified {certificate.verificationCount || 0} time(s)</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <FaExternalLinkAlt className="text-blue-600 mt-1" />
                        <a
                          href={verificationLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 break-all hover:underline"
                        >
                          {verificationLink}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold tracking-wide text-blue-700 mb-2">
                      AUTHORISATION
                    </p>
                    <div className="flex flex-wrap gap-6">
                      <div className="min-w-[140px]">
                        <div className="w-full border-b border-slate-400 mb-2" />
                        <p className="text-lg text-slate-800 italic">Nitin</p>
                        <p className="text-xs text-slate-500">Administrator</p>
                      </div>
                      <div className="min-w-[170px]">
                        <div className="w-full border-b border-slate-400 mb-2" />
                        <p className="text-lg text-slate-800 italic">Himanshu Sagar</p>
                        <p className="text-xs text-slate-500">Administrator</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-28 h-28 md:w-32 md:h-32 bg-white rounded-2xl border border-slate-300 p-2 flex items-center justify-center shadow-sm">
                      {!qrLoadFailed && qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Verification QR Code"
                          className="w-full h-full object-contain"
                          onError={() => setQrLoadFailed(true)}
                        />
                      ) : (
                        <FaQrcode className="text-5xl text-blue-600" />
                      )}
                    </div>
                    <div className="w-24 h-24 rounded-full border-4 border-blue-200 bg-blue-100 text-blue-700 flex items-center justify-center text-center text-[10px] font-bold leading-4">
                      DIGITAL
                      <br />
                      SEAL
                      <br />
                      VERIFIED
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-300">
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



