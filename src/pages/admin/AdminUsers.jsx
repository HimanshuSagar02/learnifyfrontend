import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../../App";
import { FaUsers, FaCommentDots, FaCog, FaMoneyBillWave } from "react-icons/fa";

function AdminUsers() {
  const navigate = useNavigate();
  const pageSize = 10;
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: "", status: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    status: "approved",
  });
  const [passwordUpdates, setPasswordUpdates] = useState({});
  const [editingPassword, setEditingPassword] = useState(null);

  const fetchUsers = async (targetPage = currentPage) => {
    try {
      const res = await axios.get(`${serverUrl}/api/admin/users`, {
        params: { ...filters, page: targetPage, limit: pageSize },
        withCredentials: true,
      });

      if (Array.isArray(res.data)) {
        setUsers(res.data || []);
        setTotalUsers(res.data?.length || 0);
        setTotalPages(Math.max(Math.ceil((res.data?.length || 0) / pageSize), 1));
        return;
      }

      const userList = Array.isArray(res.data?.users) ? res.data.users : [];
      const pagination = res.data?.pagination || {};
      setUsers(userList);
      setTotalUsers(pagination.totalUsers || 0);
      setTotalPages(Math.max(pagination.totalPages || 1, 1));
    } catch (error) {
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);

      // If unauthorized or forbidden, redirect to login
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, filters.status, currentPage]);

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email, password required");
      return;
    }
    try {
      await axios.post(`${serverUrl}/api/admin/users`, form, { withCredentials: true });
      toast.success("User created");
      setForm({ name: "", email: "", password: "", role: "student", status: "approved" });
      setCurrentPage(1);
      fetchUsers(1);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Create failed");
    }
  };

  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    createUser();
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `${serverUrl}/api/admin/users/${id}/status`,
        { status },
        { withCredentials: true }
      );
      toast.success("Status updated");
      fetchUsers(currentPage);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    }
  };

  const updatePassword = async (userId) => {
    const newPassword = passwordUpdates[userId];
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await axios.patch(
        `${serverUrl}/api/admin/users/${userId}/password`,
        { password: newPassword },
        { withCredentials: true }
      );
      toast.success("Password updated successfully");
      setPasswordUpdates((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setEditingPassword(null);
      fetchUsers(currentPage);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update password");
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
  };

  const startUserIndex = users.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endUserIndex = users.length === 0 ? 0 : startUserIndex + users.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Feedback Link */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-6 mb-6 border-2 border-[#3B82F6] flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#3B82F6] mb-2 flex items-center gap-3">
              <FaUsers /> User Management
            </h1>
            <p className="text-white">Manage all users, educators, and students</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/admin/fees")}
              className="px-6 py-3 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all shadow-lg flex items-center gap-2"
            >
              <FaMoneyBillWave /> Fee Manager
            </button>
            <button
              onClick={() => navigate("/admin/portal")}
              className="px-6 py-3 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all shadow-lg flex items-center gap-2"
            >
              <FaCog /> Portal Management
            </button>
            <button
              onClick={() => navigate("/admin/feedback")}
              className="px-6 py-3 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all shadow-lg flex items-center gap-2"
            >
              <FaCommentDots /> View Feedback
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Users List</h2>
            <div className="flex gap-2">
              <select
                className="border rounded p-2 text-sm text-black"
                value={filters.role}
                onChange={(e) => {
                  setCurrentPage(1);
                  setFilters((p) => ({ ...p, role: e.target.value }));
                }}
              >
                <option value="">All roles</option>
                <option value="student">Student</option>
                <option value="educator">Educator</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className="border rounded p-2 text-sm text-black"
                value={filters.status}
                onChange={(e) => {
                  setCurrentPage(1);
                  setFilters((p) => ({ ...p, status: e.target.value }));
                }}
              >
                <option value="">All status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h2 className="font-semibold">Create User</h2>
            <form className="space-y-3" onSubmit={handleCreateUserSubmit}>
              <input
                className="w-full border rounded p-2 text-black"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                autoComplete="name"
                required
              />
              <input
                className="w-full border rounded p-2 text-black"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                autoComplete="email"
                required
              />
              <input
                className="w-full border rounded p-2 text-black"
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                autoComplete="new-password"
                required
              />
              <select
                className="w-full border rounded p-2 text-black"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="student">Student</option>
                <option value="educator">Educator</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className="w-full border rounded p-2 text-black"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg">
                Create
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Users</h2>
              <p className="text-xs text-gray-500">
                Showing {startUserIndex}-{endUserIndex} of {totalUsers}
              </p>
            </div>
            <div className="max-h-[520px] overflow-y-auto space-y-2">
              {users.map((u) => (
                <div key={u._id} className="border rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <p className="text-xs text-gray-500">
                        Role: {u.role} • Status: {u.status}
                      </p>
                      
                      {/* Password Update Section */}
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
                            className="w-full border rounded p-2 text-sm text-black"
                            placeholder="New password (min 8 chars)"
                            value={passwordUpdates[u._id] || ""}
                            autoComplete="new-password"
                            onChange={(e) =>
                              setPasswordUpdates((prev) => ({
                                ...prev,
                                [u._id]: e.target.value,
                              }))
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 bg-gray-300 text-black text-sm rounded"
                              onClick={() => {
                                setEditingPassword(null);
                                setPasswordUpdates((prev) => {
                                  const updated = { ...prev };
                                  delete updated[u._id];
                                  return updated;
                                });
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          className="mt-2 text-xs text-blue-600 hover:underline"
                          onClick={() => setEditingPassword(u._id)}
                        >
                          🔑 Update Password
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          className="text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                          onClick={() => updateStatus(u._id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="text-orange-600 hover:bg-orange-50 px-2 py-1 rounded"
                          onClick={() => updateStatus(u._id, "pending")}
                        >
                          Pending
                        </button>
                        <button
                          className="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                          onClick={() => updateStatus(u._id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-gray-500 text-sm">No users.</p>}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;

