import React, { useState, useEffect } from 'react';
import { Search, X, User, Loader2 } from 'lucide-react';
import { TaggedUser } from '../services/commentService';
import api from '../config/api';

interface UserTagInputProps {
  selectedUsers: TaggedUser[];
  onChange: (users: TaggedUser[]) => void;
}

interface UserData {
  address: string;
  name: string;
  role: string;
  department: string;
}

const UserTagInput: React.FC<UserTagInputProps> = ({
  selectedUsers,
  onChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    try {
      setIsSearching(true);
      const response = await api.get('/api/users', {
        params: { search: query }
      });
      
      // Filter out already selected users
      const filtered = response.data.filter(
        (user: UserData) => 
          !selectedUsers.some(sel => sel.address.toLowerCase() === user.address.toLowerCase())
      );
      
      setSearchResults(filtered);
      setShowDropdown(filtered.length > 0);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: UserData) => {
    const taggedUser: TaggedUser = {
      address: user.address.toLowerCase(),
      name: user.name
    };
    onChange([...selectedUsers, taggedUser]);
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleRemoveUser = (address: string) => {
    onChange(selectedUsers.filter(user => user.address !== address));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tag Users
      </label>
      
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="Search users by name or address..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user.address}
                type="button"
                onClick={() => handleSelectUser(user)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start space-x-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.role} • {user.department}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.address}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm"
            >
              <User className="w-3 h-3" />
              <span>@{user.name || user.address}</span>
              <button
                type="button"
                onClick={() => handleRemoveUser(user.address)}
                className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserTagInput;
