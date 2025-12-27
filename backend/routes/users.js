import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only) - with search support
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    // If search query is provided, search by name or address
    if (search && search.trim()) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create user (admin function - bypasses password requirement)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { address, name, role, department } = req.body;

    console.log('📝 User creation request received:', { address, name, role, department });

    // Validate required fields
    if (!address || !name || !role || !department) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields: address, name, role, department' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ address: address.toLowerCase() });
    if (existingUser) {
      console.log('⚠️ User already exists in database:', address);
      return res.status(400).json({ message: 'User already exists in database' });
    }

    // Map blockchain role numbers to backend role names
    const roleMapping = {
      '1': 'POLICE',
      '2': 'INVESTIGATOR',
      '3': 'FORENSIC_LAB',
      '4': 'COURT',
      '5': 'CYBER_UNIT'
    };

    const roleName = roleMapping[role.toString()] || role;
    console.log('👤 Creating user with role:', roleName);

    // Create user with a default/temporary password
    // The user will need to set their password on first login
    const defaultPassword = `temp_${address.slice(2, 10)}`;
    
    const user = new User({
      address: address.toLowerCase(),
      password: defaultPassword,
      name,
      role: roleName,
      department,
      isActive: true
    });

    await user.save();
    console.log('✅ User saved to database successfully:', user._id);

    res.status(201).json({ 
      message: 'User created successfully in database',
      user: {
        id: user._id,
        address: user.address,
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive
      },
      note: 'User created with temporary password. They should register/login to set their actual password.'
    });
  } catch (error) {
    console.error('❌ User creation error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      message: 'Failed to create user in database',
      error: error.message 
    });
  }
});

// Update user status
router.patch('/:address/status', authenticateToken, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Update user role
router.patch('/:address/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    
    console.log('📝 Role update request:', { address: req.params.address, role });
    
    // Validate role
    const validRoles = ['POLICE', 'INVESTIGATOR', 'FORENSIC_LAB', 'COURT', 'CYBER_UNIT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findOneAndUpdate(
      { address: req.params.address.toLowerCase() },
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Role updated successfully:', user.role);

    res.json({ 
      message: 'User role updated successfully',
      user 
    });
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/:address', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ 
      address: req.params.address.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get user by address (must be last to avoid conflicts with other routes)
router.get('/:address', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ 
      address: req.params.address.toLowerCase() 
    }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

export default router;
