const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { ERROR_CODES } = require('../utils/constants');

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_EMAIL_EXISTS,
          message: 'Email is already registered'
        }
      });
    }

    // Force CUSTOMER role for public registration (BR-002)
    const user = new User({
      name,
      email,
      password,
      phone,
      role: 'CUSTOMER'
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid email or password.'
        }
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid email or password.'
        }
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // JWT is stateless; client removes token.
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid email or password.'
        }
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid email or password.'
        }
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Access denied. Administrator privileges required.'
        }
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getMe,
  logout
};
