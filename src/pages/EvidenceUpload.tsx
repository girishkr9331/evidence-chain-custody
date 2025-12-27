import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Upload, Hash, FileText, AlertCircle, UserPlus } from "lucide-react";
import Layout from "../components/Layout";
import { useWeb3 } from "../context/Web3Context";
import toast from "react-hot-toast";
import CryptoJS from "crypto-js";
import axios from "../config/api";

const EvidenceUpload = () => {
  const [formData, setFormData] = useState({
    evidenceId: "",
    caseId: "",
    description: "",
    category: "MOBILE_DUMP",
    notes: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hashingFile, setHashingFile] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const { contract, isConnected, account } = useWeb3();
  const navigate = useNavigate();

  const categories = [
    { value: "MOBILE_DUMP", label: "Mobile Dump" },
    { value: "CCTV_FOOTAGE", label: "CCTV Footage" },
    { value: "DIGITAL_DOCUMENT", label: "Digital Document" },
    { value: "NETWORK_LOG", label: "Network Log" },
    { value: "FORENSIC_IMAGE", label: "Forensic Image" },
    { value: "OTHER", label: "Other" },
  ];

  useEffect(() => {
    checkUserRegistration();
  }, [contract, isConnected, account]);

  const checkUserRegistration = async () => {
    if (!contract || !isConnected || !account) {
      setCheckingUser(false);
      setIsUserRegistered(false);
      return;
    }

    try {
      const user = await contract.getUser(account);
      const isRegistered = user.isActive;
      
      console.log('👤 User registration check:', {
        address: account,
        isActive: user.isActive,
        role: Number(user.role),
        name: user.name
      });
      
      setIsUserRegistered(isRegistered);
    } catch (error) {
      console.error('Error checking user registration:', error);
      setIsUserRegistered(false);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setHashingFile(true);

    try {
      // Calculate SHA-256 hash
      const arrayBuffer = await selectedFile.arrayBuffer();
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
      const hash = CryptoJS.SHA256(wordArray).toString();
      setFileHash(hash);
      toast.success("File hash calculated successfully!");
    } catch (error) {
      console.error("Error hashing file:", error);
      toast.error("Failed to calculate file hash");
    } finally {
      setHashingFile(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isConnected || !contract) {
      toast.error("Please connect your wallet first!");
      return;
    }

    if (!file || !fileHash) {
      toast.error("Please select a file!");
      return;
    }

    setLoading(true);
    let toastId: string | undefined;

    try {
      // Create metadata object
      const metadata = JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        category: formData.category,
        description: formData.description,
        uploadedBy: account,
        uploadedAt: new Date().toISOString(),
      });

      // Register evidence on blockchain
      toastId = toast.loading("Recording evidence on blockchain...");

      const tx = await contract.registerEvidence(
        formData.evidenceId,
        fileHash,
        metadata,
        formData.caseId
      );

      const receipt = await tx.wait();

      // Dismiss blockchain loading toast
      toast.dismiss(toastId);
      toast.success("Evidence recorded on blockchain!");

      // Save evidence to database
      toastId = toast.loading("Saving evidence to database...");

      try {
        await axios.post("/api/evidence", {
          evidenceId: formData.evidenceId,
          caseId: formData.caseId,
          fileHash: fileHash,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          category: formData.category,
          description: formData.description,
          uploadedBy: account,
          blockchainTxHash: receipt.hash,
          metadata: {
            notes: formData.notes,
            uploadedAt: new Date().toISOString(),
          },
        });

        // Save audit log to database (UPLOADED action = 1)
        try {
          await axios.post("/api/audit-logs", {
            evidenceId: formData.evidenceId,
            action: 1, // UPLOADED
            actor: account,
            timestamp: Math.floor(Date.now() / 1000),
            notes: "Evidence uploaded and registered",
            blockchainTxHash: receipt.hash,
          });
          console.log("Audit log saved to database");
        } catch (auditError) {
          console.error("Failed to save audit log to database:", auditError);
        }

        toast.dismiss(toastId);
        toast.success("Evidence saved to database!");

        // Navigate to evidence list
        setTimeout(() => {
          navigate("/evidence/list");
        }, 1500);
      } catch (dbError: any) {
        console.error("Database save error:", dbError);
        toast.dismiss(toastId);
        toast.error(
          "Evidence recorded on blockchain but failed to save to database"
        );

        // Still navigate after a delay since blockchain save succeeded
        setTimeout(() => {
          navigate("/evidence/list");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error registering evidence:", error);

      // Dismiss loading toast if it exists
      if (toastId) {
        toast.dismiss(toastId);
      }

      toast.error(
        error.reason || error.message || "Failed to register evidence"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Upload Evidence
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Register new digital evidence on the blockchain
          </p>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-800 dark:text-yellow-300">
              Please connect your wallet to upload evidence.
            </p>
          </div>
        )}

        {/* User Not Registered Warning */}
        {isConnected && !checkingUser && !isUserRegistered && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                  User Not Registered
                </h3>
                <p className="text-red-800 dark:text-red-300 text-sm mb-3">
                  Your wallet address ({account?.slice(0, 8)}...{account?.slice(-6)}) is not registered as an authorized user. 
                  You need to be registered before you can upload evidence.
                </p>
                <div className="flex gap-3">
                  <Link
                    to="/users"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    Go to User Management
                  </Link>
                  <button
                    onClick={checkUserRegistration}
                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                  >
                    Recheck Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Evidence ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evidence ID *
              </label>
              <input
                type="text"
                name="evidenceId"
                value={formData.evidenceId}
                onChange={handleChange}
                placeholder="EV-2024-001"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Unique identifier for this evidence
              </p>
            </div>

            {/* Case ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Case ID *
              </label>
              <input
                type="text"
                name="caseId"
                value={formData.caseId}
                onChange={handleChange}
                placeholder="CASE-2024-001"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evidence Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a detailed description of the evidence..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evidence File *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  required
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium"
                >
                  Click to upload file
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 100MB
                </p>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {hashingFile && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* File Hash Display */}
            {fileHash && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  SHA-256 Hash
                </label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {fileHash}
                  </p>
                </div>
                <p className="mt-1 text-xs text-green-600">
                  ✓ This hash will be stored on the blockchain for integrity
                  verification
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional information..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !isConnected || hashingFile || !isUserRegistered}
                className="flex-1 py-3 px-6 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Registering Evidence..."
                  : "Register Evidence on Blockchain"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/evidence/list")}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            How it works:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• File hash is calculated locally using SHA-256 algorithm</li>
            <li>• Evidence metadata and hash are recorded on blockchain</li>
            <li>• Original file can be stored in secure off-chain storage</li>
            <li>
              • Blockchain ensures immutable record of evidence registration
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default EvidenceUpload;
