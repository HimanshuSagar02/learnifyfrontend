import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../../App";
import {
  FaUsers,
  FaCommentDots,
  FaCog,
  FaMoneyBillWave,
  FaSearch,
  FaFilter,
  FaUserPlus,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserShield,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaKey,
  FaSyncAlt,
} from "react-icons/fa";

const PAGE_SIZE = 10;

function AdminUsers() {
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [filters, setFilters] = useState({ role: "", status: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [passwordSavingId, setPasswordSavingId] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    status: "approved",
    class: "",
    subject: "",
  });

  const [passwordUpdates, setPasswordUpdates] = useState({});
  const [editingPassword, setEditingPassword] = useState(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${serverUrl}/api/admin/users`, {
        params: { role: filters.role, status: filters.status },
        withCredentials: true,
      });

      const userList = Array.isArray(res.data?.users)
        ? res.data.users
        : Array.isArray(res.data)
          ? res.data
          : [];

      setAllUsers(userList);
    } catch (error) {
      setAllUsers([]);
      toast.error(error?.response?.data?.message || "Failed to fetch users");

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setTimeout(() => navigate("/login"), 1200);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, filters.status]);

  const filteredUsers = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return allUsers;

    return allUsers.filter((u) => {
      const haystack = [
        u?.name,
        u?.email,
        u?.role,
        u?.status,
        u?.class,
        u?.subject,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [allUsers, searchTerm]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(Math.ceil(totalUsers / PAGE_SIZE), 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const stats = useMemo(() => {
    const base = {
      total: allUsers.length,
      student: 0,
      educator: 0,
      admin: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    allUsers.forEach((u) => {
      if (u?.role === "student") base.student += 1;
      if (u?.role === "educator") base.educator += 1;
      if (u?.role === "admin") base.admin += 1;

      if (u?.status === "approved") base.approved += 1;
      if (u?.status === "pending") base.pending += 1;
      if (u?.status === "rejected") base.rejected += 1;
    });

    return base;
  }, [allUsers]);

  const resetCreateForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "student",
      status: "approved",
      class: "",
      subject: "",
    });
  };

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email and password are required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setCreatingUser(true);
    try {
      await axios.post(`${serverUrl}/api/admin/users`, form, { withCredentials: true });
      toast.success("User created successfully");
      resetCreateForm();
      setCurrentPage(1);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Create user failed");
    } finally {
      setCreatingUser(false);
    }
  };

  const updateStatus = async (id, status) => {
    setStatusUpdatingId(id);
    try {
      await axios.patch(
        `${serverUrl}/api/admin/users/${id}/status`,
        { status },
        { withCredentials: true }
      );
      toast.success("Status updated");
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Status update failed");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const updatePassword = async (userId) => {
    const newPassword = passwordUpdates[userId];
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setPasswordSavingId(userId);
    try {
      await axios.patch(
        `${serverUrl}/api/admin/users/${userId}/password`,
        { password: newPassword },
        { withCredentials: true }
      );
      toast.success("Password updated");
      setPasswordUpdates((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setEditingPassword(null);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordSavingId("");
    }
  };

  const clearFilters = () => {
    setFilters({ role: "", status: "" });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
  };

  const startUserIndex = totalUsers === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endUserIndex = totalUsers === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalUsers);

  const rolePillClass = (role) => {
    if (role === "admin") return "bg-violet-100 text-violet-800";
    if (role === "educator") return "bg-blue-100 text-blue-800";
    return "bg-emerald-100 text-emerald-800";
  };

  const statusPillClass = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700";
    if (status === "pending") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border-2 border-[#3B82F6] bg-gradient-to-r from-black via-gray-900 to-black p-6 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-[#3B82F6]">
                <FaUsers /> User Management
              </h1>
              <p className="text-sm text-blue-100 md:text-base">
                Create users, update access status, and manage password resets from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/admin/fees")}
                className="rounded-lg bg-[#3B82F6] px-4 py-2 font-semibold text-black transition hover:bg-[#2563EB] hover:text-white"
              >
                <span className="flex items-center gap-2"><FaMoneyBillWave /> Fees</span>
              </button>
              <button
                onClick={() => navigate("/admin/portal")}
                className="rounded-lg bg-[#3B82F6] px-4 py-2 font-semibold text-black transition hover:bg-[#2563EB] hover:text-white"
              >
                <span className="flex items-center gap-2"><FaCog /> Portal</span>
              </button>
              <button
                onClick={() => navigate("/admin/feedback")}
                className="rounded-lg bg-[#3B82F6] px-4 py-2 font-semibold text-black transition hover:bg-[#2563EB] hover:text-white"
              >
                <span className="flex items-center gap-2"><FaCommentDots /> Feedback</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Users</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-gray-900">
              <FaUsers className="text-[#3B82F6]" /> {stats.total}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role Split</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <FaUserGraduate className="text-emerald-600" /> {stats.student} students
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <FaChalkboardTeacher className="text-blue-600" /> {stats.educator} educators
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <FaUserShield className="text-violet-600" /> {stats.admin} admins
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Approval Health</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <FaCheckCircle className="text-green-600" /> {stats.approved} approved
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <FaClock className="text-amber-600" /> {stats.pending} pending
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <FaTimesCircle className="text-red-600" /> {stats.rejected} rejected
            </p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current View</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{totalUsers}</p>
            <p className="text-xs text-gray-500">matching current filters/search</p>
            <button
              type="button"
              onClick={fetchUsers}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <FaSyncAlt /> Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="rounded-2xl border bg-white p-5 shadow-lg">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                <FaUserPlus className="text-[#3B82F6]" /> Create User
              </h2>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  createUser();
                }}
              >
                <input
                  className="w-full rounded-lg border px-3 py-2 text-black outline-none ring-[#3B82F6] focus:ring-2"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  autoComplete="name"
                  required
                />
                <input
                  className="w-full rounded-lg border px-3 py-2 text-black outline-none ring-[#3B82F6] focus:ring-2"
                  placeholder="Email address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  autoComplete="email"
                  required
                />
                <input
                  className="w-full rounded-lg border px-3 py-2 text-black outline-none ring-[#3B82F6] focus:ring-2"
                  placeholder="Password (min 8 chars)"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-black outline-none ring-[#3B82F6] focus:ring-2"
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  >
                    <option value="student">Student</option>
                    <option value="educator">Educator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-black outline-none ring-[#3B82F6] focus:ring-2"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-black outline-none ring-[#3B82F6] focus:ring-2"
                    placeholder="Class (optional)"
                    value={form.class}
                    onChange={(e) => setForm((p) => ({ ...p, class: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-black outline-none ring-[#3B82F6] focus:ring-2"
                    placeholder="Subject (optional)"
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-[#3B82F6] transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingUser ? "Creating..." : "Create User"}
                  </button>
                  <button
                    type="button"
                    onClick={resetCreateForm}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-2xl border bg-white p-5 shadow-lg">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-900">User Directory</h2>
                <p className="text-xs text-gray-500">
                  Showing {startUserIndex}-{endUserIndex} of {totalUsers}
                </p>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm text-black outline-none ring-[#3B82F6] focus:ring-2"
                    placeholder="Search by name, email, role..."
                    value={searchTerm}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setSearchTerm(e.target.value);
                    }}
                  />
                </div>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm text-black outline-none ring-[#3B82F6] focus:ring-2"
                  value={filters.role}
                  onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="">All roles</option>
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex gap-2">
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-sm text-black outline-none ring-[#3B82F6] focus:ring-2"
                    value={filters.status}
                    onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="">All status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <FaFilter /> Clear
                  </button>
                </div>
              </div>

              {loadingUsers && (
                <div className="py-12 text-center text-sm text-gray-500">Loading users...</div>
              )}

              {!loadingUsers && pagedUsers.length === 0 && (
                <div className="rounded-xl border border-dashed py-12 text-center text-sm text-gray-500">
                  No users found for current filters.
                </div>
              )}

              {!loadingUsers && pagedUsers.length > 0 && (
                <div className="space-y-3">
                  {pagedUsers.map((u) => (
                    <div key={u._id} className="rounded-xl border p-4 transition hover:border-[#3B82F6] hover:shadow-md">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-bold text-gray-900">{u.name || "Unnamed user"}</p>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${rolePillClass(u.role)}`}>
                              {u.role}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusPillClass(u.status)}`}>
                              {u.status}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-gray-600">{u.email}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                            {u.class ? <span>Class: {u.class}</span> : null}
                            {u.subject ? <span>Subject: {u.subject}</span> : null}
                            <span>Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</span>
                          </div>

                          {editingPassword === u._id ? (
                            <form
                              className="mt-3 space-y-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                updatePassword(u._id);
                              }}
                            >
                              <input
                                type="password"
                                className="w-full rounded-lg border px-3 py-2 text-sm text-black outline-none ring-[#3B82F6] focus:ring-2"
                                placeholder="New password (minimum 8 characters)"
                                value={passwordUpdates[u._id] || ""}
                                autoComplete="new-password"
                                onChange={(e) =>
                                  setPasswordUpdates((prev) => ({ ...prev, [u._id]: e.target.value }))
                                }
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={passwordSavingId === u._id}
                                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                                >
                                  {passwordSavingId === u._id ? "Saving..." : "Save Password"}
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-300"
                                  onClick={() => {
                                    setEditingPassword(null);
                                    setPasswordUpdates((prev) => {
                                      const copy = { ...prev };
                                      delete copy[u._id];
                                      return copy;
                                    });
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:underline"
                              onClick={() => setEditingPassword(u._id)}
                            >
                              <FaKey /> Update Password
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                            onClick={() => updateStatus(u._id, "approved")}
                            disabled={u.status === "approved" || statusUpdatingId === u._id}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                            onClick={() => updateStatus(u._id, "pending")}
                            disabled={u.status === "pending" || statusUpdatingId === u._id}
                          >
                            Pending
                          </button>
                          <button
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            onClick={() => updateStatus(u._id, "rejected")}
                            disabled={u.status === "rejected" || statusUpdatingId === u._id}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;

