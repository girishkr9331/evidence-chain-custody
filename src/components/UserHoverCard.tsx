import React, { useState, useEffect } from 'react';
import { User, Shield, Calendar, MapPin } from 'lucide-react';
import api from '../config/api';

interface UserHoverCardProps {
  userAddress: string;
  userName?: string;
  children: React.ReactNode;
}

interface UserDetails {
  name: string;
  role: string;
  department: string;
  address: string;
  createdAt: string;
}

const UserHoverCard: React.FC<UserHoverCardProps> = ({ userAddress, userName, children }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isHovering && !userDetails && !loading && !error) {
      // Delay loading by 300ms to avoid unnecessary requests on quick hovers
      timeoutId = setTimeout(() => {
        loadUserDetails();
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isHovering]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/users/${userAddress}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUserDetails(response.data);
      setError(false);
    } catch (err) {
      console.error('Error loading user details:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovering(true);
    // Position the card near the mouse
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const getRoleName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'POLICE': 'Police Officer',
      'INVESTIGATOR': 'Investigator',
      'FORENSIC_LAB': 'Forensic Lab',
      'COURT': 'Court Official',
      'CYBER_UNIT': 'Cyber Unit'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'POLICE': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      'INVESTIGATOR': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'FORENSIC_LAB': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      'COURT': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      'CYBER_UNIT': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
    };
    return colors[role] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAvatarUrl = () => {
    const apiKey = import.meta.env.VITE_DICEBEAR_API_KEY;
    const style = 'avataaars'; // You can use: avataaars, bottts, identicon, initials, lorelei, etc.
    const seed = userAddress || userName || 'default';
    
    // If API key is provided, use it in the request
    if (apiKey) {
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&apikey=${apiKey}`;
    }
    
    // Use public API without key (has rate limits)
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {/* Hover Card */}
      {isHovering && (
        <div
          className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: 'calc(100vw - 32px)'
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load user details
              </p>
            </div>
          )}

          {!loading && !error && userDetails && (
            <div className="space-y-3">
              {/* Header with Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700 ring-2 ring-primary-500 dark:ring-primary-400">
                  <img 
                    src={getAvatarUrl()} 
                    alt={`${userDetails.name}'s avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initial if image fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center hidden">
                    <span className="text-white text-lg font-bold">
                      {userDetails.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                    {userDetails.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                    {userDetails.address.slice(0, 10)}...{userDetails.address.slice(-8)}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(userDetails.role)}`}>
                  {getRoleName(userDetails.role)}
                </span>
              </div>

              {/* Department */}
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{userDetails.department}</span>
              </div>

              {/* Joined Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Joined {formatDate(userDetails.createdAt)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default UserHoverCard;
