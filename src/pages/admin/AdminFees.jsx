import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaFilter,
  FaUserGraduate,
  FaBook,
  FaPlus,
  FaPrint,
} from "react-icons/fa";
import { serverUrl } from "../../App";

const PAGE_SIZE = 10;

const initialCreateForm = {
  studentId: "",
  courseId: "",
  title: "Coaching Fee",
  planType: "one-time",
  monthlyInstallments: "6",
  totalFee: "",
  discount: "",
  initialPaid: "",
  dueDate: "",
  centerName: "",
  notes: "",
  paymentMode: "cash",
  paymentReference: "",
  grantPortalAccess: true,
};

const statusClassMap = {
  pending: "bg-gray-100 text-gray-800",
  partial: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

const toCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "N/A");

function AdminFees() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    search: "",
    page: 1,
  });

  const [summary, setSummary] = useState({
    totalFinalFee: 0,
    totalPaid: 0,
    totalDue: 0,
    pendingCount: 0,
    partialCount: 0,
    paidCount: 0,
    overdueCount: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [paymentForms, setPaymentForms] = useState({});

  const fetchMeta = async () => {
    try {
      const [studentRes, courseRes] = await Promise.all([
        axios.get(`${serverUrl}/api/user/allstudents`, { withCredentials: true }),
        axios.get(`${serverUrl}/api/course/getallcourse`, { withCredentials: true }),
      ]);

      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setCourses(Array.isArray(courseRes.data) ? courseRes.data : []);
    } catch {
      setStudents([]);
      setCourses([]);
    }
  };

  const fetchRecords = async (requestedPage = filters.page) => {
    setLoading(true);
    try {
      const params = {
        page: requestedPage,
        limit: PAGE_SIZE,
      };
      if (filters.status) params.status = filters.status;
      if (filters.search.trim()) params.search = filters.search.trim();

      const res = await axios.get(`${serverUrl}/api/fee/admin`, {
        withCredentials: true,
        params,
      });

      const recordsList = Array.isArray(res.data?.records) ? res.data.records : [];
      setRecords(recordsList);
      setSummary(res.data?.summary || summary);
      setPagination(
        res.data?.pagination || {
          page: requestedPage,
          totalPages: 1,
          totalRecords: recordsList.length,
        }
      );

      const nextPaymentForms = {};
      recordsList.forEach((item) => {
        nextPaymentForms[item._id] = {
          amount: item.dueAmount > 0 ? String(item.dueAmount) : "",
          paymentMode: "cash",
          referenceId: "",
          note: "",
        };
      });
      setPaymentForms(nextPaymentForms);
    } catch {
      setRecords([]);
      setSummary({
        totalFinalFee: 0,
        totalPaid: 0,
        totalDue: 0,
        pendingCount: 0,
        partialCount: 0,
        paidCount: 0,
        overdueCount: 0,
      });
      setPagination({
        page: requestedPage,
        totalPages: 1,
        totalRecords: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchRecords(filters.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.status]);

  const handleFilterSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchRecords(1);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.studentId) {
      toast.error("Please select student");
      return;
    }
    if (!createForm.totalFee || Number(createForm.totalFee) <= 0) {
      toast.error("Total fee must be greater than 0");
      return;
    }
    if (createForm.planType === "monthly" && Number(createForm.monthlyInstallments) < 1) {
      toast.error("Monthly installments must be at least 1");
      return;
    }

    setCreating(true);
    try {
      const res = await axios.post(
        `${serverUrl}/api/fee/admin`,
        {
          studentId: createForm.studentId,
          courseId: createForm.courseId || null,
          title: createForm.title,
          planType: createForm.planType,
          monthlyInstallments:
            createForm.planType === "monthly" ? Number(createForm.monthlyInstallments) || 1 : 1,
          totalFee: Number(createForm.totalFee),
          discount: Number(createForm.discount) || 0,
          initialPaid: Number(createForm.initialPaid) || 0,
          dueDate: createForm.dueDate || null,
          centerName: createForm.centerName,
          notes: createForm.notes,
          paymentMode: createForm.paymentMode,
          paymentReference: createForm.paymentReference,
          grantPortalAccess: createForm.courseId ? createForm.grantPortalAccess : false,
        },
        { withCredentials: true }
      );

      const createdCount = Number(res.data?.createdCount) || 1;
      const baseMessage =
        createForm.planType === "monthly"
          ? `Monthly fee plan created (${createdCount} records)`
          : "Fee plan created";
      const accessMessage = res.data?.portalAccess?.grantedNow
        ? " Student enrolled in course for portal access."
        : res.data?.portalAccess?.alreadyGranted
        ? " Student already had portal access."
        : "";
      toast.success(`${baseMessage}${accessMessage}`);
      setCreateForm(initialCreateForm);
      fetchRecords(1);
      setFilters((prev) => ({ ...prev, page: 1 }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create fee plan");
    } finally {
      setCreating(false);
    }
  };

  const handlePay = async (recordId) => {
    const form = paymentForms[recordId];
    if (!form || !form.amount || Number(form.amount) <= 0) {
      toast.error("Enter valid payment amount");
      return;
    }

    setProcessingPaymentId(recordId);
    try {
      await axios.post(
        `${serverUrl}/api/fee/admin/${recordId}/pay`,
        {
          amount: Number(form.amount),
          paymentMode: form.paymentMode,
          referenceId: form.referenceId,
          note: form.note,
        },
        { withCredentials: true }
      );
      toast.success("Payment recorded");
      fetchRecords(pagination.page);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to record payment");
    } finally {
      setProcessingPaymentId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-2xl shadow-2xl p-6 border-2 border-[#3B82F6] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#3B82F6] flex items-center gap-3">
              <FaMoneyBillWave /> Fee Management
            </h1>
            <p className="text-white text-sm mt-1">
              Manage offline coaching fees, installments and due balances.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/users")}
            className="px-5 py-2 rounded-xl bg-[#3B82F6] text-black font-bold hover:bg-[#2563EB]"
          >
            Back to Users
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-600">Total Fee</p>
            <p className="text-xl font-bold">{toCurrency(summary.totalFinalFee)}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-600">Collected</p>
            <p className="text-xl font-bold text-green-700">{toCurrency(summary.totalPaid)}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-600">Outstanding</p>
            <p className="text-xl font-bold text-red-700">{toCurrency(summary.totalDue)}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-600">Records</p>
            <p className="text-xl font-bold">{pagination.totalRecords}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 border space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaPlus /> Create Fee Plan
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="border rounded-lg p-2 text-black"
              value={createForm.studentId}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, studentId: e.target.value }))}
              required
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>

            <select
              className="border rounded-lg p-2 text-black"
              value={createForm.courseId}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  courseId: e.target.value,
                  grantPortalAccess: e.target.value ? true : false,
                }))
              }
            >
              <option value="">General / No course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="border rounded-lg p-2 text-black"
              placeholder="Fee title"
              value={createForm.title}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <select
              className="border rounded-lg p-2 text-black"
              value={createForm.planType}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  planType: e.target.value,
                }))
              }
            >
              <option value="one-time">One-time fee</option>
              <option value="monthly">Monthly plan</option>
            </select>
            {createForm.planType === "monthly" && (
              <input
                type="number"
                min="1"
                max="36"
                className="border rounded-lg p-2 text-black"
                placeholder="No. of installments (months)"
                value={createForm.monthlyInstallments}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, monthlyInstallments: e.target.value }))
                }
                required
              />
            )}
            <input
              type="number"
              min="1"
              className="border rounded-lg p-2 text-black"
              placeholder="Total fee"
              value={createForm.totalFee}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, totalFee: e.target.value }))}
              required
            />
            <input
              type="number"
              min="0"
              className="border rounded-lg p-2 text-black"
              placeholder="Discount"
              value={createForm.discount}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, discount: e.target.value }))}
            />
            <input
              type="number"
              min="0"
              className="border rounded-lg p-2 text-black"
              placeholder="Initial paid"
              value={createForm.initialPaid}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, initialPaid: e.target.value }))}
            />
            <input
              type="datetime-local"
              className="border rounded-lg p-2 text-black"
              placeholder={
                createForm.planType === "monthly" ? "First installment due date" : "Due date (optional)"
              }
              value={createForm.dueDate}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
            <input
              type="text"
              className="border rounded-lg p-2 text-black"
              placeholder="Center name"
              value={createForm.centerName}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, centerName: e.target.value }))}
            />
            <select
              className="border rounded-lg p-2 text-black"
              value={createForm.paymentMode}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, paymentMode: e.target.value }))}
            >
              <option value="cash">cash</option>
              <option value="upi">upi</option>
              <option value="card">card</option>
              <option value="bank-transfer">bank-transfer</option>
              <option value="online">online</option>
              <option value="other">other</option>
            </select>
            <input
              type="text"
              className="border rounded-lg p-2 text-black"
              placeholder="Payment reference (optional)"
              value={createForm.paymentReference}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, paymentReference: e.target.value }))
              }
            />
            {createForm.courseId && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={createForm.grantPortalAccess}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      grantPortalAccess: e.target.checked,
                    }))
                  }
                />
                Enroll student in this course for full portal access
              </label>
            )}
            <textarea
              rows={2}
              className="border rounded-lg p-2 text-black md:col-span-2"
              placeholder="Notes"
              value={createForm.notes}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <button
              type="submit"
              disabled={creating}
              className="md:col-span-2 bg-black text-[#3B82F6] font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Fee Plan"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 border space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FaFilter /> Fee Records
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="border rounded-lg p-2 text-black"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                }
              >
                <option value="">All status</option>
                <option value="pending">pending</option>
                <option value="partial">partial</option>
                <option value="paid">paid</option>
                <option value="overdue">overdue</option>
              </select>
              <input
                className="border rounded-lg p-2 text-black"
                placeholder="Search by student name/email"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
              <button
                onClick={handleFilterSearch}
                className="bg-black text-[#3B82F6] px-4 rounded-lg"
              >
                Search
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-600">Loading fee records...</p>
          ) : records.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No fee records found.</p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record._id} className="border rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-lg">{record.title || "Coaching Fee"}</p>
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <FaUserGraduate /> {record.studentId?.name || "Unknown student"} (
                        {record.studentId?.email || "no-email"})
                      </p>
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <FaBook /> {record.courseId?.title || "General fee"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Plan:{" "}
                        {record.totalInstallments > 1
                          ? `Monthly (${record.installmentNumber}/${record.totalInstallments})`
                          : "One-time"}
                      </p>
                      {record.dueDate && (
                        <p className="text-xs text-gray-500">
                          Due: {formatDateTime(record.dueDate)}
                        </p>
                      )}
                      {record.centerName && (
                        <p className="text-xs text-gray-500">Center: {record.centerName}</p>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          statusClassMap[record.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {record.status}
                      </span>
                      <p>Total: {toCurrency(record.finalFee)}</p>
                      <p className="text-green-700">Paid: {toCurrency(record.amountPaid)}</p>
                      <p className="text-red-700">Due: {toCurrency(record.dueAmount)}</p>
                    </div>
                  </div>

                  {record.status !== "paid" && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
                      <input
                        type="number"
                        min="1"
                        className="border rounded p-2 text-sm text-black"
                        placeholder="Amount"
                        value={paymentForms[record._id]?.amount || ""}
                        onChange={(e) =>
                          setPaymentForms((prev) => ({
                            ...prev,
                            [record._id]: {
                              ...prev[record._id],
                              amount: e.target.value,
                            },
                          }))
                        }
                      />
                      <select
                        className="border rounded p-2 text-sm text-black"
                        value={paymentForms[record._id]?.paymentMode || "cash"}
                        onChange={(e) =>
                          setPaymentForms((prev) => ({
                            ...prev,
                            [record._id]: {
                              ...prev[record._id],
                              paymentMode: e.target.value,
                            },
                          }))
                        }
                      >
                        <option value="cash">cash</option>
                        <option value="upi">upi</option>
                        <option value="card">card</option>
                        <option value="bank-transfer">bank-transfer</option>
                        <option value="online">online</option>
                        <option value="other">other</option>
                      </select>
                      <input
                        type="text"
                        className="border rounded p-2 text-sm text-black"
                        placeholder="Reference"
                        value={paymentForms[record._id]?.referenceId || ""}
                        onChange={(e) =>
                          setPaymentForms((prev) => ({
                            ...prev,
                            [record._id]: {
                              ...prev[record._id],
                              referenceId: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        type="text"
                        className="border rounded p-2 text-sm text-black"
                        placeholder="Note"
                        value={paymentForms[record._id]?.note || ""}
                        onChange={(e) =>
                          setPaymentForms((prev) => ({
                            ...prev,
                            [record._id]: {
                              ...prev[record._id],
                              note: e.target.value,
                            },
                          }))
                        }
                      />
                      <button
                        onClick={() => handlePay(record._id)}
                        disabled={processingPaymentId === record._id}
                        className="bg-black text-[#3B82F6] rounded px-3 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        {processingPaymentId === record._id ? "Saving..." : "Add Payment"}
                      </button>
                    </div>
                  )}

                  {Array.isArray(record.installments) && record.installments.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Payment History</p>
                      <div className="space-y-2">
                        {[...record.installments]
                          .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
                          .map((payment) => (
                            <div
                              key={payment._id}
                              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50 rounded-lg p-2"
                            >
                              <div className="text-xs text-gray-700">
                                <p>
                                  Amount:{" "}
                                  <span className="font-semibold text-black">
                                    {toCurrency(payment.amount)}
                                  </span>
                                </p>
                                <p>
                                  Date: {formatDateTime(payment.paidAt)} | Mode:{" "}
                                  {(payment.paymentMode || "cash").toUpperCase()}
                                </p>
                                {payment.referenceId && <p>Ref: {payment.referenceId}</p>}
                              </div>
                              <a
                                href={`${serverUrl}/api/fee/${record._id}/receipt/${payment._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-black text-[#3B82F6] text-xs font-semibold hover:bg-gray-900"
                              >
                                <FaPrint /> Print Receipt
                              </a>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))
              }
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Math.min(prev.page + 1, pagination.totalPages),
                }))
              }
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminFees;
