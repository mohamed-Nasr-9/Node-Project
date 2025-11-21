import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Token from "../models/Token.js";
import sendEmail from "../services/sendemail.js";
import { registerSchema } from "../validators/register.validation.js";

const user_register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { FirstName, LastName, email, password, confirmPassword, addresses } = req.body;

    if (!FirstName || !LastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const userexists = await User.findOne({ email });
    if (userexists) {
      return res.status(409).json({ error: "Email already exists" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const hashed_password = await bcrypt.hash(password, 10);

    const newuser = new User({
      FirstName,
      LastName,
      email,
      passwordHash: hashed_password,
      role: "user",
      isVerified: false,
      addresses,
      isDeleted: false,
      deletedAt: null,
    });

    await newuser.save();

    await newEmailVerificationToken(newuser.email,newuser);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newuser._id,
        FirstName: newuser.FirstName,
        LastName: newuser.LastName,
        email: newuser.email,
        role: newuser.role,
        isVerified: newuser.isVerified,
        addresses: newuser.addresses,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export  async function newEmailVerificationToken(email,newuser) 
  {
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(verifyToken).digest("hex");

    await Token.create({
      userId: newuser._id,
      type: "verify",
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
    });
    const verifyLink = `http://18.184.165.152/api/auth/verify/${verifyToken}`;
    //const verifyLink = `http://localhost:3000/api/auth/verify/${verifyToken}`;

    const html = `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verifyLink}" target="_blank">${verifyLink}</a>
        <p>This link will expire in 15 minutes.</p>
      `;

    await sendEmail(email, "Verify your email address", html);
  }
export default user_register;