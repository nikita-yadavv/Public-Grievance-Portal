const User = require('../models/User');
const Grievance = require('../models/Grievance');
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
    const { name, email, phone, password, role, department, isPhoneVerified } = req.body;

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

    // Generate a token for optional email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: (phone || '').trim(),
      isPhoneVerified: Boolean(isPhoneVerified),
      password: hashedPassword,
      role: assignedRole,
      department: department || (isOfficer ? 'Public Works' : 'General'),
      isApproved: !isOfficer, // officers need Chief's approval before they can log in
      isEmailVerified: false,
      emailVerificationToken: verificationToken
    });

    // Send verification email in background (optional verification)
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
        message: 'Officer registration submitted! After review, the Chief Municipal Officer will approve your account.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          department: user.department,
          isApproved: false,
          isEmailVerified: false
        }
      });
    }

    // Citizens can sign in immediately
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      verificationUrl,
      previewUrl,
      message: 'Account created successfully! You can sign in immediately.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
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
    const { password } = req.body;
    const identifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or phone number and password' });
    }

    // Find user by either email or phone number
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone number or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone number or password' });
    }

    // Officers still require Chief Officer approval
    if (user.role === 'admin' && user.isApproved === false) {
      return res.status(403).json({
        success: false,
        isPendingApproval: true,
        message: 'Your officer account is pending approval by the Chief Municipal Officer. Please contact administration.'
      });
    }

    // Email verification is optional — does not block login!
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        department: user.department,
        isApproved: user.isApproved,
        isEmailVerified: user.isEmailVerified
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

    const { name, email, phone, password } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone.trim();

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
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        department: updatedUser.department
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

// DELETE /api/auth/profile (delete current user profile)
const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Safety: Chief Municipal Officer account cannot be self-deleted
    if (req.user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'The Chief Municipal Officer (Super Admin) account cannot be deleted.'
      });
    }

    // Clean up grievances filed by the citizen
    if (req.user.role === 'citizen') {
      await Grievance.deleteMany({ citizen: userId });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Your account has been deleted successfully.'
    });
  } catch (error) {
    console.error('[Delete Profile Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete profile' });
  }
};

// Map to store OTPs during registration or verification
const otpStore = new Map();

// POST /api/auth/send-otp
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    const cleanPhone = phone.trim();
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanPhone, { otp, expires });

    const existingUser = await User.findOne({ phone: cleanPhone });
    if (existingUser) {
      existingUser.otp = otp;
      existingUser.otpExpires = new Date(expires);
      await existingUser.save();
    }

    console.log(`\n📱 [Phone OTP Service]: Verification code for ${cleanPhone} → [ ${otp} ] (Expires in 10m)\n`);

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${cleanPhone}`,
      otp, // Provided for easy development / demo testing
      expiresInMinutes: 10
    });
  } catch (error) {
    console.error('[Send OTP Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
  }
};

// POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide phone number and OTP' });
    }

    const cleanPhone = phone.trim();
    const enteredOtp = otp.trim();

    const stored = otpStore.get(cleanPhone);
    let isValid = false;

    if (stored && stored.otp === enteredOtp && stored.expires > Date.now()) {
      isValid = true;
      otpStore.delete(cleanPhone);
    }

    const user = await User.findOne({ phone: cleanPhone });
    if (user && user.otp === enteredOtp && user.otpExpires && user.otpExpires > Date.now()) {
      isValid = true;
      user.isPhoneVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
    } else if (user && isValid) {
      user.isPhoneVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully!'
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify OTP' });
  }
};

// POST /api/auth/send-verification-email (Trigger verification from user profile)
const sendVerificationEmailToMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ success: true, alreadyVerified: true, message: 'Your email address is already verified.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    await user.save();

    const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken);
    const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;

    res.status(200).json({
      success: true,
      message: `Verification link sent to ${user.email}`,
      verificationUrl,
      previewUrl: emailResult?.previewUrl || null
    });
  } catch (error) {
    console.error('[Send Verification Email Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send verification email' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  deleteProfile,
  getOfficers,
  approveOfficer,
  deleteOfficer,
  verifyEmail,
  sendOTP,
  verifyOTP,
  sendVerificationEmailToMe
};
