import bcrypt from "bcrypt";
import User from "../models/User.js";
import Token from "../models/Token.js";
import { logout } from "../controllers/authController.js";
import sendEmail from "../services/sendemail.js";
import { newEmailVerificationToken } from "./registerController.js";
import crypto from 'crypto';

// Helper Functions
const formatUser = (user) => ({
  id: user._id,
  FirstName: user.FirstName,
  LastName: user.LastName,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  addresses: user.addresses,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const formatAddress = (address) => ({
  id: address._id,
  label: address.label,
  fullName: address.fullName,
  phone: address.phone,
  line1: address.line1,
  line2: address.line2,
  city: address.city,
  state: address.state,
  country: address.country,
  postalCode: address.postalCode,
  isDefault: address.isDefault
});

// Profile Functions
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Profile retrieved successfully', user: formatUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { FirstName, LastName, email } = req.body;
    if (!FirstName && !LastName && !email) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updateData = {};

    // Update FirstName
    if (FirstName && FirstName !== user.FirstName) {
      updateData.FirstName = FirstName;
    } else if (FirstName) {
      return res.status(400).json({ error: 'First name is the same as the current one' });
    }

    // Update LastName
    if (LastName && LastName !== user.LastName) {
      updateData.LastName = LastName;
    } else if (LastName) {
      return res.status(400).json({ error: 'Last name is the same as the current one' });
    }

    // Update Email
    if (email) {
      const newEmail = email.toLowerCase();
      if (newEmail === user.email) {
        return res.status(400).json({ error: 'Email is the same as the current one' });
      }
      const existingUser = await User.findOne({ email: newEmail, _id: { $ne: userId } });
      if (existingUser) return res.status(400).json({ error: 'Email is already taken' });

      updateData.email = newEmail;
      updateData.isVerified = false;
      await newEmailVerificationToken(newEmail, user);
      await logout(req, res);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-passwordHash');
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        FirstName: updatedUser.FirstName,
        LastName: updatedUser.LastName,
        email: updatedUser.email,
        role: updatedUser.role,
        addresses: updatedUser.addresses,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isPasswordValid = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!isPasswordValid) return res.status(400).json({ error: 'Incorrect password' });

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isVerified = false;
    await user.save();

    await sendEmail(user.email, "Account Deleted Successfully", 
      `<h2>Deleted Your Account</h2><p>Your Account Has Been Deleted Successfully</p>`);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Address Functions
const AddAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { label, fullName, phone, line1, line2, city, state, country, postalCode, isDefault } = req.body;
    user.addresses.push({ label, fullName, phone, line1, line2, city, state, country, postalCode, isDefault: isDefault || false });
    await user.save();

    res.json({ message: "Address added successfully" });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { addressId, ...addressUpdates } = req.body;
    if (!addressId) return res.status(400).json({ error: 'Address ID is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ error: 'Address not found' });

    const allowedFields = ['label', 'fullName', 'phone', 'line1', 'line2', 'city', 'state', 'country', 'postalCode', 'isDefault'];
    const hasFieldsToUpdate = allowedFields.some(field => addressUpdates.hasOwnProperty(field));
    if (!hasFieldsToUpdate) return res.status(400).json({ error: 'No fields to update' });

    allowedFields.forEach(field => {
      if (addressUpdates.hasOwnProperty(field)) address[field] = addressUpdates[field];
    });

    await user.save();
    const updatedAddress = user.addresses.id(addressId);

    res.json({ message: 'Address updated successfully', address: formatAddress(updatedAddress) });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    if (!addressId) return res.status(400).json({ error: 'Address ID is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.addresses.id(addressId)) return res.status(404).json({ error: 'Address not found' });

    user.addresses.pull(addressId);
    await user.save();

    res.json({ message: 'Address deleted successfully', addresses: user.addresses });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Account Restoration Functions
const requestRestoreAccount = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.isDeleted) return res.status(400).json({ error: "Account is already active" });

    const restoreToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(restoreToken).digest("hex");

    await Token.create({
      userId: user._id,
      type: "restore",
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used: false,
    });

    const restoreLink = `http://18.184.165.152/account/restored-account/${restoreToken}`;
    await sendEmail(user.email, "Restore Your Account",
      `<h2>Restore Your Account</h2>
      <p>Click the link below to restore your account:</p>
      <a href="${restoreLink}" target="_blank">${restoreLink}</a>
      <p>This link will expire in 24 hours.</p>`);

    res.json({ message: "Restore link sent to your email" });
  } catch (error) {
    console.error("Request restore error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const restoreAccount = async (req, res) => {
  try {
    const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const tokenDoc = await Token.findOne({ tokenHash, type: "restore", used: false });

    if (!tokenDoc) return res.status(400).json({ error: "Invalid or used restore link" });
    if (tokenDoc.expiresAt < new Date()) return res.status(400).json({ error: "Restore link has expired" });

    const user = await User.findById(tokenDoc.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    await newEmailVerificationToken(user.email, user);
    tokenDoc.used = true;
    await tokenDoc.save();

    res.json({ message: "Account restored successfully. You can now log in again." });
  } catch (error) {
    console.error("Restore account error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export {
  getProfile,
  updateProfile,
  deleteAccount,
  AddAddress,
  updateAddress,
  deleteAddress,
  requestRestoreAccount,
  restoreAccount
};
