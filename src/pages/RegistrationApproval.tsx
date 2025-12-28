import { useEffect, useState } from "react";
import {
  UserPlus,
  Check,
  X,
  Clock,
  Trash2,
  Filter,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import Layout from "../components/Layout";
import ConfirmDialog from "../components/ConfirmDialog";
import toast from "react-hot-toast";

interface RegistrationRequest {
  _id: string;
  address: string;
  name: string;
  role: string;
  department: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

const RegistrationApproval = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<
    RegistrationRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: "approve" | "reject" | "delete";
    requestId: string | null;
  }>({
    open: false,
    title: "",
    message: "",
    type: "approve",
    requestId: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const { token } = useAuth();
  const { contract, isConnected } = useWeb3();

  const API_URL =
    (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (filter === "ALL") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((req) => req.status === filter));
    }
  }, [filter, requests]);

  const fetchRequests = async () => {
    try {
      console.log("🔍 Fetching registration requests...");
      console.log("   API URL:", `${API_URL}/registration-requests`);
      console.log("   Token exists:", !!token);
      console.log(
        "   Token (first 20 chars):",
        token ? token.substring(0, 20) + "..." : "NO TOKEN"
      );

      const response = await axios.get(`${API_URL}/registration-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        "✅ Requests fetched successfully:",
        response.data.length,
        "requests"
      );
      console.log("   Data:", response.data);
      setRequests(response.data);
    } catch (error: any) {
      console.error("❌ Error fetching registration requests:", error);
      console.error("   Status:", error.response?.status);
      console.error("   Message:", error.response?.data?.message);
      console.error("   Full error:", error.response?.data);

      // Show user-friendly error
      if (error.response?.status === 403) {
        alert(
          "Access denied. You must be an admin to view registration requests."
        );
      } else if (error.response?.status === 401) {
        alert("Authentication failed. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    const request = requests.find((r) => r._id === requestId);
    if (!request) return;

    let toastId: string | undefined;

    try {
      // Step 1: Approve in database (creates user)
      toastId = toast.loading("Approving registration in database...");

      await axios.post(
        `${API_URL}/registration-requests/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(toastId);
      toast.success("User created in database!");

      // Step 2: Register on blockchain (if connected)
      if (contract && isConnected) {
        toastId = toast.loading("Registering user on blockchain...");

        try {
          // Map role string to number for blockchain
          const roleMapping: { [key: string]: number } = {
            POLICE: 1,
            INVESTIGATOR: 2,
            FORENSIC_LAB: 3,
            COURT: 4,
            CYBER_UNIT: 5,
            ADMIN: 0,
          };

          const roleNumber = roleMapping[request.role] || 0;

          const tx = await contract.registerUser(
            request.address,
            roleNumber,
            request.name,
            request.department
          );

          toast.dismiss(toastId);
          toastId = toast.loading("Processing blockchain transaction...");

          await tx.wait();

          toast.dismiss(toastId);
          toast.success("User registered on blockchain! ✅", {
            duration: 4000,
          });
        } catch (blockchainError: any) {
          console.error("Blockchain registration error:", blockchainError);
          toast.dismiss(toastId);

          // User is approved in database, but blockchain failed
          toast.error(
            "⚠️ User approved in database, but blockchain registration failed. They can still login but may need blockchain sync later.",
            {
              duration: 6000,
            }
          );
        }
      } else {
        toast(
          "⚠️ Wallet not connected. User approved in database but not on blockchain.",
          {
            duration: 5000,
            icon: "⚠️",
          }
        );
      }

      await fetchRequests();
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (error: any) {
      if (toastId) {
        toast.dismiss(toastId);
      }
      console.error("Error approving request:", error);
      toast.error(error.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await axios.post(
        `${API_URL}/registration-requests/${requestId}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRequests();
      setConfirmDialog({ ...confirmDialog, open: false });
      setRejectionReason("");
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      alert(error.response?.data?.message || "Failed to reject request");
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      await axios.delete(`${API_URL}/registration-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRequests();
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (error: any) {
      console.error("Error deleting request:", error);
      alert(error.response?.data?.message || "Failed to delete request");
    }
  };

  const openApproveDialog = (requestId: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Approve Registration",
      message: `Are you sure you want to approve the registration request from ${name}? This will create a new user account.`,
      type: "approve",
      requestId,
    });
  };

  const openRejectDialog = (requestId: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Reject Registration",
      message: `Are you sure you want to reject the registration request from ${name}?`,
      type: "reject",
      requestId,
    });
  };

  const openDeleteDialog = (requestId: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Request",
      message: `Are you sure you want to permanently delete the registration request from ${name}?`,
      type: "delete",
      requestId,
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog.requestId) return;

    switch (confirmDialog.type) {
      case "approve":
        handleApprove(confirmDialog.requestId);
        break;
      case "reject":
        handleReject(confirmDialog.requestId);
        break;
      case "delete":
        handleDelete(confirmDialog.requestId);
        break;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      POLICE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      INVESTIGATOR:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      FORENSIC_LAB:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      COURT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      CYBER_UNIT:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };
    return (
      colors[role] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Check className="w-3 h-3" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <X className="w-3 h-3" />
            Rejected
          </span>
        );
    }
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading requests...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Registration Approvals
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Review and approve new user registration requests
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg animate-pulse-slow animate-glow whitespace-nowrap">
              <span className="font-semibold">{pendingCount}</span> pending
              request{pendingCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Blockchain Status Info */}
        {isConnected ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                  Blockchain Connected
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Approved users will be automatically registered on the
                  blockchain smart contract with their assigned roles.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-1">
                  Wallet Not Connected
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  Connect your wallet to automatically register approved users
                  on the blockchain. Users can still login without blockchain
                  registration, but will need manual sync later for evidence
                  upload permissions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center animate-fade-in">
            <UserPlus className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4 animate-pulse-slow" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {filter.toLowerCase()} requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === "PENDING"
                ? "All registration requests have been reviewed"
                : `No ${filter.toLowerCase()} registration requests found`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => (
              <div
                key={request._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-slide-up hover:shadow-lg transition-shadow duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {request.name}
                      </h3>
                      {getStatusBadge(request.status)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          request.role
                        )}`}
                      >
                        {request.role.replace("_", " ")}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Wallet:</span>
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs break-all">
                          {request.address}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Department:</span>
                        <span>{request.department}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Requested:</span>
                        <span className="text-xs sm:text-sm">
                          {new Date(request.requestedAt).toLocaleString()}
                        </span>
                      </div>
                      {request.reviewedAt && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Reviewed:</span>
                          <span className="text-xs sm:text-sm">
                            {new Date(request.reviewedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {request.rejectionReason && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 text-red-600 dark:text-red-400">
                          <span className="font-medium">Reason:</span>
                          <span>{request.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {request.status === "PENDING" && (
                      <>
                        <button
                          onClick={() =>
                            openApproveDialog(request._id, request.name)
                          }
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-105 transition-all duration-200 transform"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() =>
                            openRejectDialog(request._id, request.name)
                          }
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 hover:scale-105 transition-all duration-200 transform"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() =>
                        openDeleteDialog(request._id, request.name)
                      }
                      className="flex items-center justify-center gap-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105 transition-all duration-200 transform"
                      title="Delete request"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sm:hidden">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={handleConfirm}
          onCancel={() => {
            setConfirmDialog({ ...confirmDialog, open: false });
            setRejectionReason("");
          }}
          confirmText={
            confirmDialog.type === "approve"
              ? "Approve"
              : confirmDialog.type === "reject"
              ? "Reject"
              : "Delete"
          }
          confirmButtonClass={
            confirmDialog.type === "approve"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }
        >
          {confirmDialog.type === "reject" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Enter reason for rejection..."
              />
            </div>
          )}
        </ConfirmDialog>
      </div>
    </Layout>
  );
};

export default RegistrationApproval;
