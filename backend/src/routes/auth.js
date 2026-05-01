import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { OtpCode } from "../models/OtpCode.js";
import axios from "axios";
import { JWT_SECRET } from "../config/env.js";

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpCode.create({ email, code, expiresAt });

    // Send email using EmailJS REST API
    await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
      service_id: "service_ete4lav",
      template_id: "template_kzqg4s8",
      user_id: "2JzyehwB9hQt0Fo66",
      accessToken: "NQVMklDulRuMAj_ujCK2h",
      template_params: {
        to_email: email,
        otp_code: code
      }
    });

    console.log(`📧 [PROD] OTP sent to ${email}`);

    res.status(201).json({ userId: user._id, email, message: "OTP sent" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpCode.create({ email, code, expiresAt });

    // Send email using EmailJS REST API
    await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
      service_id: "service_ete4lav",
      template_id: "template_kzqg4s8",
      user_id: "2JzyehwB9hQt0Fo66",
      accessToken: "NQVMklDulRuMAj_ujCK2h",
      template_params: {
        to_email: email,
        otp_code: code
      }
    });

    console.log(`📧 [PROD] OTP sent to ${email}`);

    res.json({ email, message: "OTP sent" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const record = await OtpCode.findOne({ email, code, used: false });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    record.used = true;
    await record.save();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ sub: user._id }, JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
