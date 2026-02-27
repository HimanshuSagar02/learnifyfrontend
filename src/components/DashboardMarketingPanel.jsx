import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
import { FaBullhorn, FaCalendarAlt, FaImage, FaPhoneAlt } from "react-icons/fa";

const defaultContent = {
  currentOffer: {
    title: "",
    description: "",
    imageUrl: "",
    ctaLabel: "Book Demo Session",
    ctaLink: "",
    expiresAt: null,
    isActive: true,
  },
  gallery: [],
};

function DashboardMarketingPanel({ userData }) {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: userData?.name || "",
    email: userData?.email || "",
    phone: "",
    className: userData?.class || "",
    preferredDate: "",
    message: "",
  });

  useEffect(() => {
    setBookingForm((prev) => ({
      ...prev,
      name: userData?.name || prev.name,
      email: userData?.email || prev.email,
      className: userData?.class || prev.className,
    }));
  }, [userData]);

  const fetchMarketingContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/marketing/public`, { withCredentials: true });
      setContent({
        ...defaultContent,
        ...(res.data || {}),
        currentOffer: {
          ...defaultContent.currentOffer,
          ...(res.data?.currentOffer || {}),
        },
        gallery: Array.isArray(res.data?.gallery) ? res.data.gallery : [],
      });
    } catch {
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingContent();
  }, []);

  const hasActiveOffer = useMemo(() => {
    const offer = content.currentOffer || {};
    return offer.isActive !== false && (offer.title || offer.description || offer.imageUrl);
  }, [content.currentOffer]);

  const handleBookDemo = async (e) => {
    e.preventDefault();
    if (!bookingForm.name.trim() || !bookingForm.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    setBookingLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/marketing/demo-booking`,
        {
          ...bookingForm,
          name: bookingForm.name.trim(),
          email: bookingForm.email.trim(),
          phone: bookingForm.phone.trim(),
          className: bookingForm.className.trim(),
          message: bookingForm.message.trim(),
        },
        { withCredentials: true }
      );
      toast.success("Demo session request submitted");
      setBookingForm((prev) => ({
        ...prev,
        phone: "",
        preferredDate: "",
        message: "",
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit demo booking");
    } finally {
      setBookingLoading(false);
    }
  };

  const bookingCard = (
    <form
      onSubmit={handleBookDemo}
      className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-200 shadow-md space-y-3"
    >
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
        <FaCalendarAlt className="text-[#3B82F6]" />
        Book Demo Session
      </h3>
      <input
        type="text"
        value={bookingForm.name}
        onChange={(e) => setBookingForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder="Your name"
        className="w-full border rounded-lg px-3 py-2"
        required
      />
      <input
        type="email"
        value={bookingForm.email}
        onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
        className="w-full border rounded-lg px-3 py-2"
      />
      <input
        type="tel"
        value={bookingForm.phone}
        onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
        placeholder="Phone number"
        className="w-full border rounded-lg px-3 py-2"
        required
      />
      <input
        type="text"
        value={bookingForm.className}
        onChange={(e) => setBookingForm((prev) => ({ ...prev, className: e.target.value }))}
        placeholder="Branch (e.g. CSE)"
        className="w-full border rounded-lg px-3 py-2"
      />
      <input
        type="date"
        value={bookingForm.preferredDate}
        onChange={(e) => setBookingForm((prev) => ({ ...prev, preferredDate: e.target.value }))}
        className="w-full border rounded-lg px-3 py-2"
      />
      <textarea
        value={bookingForm.message}
        onChange={(e) => setBookingForm((prev) => ({ ...prev, message: e.target.value }))}
        placeholder="Message (optional)"
        className="w-full border rounded-lg px-3 py-2 min-h-[88px]"
      />
      <button
        type="submit"
        disabled={bookingLoading}
        className="w-full bg-[#3B82F6] text-black font-bold py-2.5 rounded-xl hover:bg-[#2563EB] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <FaPhoneAlt /> {bookingLoading ? "Submitting..." : content.currentOffer.ctaLabel || "Book Demo Session"}
      </button>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FaBullhorn className="text-[#3B82F6]" />
            Current Offers & Demo Sessions
          </h2>
        <button
          onClick={fetchMarketingContent}
          className="w-full sm:w-auto px-4 py-2 bg-black text-[#3B82F6] rounded-xl font-semibold hover:bg-gray-900"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading offer details...</div>
      ) : (
        <>
          {hasActiveOffer ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-2xl p-4 sm:p-6 text-white border-2 border-[#3B82F6]">
                <p className="text-xs uppercase tracking-widest text-[#3B82F6] mb-2">Current Offer</p>
                <h3 className="text-xl sm:text-2xl font-bold text-[#3B82F6]">
                  {content.currentOffer.title || "Special Offer"}
                </h3>
                  <p className="mt-3 text-gray-200">
                  {content.currentOffer.description || "Book your demo session and get personalized guidance."}
                  </p>
                {content.currentOffer.expiresAt && (
                  <p className="mt-3 text-sm text-[#3B82F6]">
                    Valid till: {new Date(content.currentOffer.expiresAt).toLocaleDateString()}
                  </p>
                )}
                {content.currentOffer.imageUrl && (
                  <img
                    src={content.currentOffer.imageUrl}
                    alt={content.currentOffer.title || "Offer"}
                    className="mt-4 w-full h-44 sm:h-52 object-cover rounded-xl border border-[#3B82F6]/40"
                  />
                )}
              </div>
              {bookingCard}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr,1.2fr]">
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-5 sm:p-8 text-center text-gray-500 flex items-center justify-center">
                No active offer right now. You can still book a demo session below.
                </div>
              {bookingCard}
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-200 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaImage className="text-[#3B82F6]" />
              Gallery
            </h3>
            {Array.isArray(content.gallery) && content.gallery.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.gallery.map((item) => (
                  <div key={item._id} className="border rounded-xl overflow-hidden bg-gray-50">
                    <img src={item.imageUrl} alt={item.caption || "Gallery"} className="w-full h-44 object-cover" />
                    <div className="p-3 text-sm text-gray-700 break-words">{item.caption || "Campus moment"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Gallery is empty right now.</p>
            )}
          </div>

        </>
      )}
    </div>
  );
}

export default DashboardMarketingPanel;
