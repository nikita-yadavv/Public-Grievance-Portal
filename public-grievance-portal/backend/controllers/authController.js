const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const assignedRole = role && ['citizen', 'admin'].includes(role) ? role : 'citizen';
    const isOfficer = assignedRole === 'admin';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a one-time token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      department: department || (isOfficer ? 'Public Works' : 'General'),
      isApproved: !isOfficer, // officers need Chief's approval before they can log in
      isEmailVerified: false,
      emailVerificationToken: verificationToken
    });

    // Send verification email
    let emailResult = null;
    try {
      emailResult = await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailErr) {
      console.error('[Email Error]:', emailErr.message);
    }

    const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
    const previewUrl = emailResult?.previewUrl || null;

    if (isOfficer) {
      return res.status(201).json({
        success: true,
        isPendingApproval: true,
        verificationUrl,
        previewUrl,
        message: 'Officer registration submitted! Please verify your email to continue. After email verification, the Chief Municipal Officer will review and approve your account.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          isApproved: false,
          isEmailVerified: false
        }
      });
    }

    res.status(201).json({
      success: true,
      needsVerification: true,
      verificationUrl,
      previewUrl,
      message: `Account created! Please verify your email to activate your account.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isEmailVerified: false
      }
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.role === 'admin' && user.isApproved === false) {
      return res.status(403).json({
        success: false,
        isPendingApproval: true,
        message: 'Your officer account is pending approval by the Chief Municipal Officer. Please contact administration.'
      });
    }

    // Superadmin accounts are pre-verified during seeding
    if (user.role !== 'superadmin' && user.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        isEmailUnverified: true,
        message: 'Please verify your email address before signing in. Check your inbox for the verification link.'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, password } = req.body;

    if (name) user.name = name;

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email address is already in use by another account' });
      }
      user.email = email.toLowerCase();
    }

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating profile' });
  }
};

// GET /api/auth/officers  (superadmin only)
const getOfficers = async (req, res) => {
  try {
    const officers = await User.find({ role: { $in: ['admin', 'superadmin'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: officers.length, officers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching officers' });
  }
};

// PATCH /api/auth/officers/:id/approve  (superadmin only)
const approveOfficer = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const officer = await User.findById(req.params.id);

    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer account not found' });
    }

    officer.isApproved = isApproved !== undefined ? isApproved : true;
    await officer.save();

    res.status(200).json({
      success: true,
      message: `Officer ${officer.name} is now ${officer.isApproved ? 'Approved' : 'Suspended'}`,
      officer: {
        id: officer._id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        department: officer.department,
        isApproved: officer.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating officer status' });
  }
};

// DELETE /api/auth/officers/:id  (superadmin only)
const deleteOfficer = async (req, res) => {
  try {
    const officer = await User.findById(req.params.id);
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    if (officer.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Cannot delete Chief Municipal Officer account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Officer account for ${officer.name} has been removed`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting officer' });
  }
};

// GET /api/auth/verify-email?token=<token>
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is missing' });
    }

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link. Please register again.' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ success: true, alreadyVerified: true, message: 'Your email is already verified. You can sign in.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to the Public Grievance Portal.',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved,
        isEmailVerified: true
      }
    });
  } catch (error) {
    console.error('[VerifyEmail Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during verification' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  getOfficers,
  approveOfficer,
  deleteOfficer,
  verifyEmail
};
