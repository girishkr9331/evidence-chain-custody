import express from 'express';
import EvidenceComment from '../models/EvidenceComment.js';
import Evidence from '../models/Evidence.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all comments for a specific evidence
router.get('/evidence/:evidenceId', async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { includeReplies = 'true' } = req.query;

    // Build query to exclude deleted comments
    const query = { 
      evidenceId,
      isDeleted: false
    };

    // If not including replies, only get top-level comments
    if (includeReplies === 'false') {
      query.parentCommentId = null;
    }

    const comments = await EvidenceComment.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // If including replies, organize into threaded structure
    if (includeReplies === 'true') {
      const commentMap = {};
      const topLevelComments = [];

      // First pass: create map of all comments
      comments.forEach(comment => {
        comment.replies = [];
        commentMap[comment._id.toString()] = comment;
      });

      // Second pass: organize into tree structure
      comments.forEach(comment => {
        if (comment.parentCommentId) {
          const parentId = comment.parentCommentId.toString();
          if (commentMap[parentId]) {
            commentMap[parentId].replies.push(comment);
          }
        } else {
          topLevelComments.push(comment);
        }
      });

      return res.json(topLevelComments);
    }

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comments by a specific user
router.get('/user/:userAddress', authMiddleware, async (req, res) => {
  try {
    const { userAddress } = req.params;
    const comments = await EvidenceComment.find({ 
      author: userAddress.toLowerCase(),
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(comments);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comments where user is tagged
router.get('/tagged/:userAddress', authMiddleware, async (req, res) => {
  try {
    const { userAddress } = req.params;
    const comments = await EvidenceComment.find({ 
      'taggedUsers.address': userAddress.toLowerCase(),
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(comments);
  } catch (error) {
    console.error('Error fetching tagged comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comments that reference a specific evidence (tagged)
router.get('/tagged-evidence/:evidenceId', async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const comments = await EvidenceComment.find({ 
      'taggedEvidences.evidenceId': evidenceId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments with tagged evidence:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new comment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      evidenceId, 
      message, 
      taggedEvidences = [], 
      taggedUsers = [],
      parentCommentId = null
    } = req.body;

    // Validate required fields
    if (!evidenceId || !message || !message.trim()) {
      return res.status(400).json({ message: 'Evidence ID and message are required' });
    }

    // Get author information from authenticated user
    const author = req.user.address.toLowerCase();
    const user = await User.findOne({ address: author });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify evidence exists
    const evidence = await Evidence.findOne({ evidenceId });
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    // Verify parent comment exists if replying
    if (parentCommentId) {
      const parentComment = await EvidenceComment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      // Ensure parent comment is for the same evidence
      if (parentComment.evidenceId !== evidenceId) {
        return res.status(400).json({ message: 'Parent comment is for different evidence' });
      }
    }

    // Process tagged evidences (validate and cache names)
    const processedTaggedEvidences = [];
    for (const taggedEv of taggedEvidences) {
      if (taggedEv && taggedEv.evidenceId) {
        const evData = await Evidence.findOne({ evidenceId: taggedEv.evidenceId });
        if (evData) {
          processedTaggedEvidences.push({
            evidenceId: evData.evidenceId,
            fileName: evData.fileName || 'Unknown',
            caseId: evData.caseId
          });
        }
      }
    }

    // Process tagged users (validate and cache names)
    const processedTaggedUsers = [];
    for (const taggedUser of taggedUsers) {
      if (taggedUser && taggedUser.address) {
        const userData = await User.findOne({ address: taggedUser.address.toLowerCase() });
        if (userData) {
          processedTaggedUsers.push({
            address: userData.address,
            name: userData.name
          });
        }
      }
    }

    // Create comment
    const comment = new EvidenceComment({
      evidenceId,
      author,
      authorName: user.name,
      message: message.trim(),
      taggedEvidences: processedTaggedEvidences,
      taggedUsers: processedTaggedUsers,
      parentCommentId
    });

    await comment.save();

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a comment
router.put('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { message, taggedEvidences = [], taggedUsers = [] } = req.body;
    const author = req.user.address.toLowerCase();

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Find comment and verify ownership
    const comment = await EvidenceComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author !== author) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    if (comment.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit deleted comment' });
    }

    // Process tagged evidences
    const processedTaggedEvidences = [];
    for (const taggedEv of taggedEvidences) {
      if (taggedEv && taggedEv.evidenceId) {
        const evData = await Evidence.findOne({ evidenceId: taggedEv.evidenceId });
        if (evData) {
          processedTaggedEvidences.push({
            evidenceId: evData.evidenceId,
            fileName: evData.fileName || 'Unknown',
            caseId: evData.caseId
          });
        }
      }
    }

    // Process tagged users
    const processedTaggedUsers = [];
    for (const taggedUser of taggedUsers) {
      if (taggedUser && taggedUser.address) {
        const userData = await User.findOne({ address: taggedUser.address.toLowerCase() });
        if (userData) {
          processedTaggedUsers.push({
            address: userData.address,
            name: userData.name
          });
        }
      }
    }

    // Update comment
    comment.message = message.trim();
    comment.taggedEvidences = processedTaggedEvidences;
    comment.taggedUsers = processedTaggedUsers;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();

    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a comment (soft delete)
router.delete('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const author = req.user.address.toLowerCase();

    const comment = await EvidenceComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author !== author) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comment statistics for an evidence
router.get('/stats/:evidenceId', async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const totalComments = await EvidenceComment.countDocuments({ 
      evidenceId, 
      isDeleted: false 
    });

    const uniqueParticipants = await EvidenceComment.distinct('author', { 
      evidenceId, 
      isDeleted: false 
    });

    const taggedEvidencesCount = await EvidenceComment.countDocuments({
      evidenceId,
      isDeleted: false,
      'taggedEvidences.0': { $exists: true }
    });

    res.json({
      totalComments,
      uniqueParticipants: uniqueParticipants.length,
      commentsWithTags: taggedEvidencesCount
    });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
