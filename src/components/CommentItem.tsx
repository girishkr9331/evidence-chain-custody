import React, { useState } from 'react';
import { Reply, Trash2, Edit2, Check, X, User, MessageSquare, Link as LinkIcon } from 'lucide-react';
import { Comment, UpdateCommentData, TaggedEvidence, TaggedUser } from '../services/commentService';
import commentService from '../services/commentService';
import EvidenceTagInput from './EvidenceTagInput';
import UserTagInput from './UserTagInput';
import ConfirmDialog from './ConfirmDialog';
import UserHoverCard from './UserHoverCard';
import { Link } from 'react-router-dom';

interface CommentItemProps {
  comment: Comment;
  currentUser: any;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onUpdate: () => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onReply,
  onDelete,
  onUpdate,
  isReply = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(comment.message);
  const [editTaggedEvidences, setEditTaggedEvidences] = useState<TaggedEvidence[]>(comment.taggedEvidences || []);
  const [editTaggedUsers, setEditTaggedUsers] = useState<TaggedUser[]>(comment.taggedUsers || []);
  const [updating, setUpdating] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isAuthor = currentUser && currentUser.address.toLowerCase() === comment.author.toLowerCase();

  const handleEdit = () => {
    setIsEditing(true);
    setEditMessage(comment.message);
    setEditTaggedEvidences(comment.taggedEvidences || []);
    setEditTaggedUsers(comment.taggedUsers || []);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditMessage(comment.message);
    setEditTaggedEvidences(comment.taggedEvidences || []);
    setEditTaggedUsers(comment.taggedUsers || []);
  };

  const handleSaveEdit = async () => {
    if (!editMessage.trim()) return;

    try {
      setUpdating(true);
      const updateData: UpdateCommentData = {
        message: editMessage.trim(),
        taggedEvidences: editTaggedEvidences,
        taggedUsers: editTaggedUsers
      };
      await commentService.updateComment(comment._id, updateData);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete(comment._id);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Comment"
        message={
          comment.replies && comment.replies.length > 0
            ? `Are you sure you want to delete this comment? This will also delete ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}.`
            : 'Are you sure you want to delete this comment? This action cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
      />
      
      <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {comment.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {comment.authorName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
                {comment.isEdited && <span className="ml-1">(edited)</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isAuthor && (
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title="Edit comment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Message */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
            />
            <EvidenceTagInput
              selectedEvidences={editTaggedEvidences}
              onChange={setEditTaggedEvidences}
              currentEvidenceId={comment.evidenceId}
            />
            <UserTagInput
              selectedUsers={editTaggedUsers}
              onChange={setEditTaggedUsers}
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveEdit}
                disabled={updating || !editMessage.trim()}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm"
              >
                <Check className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={updating}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded text-sm"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">
              {comment.message}
            </p>

            {/* Tagged Evidences */}
            {comment.taggedEvidences && comment.taggedEvidences.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {comment.taggedEvidences.map((evidence, idx) => (
                  <Link
                    key={idx}
                    to={`/evidence/${evidence.evidenceId}`}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{evidence.fileName || evidence.evidenceId}</span>
                    {evidence.caseId && <span className="text-blue-500">({evidence.caseId})</span>}
                  </Link>
                ))}
              </div>
            )}

            {/* Tagged Users */}
            {comment.taggedUsers && comment.taggedUsers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {comment.taggedUsers.map((user, idx) => (
                  <UserHoverCard
                    key={idx}
                    userAddress={user.address}
                    userName={user.name}
                  >
                    <div className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                      <User className="w-3 h-3" />
                      <span>@{user.name || user.address}</span>
                    </div>
                  </UserHoverCard>
                ))}
              </div>
            )}

            {/* Reply Button */}
            {currentUser && (
              <button
                onClick={() => onReply(comment._id)}
                className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          </button>
          {showReplies && (
            <div className="space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  currentUser={currentUser}
                  onReply={onReply}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};

export default CommentItem;
