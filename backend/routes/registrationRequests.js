import express from 'express';
import RegistrationRequest from '../models/RegistrationRequest.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Check registration status by wallet address (public endpoint)
router.get('/status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const request = await RegistrationRequest.findOne({ 
      address: address.toLowerCase() 
    }).select('-password'); // Don't send password back

    if (!request) {
      return res.status(404).json({ 
        message: 'No registration request found for this wallet address',
        status: 'NOT_FOUND'
      });
    }

    res.json({
      status: request.status,
      address: request.address,
      name: request.name,
      role: request.role,
      department: request.department,
      requestedAt: request.requestedAt,
      reviewedAt: request.reviewedAt,
      rejectionReason: request.rejectionReason
    });
  } catch (error) {
    console.error('Error checking registration status:', error);
    res.status(500).json({ message: 'Failed to check registration status' });
  }
});

// Get all registration requests (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status } = req.query;
    const query = status ? { status: status.toUpperCase() } : {};

    const requests = await RegistrationRequest.find(query)
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    res.status(500).json({ message: 'Failed to fetch registration requests' });
  }
});

// Get count of pending requests (admin only)
router.get('/count/pending', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const count = await RegistrationRequest.countDocuments({ status: 'PENDING' });
    res.json({ count });
  } catch (error) {
    console.error('Error counting pending requests:', error);
    res.status(500).json({ message: 'Failed to count pending requests' });
  }
});

// Approve registration request (admin only)
router.post('/:requestId/approve', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const request = await RegistrationRequest.findById(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Check if user already exists (safety check)
    const existingUser = await User.findOne({ address: request.address });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create the user
    // Note: password is already hashed in RegistrationRequest
    const user = new User({
      address: request.address,
      password: request.password,
      name: request.name,
      role: request.role,
      department: request.department,
      isActive: true
    });

    // Mark password as not modified to prevent re-hashing
    user.markModified('password');
    user.$locals.skipPasswordHash = true;
    
    await user.save();

    // Update the request status
    request.status = 'APPROVED';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user.userId;
    await request.save();

    res.json({
      message: 'Registration request approved successfully',
      user: {
        id: user._id,
        address: user.address,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Error approving registration request:', error);
    res.status(500).json({ message: 'Failed to approve registration request' });
  }
});

// Reject registration request (admin only)
router.post('/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { reason } = req.body;
    const request = await RegistrationRequest.findById(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update the request status
    request.status = 'REJECTED';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user.userId;
    request.rejectionReason = reason || 'No reason provided';
    await request.save();

    res.json({
      message: 'Registration request rejected',
      request: {
        id: request._id,
        address: request.address,
        status: request.status,
        rejectionReason: request.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error rejecting registration request:', error);
    res.status(500).json({ message: 'Failed to reject registration request' });
  }
});

// Delete registration request (admin only)
router.delete('/:requestId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const request = await RegistrationRequest.findByIdAndDelete(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    res.json({ message: 'Registration request deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration request:', error);
    res.status(500).json({ message: 'Failed to delete registration request' });
  }
});

export default router;
