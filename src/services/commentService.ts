import api from '../config/api';

export interface TaggedEvidence {
  evidenceId: string;
  fileName?: string;
  caseId?: string;
}

export interface TaggedUser {
  address: string;
  name?: string;
}

export interface Comment {
  _id: string;
  evidenceId: string;
  author: string;
  authorName: string;
  message: string;
  taggedEvidences: TaggedEvidence[];
  taggedUsers: TaggedUser[];
  parentCommentId?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface CreateCommentData {
  evidenceId: string;
  message: string;
  taggedEvidences?: TaggedEvidence[];
  taggedUsers?: TaggedUser[];
  parentCommentId?: string;
}

export interface UpdateCommentData {
  message: string;
  taggedEvidences?: TaggedEvidence[];
  taggedUsers?: TaggedUser[];
}

export interface CommentStats {
  totalComments: number;
  uniqueParticipants: number;
  commentsWithTags: number;
}

class CommentService {
  /**
   * Get all comments for a specific evidence
   */
  async getCommentsByEvidence(evidenceId: string, includeReplies = true): Promise<Comment[]> {
    try {
      const response = await api.get(`/api/comments/evidence/${evidenceId}`, {
        params: { includeReplies: includeReplies.toString() }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch comments');
    }
  }

  /**
   * Get comments by a specific user
   */
  async getCommentsByUser(userAddress: string): Promise<Comment[]> {
    try {
      const response = await api.get(`/api/comments/user/${userAddress}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user comments');
    }
  }

  /**
   * Get comments where user is tagged
   */
  async getCommentsWithUserTagged(userAddress: string): Promise<Comment[]> {
    try {
      const response = await api.get(`/api/comments/tagged/${userAddress}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tagged comments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch tagged comments');
    }
  }

  /**
   * Get comments that reference a specific evidence (tagged)
   */
  async getCommentsWithEvidenceTagged(evidenceId: string): Promise<Comment[]> {
    try {
      const response = await api.get(`/api/comments/tagged-evidence/${evidenceId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching comments with tagged evidence:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch comments with tagged evidence');
    }
  }

  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentData): Promise<Comment> {
    try {
      const response = await api.post('/api/comments', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to create comment');
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(commentId: string, data: UpdateCommentData): Promise<Comment> {
    try {
      const response = await api.put(`/api/comments/${commentId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to update comment');
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      await api.delete(`/api/comments/${commentId}`);
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete comment');
    }
  }

  /**
   * Get comment statistics for an evidence
   */
  async getCommentStats(evidenceId: string): Promise<CommentStats> {
    try {
      const response = await api.get(`/api/comments/stats/${evidenceId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching comment stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch comment stats');
    }
  }
}

export default new CommentService();
