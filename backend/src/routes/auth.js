const r = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// POST /api/auth/login
r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/register
r.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    // Validate required fields
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Validate email format
    if (!EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'citizen',
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.status(201).json({ token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
});

// Upsert the admin user on startup
r.ensureAdmin = async () => {
  const { ADMIN_EMAIL: e, ADMIN_PASSWORD: p } = process.env;
  if (!e || !p || !process.env.JWT_SECRET) {
    throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD and JWT_SECRET must be set in .env');
  }
  const passwordHash = await bcrypt.hash(p, 10);
  await User.findOneAndUpdate(
    { email: e.toLowerCase() },
    { name: 'CivicAI Admin', passwordHash, role: 'admin' },
    { upsert: true }
  );
};

module.exports = r;
