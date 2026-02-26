/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../App";
import { FaBullhorn, FaImage, FaTrash, FaUpload } from "react-icons/fa";

const defaultContent = {
  currentOffer: {
    title: "",
    description: "",
    imageUrl: "",
    ctaLabel: "Book Demo Class",
    ctaLink: "",
    expiresAt: "",
    isActive: true,
  },
  gallery: [],
};

function MarketingManager() {
  const [content, setContent] = useState(defaultContent);
  const [offerImage, setOfferImage] = useState(null);
  const [galleryImage, setGalleryImage] = useState(null);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [savingGallery, setSavingGallery] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState("");

  const fetchMarketingContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/marketing/admin/content`, { withCredentials: true });
      const data = res.data || defaultContent;
      setContent({
        ...defaultContent,
        ...data,
        currentOffer: {
          ...defaultContent.currentOffer,
          ...(data.currentOffer || {}),
          expiresAt: data.currentOffer?.expiresAt
            ? new Date(data.currentOffer.expiresAt).toISOString().slice(0, 10)
            : "",
        },
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
      });
    } catch {
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (selectedStatus = statusFilter) => {
    try {
      const params = selectedStatus !== "all" ? { status: selectedStatus } : {};
      const res = await axios.get(`${serverUrl}/api/marketing/admin/demo-bookings`, {
        params,
        withCredentials: true,
      });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBookings([]);
    }
  };

  useEffect(() => {
    fetchMarketingContent();
    fetchBookings("all");
  }, []);

  useEffect(() => {
    fetchBookings(statusFilter);
  }, [statusFilter]);

  const bookingStats = useMemo(() => {
    return bookings.reduce(
      (acc, item) => {
        acc.total += 1;
        if (acc[item.status] !== undefined) acc[item.status] += 1;
        return acc;
      },
      { total: 0, pending: 0, contacted: 0, scheduled: 0, completed: 0, cancelled: 0 }
    );
  }, [bookings]);

  const updateOffer = async (e) => {
    e.preventDefault();
    setSavingOffer(true);
    try {
      const formData = new FormData();
      formData.append("title", content.currentOffer.title || "");
      formData.append("description", content.currentOffer.description || "");
      formData.append("ctaLabel", content.currentOffer.ctaLabel || "");
      formData.append("ctaLink", content.currentOffer.ctaLink || "");
      formData.append("expiresAt", content.currentOffer.expiresAt || "");
      formData.append("isActive", content.currentOffer.isActive ? "true" : "false");
      if (offerImage) {
        formData.append("offerImage", offerImage);
      }

      const res = await axios.put(`${serverUrl}/api/marketing/admin/content`, formData, {
        withCredentials: true,
      });
      toast.success(res.data?.message || "Offer updated");
      setOfferImage(null);
      if (res.data?.content) {
        const updated = res.data.content;
        setContent((prev) => ({
          ...prev,
          ...updated,
          currentOffer: {
            ...prev.currentOffer,
            ...(updated.currentOffer || {}),
            expiresAt: updated.currentOffer?.expiresAt
              ? new Date(updated.currentOffer.expiresAt).toISOString().slice(0, 10)
              : "",
          },
          gallery: Array.isArray(updated.gallery) ? updated.gallery : prev.gallery,
        }));
      } else {
        fetchMarketingContent();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update offer");
    } finally {
      setSavingOffer(false);
    }
  };

  const uploadGalleryImage = async (e) => {
    e.preventDefault();
    if (!galleryImage) {
      toast.error("Please choose an image");
      return;
    }
    setSavingGallery(true);
    try {
      const formData = new FormData();
      formData.append("image", galleryImage);
      formData.append("caption", galleryCaption || "");
      const res = await axios.post(`${serverUrl}/api/marketing/admin/gallery`, formData, {
        withCredentials: true,
      });
      toast.success(res.data?.message || "Gallery image added");
      setGalleryImage(null);
      setGalleryCaption("");
      if (res.data?.content) {
        setContent((prev) => ({
          ...prev,
          ...res.data.content,
          gallery: Array.isArray(res.data.content.gallery) ? res.data.content.gallery : prev.gallery,
        }));
      } else {
        fetchMarketingContent();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add gallery image");
    } finally {
      setSavingGallery(false);
    }
  };

  const updateGalleryCaption = async (itemId, caption) => {
    try {
      const res = await axios.patch(
        `${serverUrl}/api/marketing/admin/gallery/${itemId}`,
        { caption },
        { withCredentials: true }
      );
      if (res.data?.content) {
        setContent((prev) => ({
          ...prev,
          ...res.data.content,
          gallery: Array.isArray(res.data.content.gallery) ? res.data.content.gallery : prev.gallery,
        }));
      }
      toast.success("Caption updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update caption");
    }
  };

  const deleteGalleryItem = async (itemId) => {
    try {
      const res = await axios.delete(`${serverUrl}/api/marketing/admin/gallery/${itemId}`, {
        withCredentials: true,
      });
      if (res.data?.content) {
        setContent((prev) => ({
          ...prev,
          ...res.data.content,
          gallery: Array.isArray(res.data.content.gallery) ? res.data.content.gallery : prev.gallery,
        }));
      } else {
        fetchMarketingContent();
      }
      toast.success("Gallery image removed");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete image");
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    setUpdatingBooking(bookingId);
    try {
      await axios.patch(
        `${serverUrl}/api/marketing/admin/demo-bookings/${bookingId}/status`,
        { status },
        { withCredentials: true }
      );
      setBookings((prev) => prev.map((item) => (item._id === bookingId ? { ...item, status } : item)));
      toast.success("Booking status updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update booking status");
    } finally {
      setUpdatingBooking("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaBullhorn className="text-[#3B82F6]" />
          Marketing Dashboard
        </h3>
        <button
          onClick={() => {
            fetchMarketingContent();
            fetchBookings(statusFilter);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-xl hover:bg-gray-900"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading marketing details...</div>
      ) : (
        <>
          <form onSubmit={updateOffer} className="bg-white rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200 space-y-3">
            <h4 className="text-lg font-semibold">Current Offer</h4>
            <input
              type="text"
              value={content.currentOffer.title}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  currentOffer: { ...prev.currentOffer, title: e.target.value },
                }))
              }
              placeholder="Offer title"
              className="w-full border rounded-lg px-3 py-2"
            />
            <textarea
              value={content.currentOffer.description}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  currentOffer: { ...prev.currentOffer, description: e.target.value },
                }))
              }
              placeholder="Offer description"
              className="w-full border rounded-lg px-3 py-2 min-h-[90px]"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={content.currentOffer.ctaLabel}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    currentOffer: { ...prev.currentOffer, ctaLabel: e.target.value },
                  }))
                }
                placeholder="CTA label (e.g. Book Demo Class)"
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="url"
                value={content.currentOffer.ctaLink}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    currentOffer: { ...prev.currentOffer, ctaLink: e.target.value },
                  }))
                }
                placeholder="CTA link (optional)"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="date"
                value={content.currentOffer.expiresAt || ""}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    currentOffer: { ...prev.currentOffer, expiresAt: e.target.value },
                  }))
                }
                className="w-full border rounded-lg px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={content.currentOffer.isActive !== false}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      currentOffer: { ...prev.currentOffer, isActive: e.target.checked },
                    }))
                  }
                />
                Offer is active
              </label>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input type="file" accept="image/*" onChange={(e) => setOfferImage(e.target.files?.[0] || null)} />
              <button
                type="submit"
                disabled={savingOffer}
                className="px-4 py-2 bg-[#3B82F6] text-black font-semibold rounded-lg hover:bg-[#2563EB] disabled:opacity-60"
              >
                {savingOffer ? "Saving..." : "Save Offer"}
              </button>
            </div>
            {content.currentOffer.imageUrl && (
              <img
                src={content.currentOffer.imageUrl}
                alt="Current offer"
                className="w-full sm:w-80 h-44 object-cover rounded-lg border"
              />
            )}
          </form>

          <form onSubmit={uploadGalleryImage} className="bg-white rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200 space-y-3">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <FaImage className="text-[#3B82F6]" />
              Gallery Management
            </h4>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setGalleryImage(e.target.files?.[0] || null)}
              required
            />
            <input
              type="text"
              value={galleryCaption}
              onChange={(e) => setGalleryCaption(e.target.value)}
              placeholder="Image caption"
              className="w-full border rounded-lg px-3 py-2"
            />
            <button
              type="submit"
              disabled={savingGallery}
              className="px-4 py-2 bg-black text-[#3B82F6] font-semibold rounded-lg hover:bg-gray-900 disabled:opacity-60 flex items-center gap-2"
            >
              <FaUpload /> {savingGallery ? "Uploading..." : "Add to Gallery"}
            </button>

            {content.gallery.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {content.gallery.map((item) => (
                  <div key={item._id} className="border rounded-lg overflow-hidden">
                    <img src={item.imageUrl} alt={item.caption || "Gallery"} className="w-full h-40 object-cover" />
                    <div className="p-3 space-y-2">
                      <input
                        type="text"
                        defaultValue={item.caption || ""}
                        onBlur={(e) => {
                          const nextCaption = e.target.value.trim();
                          if (nextCaption !== (item.caption || "")) {
                            updateGalleryCaption(item._id, nextCaption);
                          }
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => deleteGalleryItem(item._id)}
                        className="w-full px-3 py-1.5 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 text-sm flex items-center justify-center gap-2"
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h4 className="text-lg font-semibold">Demo Class Bookings</h4>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                Total: <span className="font-semibold">{bookingStats.total}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                Pending: <span className="font-semibold">{bookingStats.pending}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                Scheduled: <span className="font-semibold">{bookingStats.scheduled}</span>
              </span>
            </div>

            {bookings.length === 0 ? (
              <p className="text-gray-500">No demo bookings found.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900">{booking.name}</p>
                          <p className="text-xs text-gray-500">{booking.className || "-"}</p>
                        </div>
                        <select
                          value={booking.status}
                          disabled={updatingBooking === booking._id}
                          onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <p className="text-sm text-gray-700">{booking.phone}</p>
                      <p className="text-xs text-gray-500 break-all">{booking.email || "-"}</p>
                      <p className="text-xs text-gray-600">
                        Preferred: {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : "-"}
                      </p>
                      <p className="text-sm text-gray-700 break-words">{booking.message || "-"}</p>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2">Name</th>
                        <th className="text-left px-3 py-2">Contact</th>
                        <th className="text-left px-3 py-2">Class</th>
                        <th className="text-left px-3 py-2">Preferred Date</th>
                        <th className="text-left px-3 py-2">Message</th>
                        <th className="text-left px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="border-t">
                          <td className="px-3 py-2 font-medium">{booking.name}</td>
                          <td className="px-3 py-2">
                            <div>{booking.phone}</div>
                            <div className="text-xs text-gray-500 break-all">{booking.email || "-"}</div>
                          </td>
                          <td className="px-3 py-2">{booking.className || "-"}</td>
                          <td className="px-3 py-2">
                            {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-3 py-2 max-w-[220px] truncate">{booking.message || "-"}</td>
                          <td className="px-3 py-2">
                            <select
                              value={booking.status}
                              disabled={updatingBooking === booking._id}
                              onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                              className="px-2 py-1 border rounded"
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MarketingManager;
