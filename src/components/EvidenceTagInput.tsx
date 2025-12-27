import React, { useState, useEffect } from 'react';
import { Search, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import { TaggedEvidence } from '../services/commentService';
import api from '../config/api';

interface EvidenceTagInputProps {
  selectedEvidences: TaggedEvidence[];
  onChange: (evidences: TaggedEvidence[]) => void;
  currentEvidenceId?: string;
}

interface Evidence {
  evidenceId: string;
  fileName: string;
  caseId: string;
  category: string;
}

const EvidenceTagInput: React.FC<EvidenceTagInputProps> = ({
  selectedEvidences,
  onChange,
  currentEvidenceId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Evidence[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchEvidences(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchEvidences = async (query: string) => {
    try {
      setIsSearching(true);
      const response = await api.get('/api/evidence', {
        params: { search: query }
      });
      
      // Filter out current evidence and already selected ones
      const filtered = response.data.filter(
        (ev: Evidence) => 
          ev.evidenceId !== currentEvidenceId &&
          !selectedEvidences.some(sel => sel.evidenceId === ev.evidenceId)
      );
      
      setSearchResults(filtered);
      setShowDropdown(filtered.length > 0);
    } catch (error) {
      console.error('Error searching evidences:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectEvidence = (evidence: Evidence) => {
    const taggedEvidence: TaggedEvidence = {
      evidenceId: evidence.evidenceId,
      fileName: evidence.fileName,
      caseId: evidence.caseId
    };
    onChange([...selectedEvidences, taggedEvidence]);
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    onChange(selectedEvidences.filter(ev => ev.evidenceId !== evidenceId));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tag Related Evidence
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
            placeholder="Search evidence by ID, name, or case..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((evidence) => (
              <button
                key={evidence.evidenceId}
                type="button"
                onClick={() => handleSelectEvidence(evidence)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start space-x-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <LinkIcon className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {evidence.fileName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {evidence.evidenceId} • {evidence.caseId} • {evidence.category}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Evidences */}
      {selectedEvidences.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEvidences.map((evidence) => (
            <div
              key={evidence.evidenceId}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{evidence.fileName || evidence.evidenceId}</span>
              <button
                type="button"
                onClick={() => handleRemoveEvidence(evidence.evidenceId)}
                className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
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

export default EvidenceTagInput;
