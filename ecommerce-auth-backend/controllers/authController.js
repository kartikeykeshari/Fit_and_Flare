const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendEmail } = require('../utils/mailer');
const { sendSms } = require('../utils/sms');
const { Op } = require('sequelize');

const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_EXPIRE_MINUTES = Number(process.env.OTP_EXPIRE_MINUTES || 10);

function generateOtp(length = OTP_LENGTH) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

async function createAndSendOtp(user, type) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

  // store
  await Otp.create({ userId: user.id, code, type, expiresAt });

  // send via chosen medium
  if (type === 'email') {
    const subject = 'Your verification code';
    const text = `Your OTP code is: ${code}. It expires in ${OTP_EXPIRE_MINUTES} minutes.`;
    await sendEmail(user.email, subject, text, `<p>${text}</p>`);
  } else if (type === 'phone') {
    const body = `Your OTP code is: ${code}. It expires in ${OTP_EXPIRE_MINUTES} minutes.`;
    await sendSms(user.phone, body);
  } else if (type === 'login') {
    // Send to verified medium(s): if user has email & phone prefer email
    if (user.email) {
      const subject = 'Your login OTP';
      const text = `Your login OTP is: ${code}. It expires in ${OTP_EXPIRE_MINUTES} minutes.`;
      await sendEmail(user.email, subject, text, `<p>${text}</p>`);
    } else if (user.phone) {
      await sendSms(user.phone, `Your login OTP is: ${code}`);
    }
  }

  return code;
}

/**
 * Register: create user -> send OTP (email or phone based on choice)
 */
async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, phone, password, otpMethod } = req.body;
  try {
    // check existing
    const existing = await User.findOne({
      where: { [Op.or]: [{ email }, phone ? { phone } : null].filter(Boolean) }
    });
    if (existing) return res.status(400).json({ message: 'Email or phone already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, password_hash, is_verified: false });

    // create & send OTP (type = 'email' or 'phone')
    const chosen = otpMethod === 'phone' ? 'phone' : 'email';
    await createAndSendOtp(user, chosen);

    return res.status(201).json({ message: `User registered. OTP sent via ${chosen}.`, userId: user.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * Verify OTP endpoint (for registration or activation)
 * Body: { emailOrPhone, code }
 */
async function verifyOtp(req, res) {
  const { emailOrPhone, code } = req.body;
  if (!emailOrPhone || !code) return res.status(400).json({ message: 'emailOrPhone and code are required' });

  try {
    // find user by email or phone
    const user = await User.findOne({
      where: { [Op.or]: [{ email: emailOrPhone }, { phone: emailOrPhone }] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // find matching OTP not used and not expired
    const otp = await Otp.findOne({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt','DESC']]
    });

    if (!otp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    otp.used = true;
    await otp.save();

    user.is_verified = true;
    await user.save();

    return res.json({ message: 'OTP verified. Account activated.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * Resend OTP
 * Body: { emailOrPhone, type } type: 'email' or 'phone'
 */
async function resendOtp(req, res) {
  const { emailOrPhone, type } = req.body;
  if (!emailOrPhone || !type) return res.status(400).json({ message: 'emailOrPhone and type are required' });

  try {
    const user = await User.findOne({
      where: { [Op.or]: [{ email: emailOrPhone }, { phone: emailOrPhone }] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (type === 'email' && !user.email) return res.status(400).json({ message: 'User has no email' });
    if (type === 'phone' && !user.phone) return res.status(400).json({ message: 'User has no phone' });

    await createAndSendOtp(user, type);

    return res.json({ message: `OTP resent via ${type}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * Login: password check first. If OTP provided, validate OTP and return JWT.
 * If OTP not provided, generate login OTP (type 'login') and send to user's verified medium; return needOtp: true
 * Body: { emailOrPhone, password, otp (optional) }
 */
async function login(req, res) {
  const { emailOrPhone, password, otp } = req.body;
  if (!emailOrPhone || !password) return res.status(400).json({ message: 'emailOrPhone and password required' });

  try {
    const user = await User.findOne({
      where: { [Op.or]: [{ email: emailOrPhone }, { phone: emailOrPhone }] }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // If OTP provided — validate it
    if (otp) {
      const found = await Otp.findOne({
        where: {
          userId: user.id,
          code: otp,
          used: false,
          expiresAt: { [Op.gt]: new Date() }
        }
      });

      if (!found) return res.status(400).json({ message: 'Invalid or expired OTP' });
      found.used = true;
      await found.save();

      // issue JWT
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });
      return res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, name: user.name } });
    }

    // No OTP provided — create login OTP and send
    await createAndSendOtp(user, 'login');
    return res.json({ message: 'OTP sent for login', needOtp: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

/**
 * Get current user profile (JWT protected)
 */
async function me(req, res) {
  const user = req.user;
  return res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, is_verified: user.is_verified });
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  me
};
