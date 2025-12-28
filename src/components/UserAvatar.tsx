import React from 'react';

interface UserAvatarProps {
  userAddress: string;
  userName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  userAddress, 
  userName, 
  size = 'md',
  showName = false,
  className = '' 
}) => {
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

  // Size mapping for avatar dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const avatarSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${avatarSize} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700 ring-2 ring-gray-200 dark:ring-gray-600`}>
        <img 
          src={getAvatarUrl()} 
          alt={`${userName}'s avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initial if image fails to load
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center hidden ${avatarSize}`}>
          <span className="text-white font-bold">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      {showName && (
        <span className="font-medium text-gray-900 dark:text-white truncate">
          {userName}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
