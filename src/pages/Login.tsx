import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

const Login = () => {
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { connectWallet, account } = useWeb3();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(address || account || "", password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-600 rounded-2xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evidence Chain of Custody
          </h1>
          <p className="text-gray-600">
            Blockchain-Based Digital Evidence Platform
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Wallet Connection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={account || address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!!account}
                />
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  disabled={!!account}
                >
                  <Wallet className="w-5 h-5" />
                  {account ? "Connected" : "Connect"}
                </button>
              </div>
              {account && (
                <p className="mt-2 text-xs text-green-600">
                  ✓ Wallet connected: {account.slice(0, 6)}...
                  {account.slice(-4)}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!address && !account)}
              className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Register here
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              <Link
                to="/registration-status"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Check Registration Status
              </Link>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-xs text-gray-600">
          <p>© 2025 Evidence Chain of Custody Platform</p>
          <p className="mt-1">Secured by Blockchain Technology</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
