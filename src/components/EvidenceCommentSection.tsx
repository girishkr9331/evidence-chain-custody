import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Users, Tag, AlertCircle } from 'lucide-react';
import commentService, { Comment, CreateCommentData, TaggedEvidence, TaggedUser } from '../services/commentService';
import CommentItem from './CommentItem';
import EvidenceTagInput from './EvidenceTagInput';
import UserTagInput from './UserTagInput';
import { useAuth } from '../context/AuthContext';

interface EvidenceCommentSectionProps {
  evidenceId: string;
  evidenceName?: string;
}

const EvidenceCommentSection: React.FC<EvidenceCommentSectionProps> = ({ 
  evidenceId
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [taggedEvidences, setTaggedEvidences] = useState<TaggedEvidence[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalComments: 0, uniqueParticipants: 0, commentsWithTags: 0 });

  useEffect(() => {
    loadComments();
    loadStats();
  }, [evidenceId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getCommentsByEvidence(evidenceId, true);
      setComments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await commentService.getCommentStats(evidenceId);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    if (!user) {
      setError('You must be logged in to comment');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const commentData: CreateCommentData = {
        evidenceId,
        message: message.trim(),
        taggedEvidences: taggedEvidences.length > 0 ? taggedEvidences : undefined,
        taggedUsers: taggedUsers.length > 0 ? taggedUsers : undefined,
        parentCommentId: replyingTo || undefined
      };

      await commentService.createComment(commentData);
      
      // Reset form
      setMessage('');
      setTaggedEvidences([]);
      setTaggedUsers([]);
      setReplyingTo(null);

      // Reload comments and stats
      await loadComments();
      await loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    // Scroll to comment form
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      await loadComments();
      await loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Discussion
          </h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-4 h-4" />
            <span>{stats.totalComments} comments</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{stats.uniqueParticipants} participants</span>
          </div>
          <div className="flex items-center space-x-1">
            <Tag className="w-4 h-4" />
            <span>{stats.commentsWithTags} tagged</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} id="comment-form" className="mb-6">
          {replyingTo && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Replying to a comment...
              </span>
              <button
                type="button"
                onClick={handleCancelReply}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="mb-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your insights about this evidence..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
              disabled={submitting}
            />
          </div>

          {/* Tagging Section */}
          <div className="mb-3 space-y-3">
            <EvidenceTagInput
              selectedEvidences={taggedEvidences}
              onChange={setTaggedEvidences}
              currentEvidenceId={evidenceId}
            />
            <UserTagInput
              selectedUsers={taggedUsers}
              onChange={setTaggedUsers}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {message.length}/5000 characters
            </div>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to join the discussion
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to share your insights!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUser={user}
              onReply={handleReply}
              onDelete={handleDelete}
              onUpdate={loadComments}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EvidenceCommentSection;
