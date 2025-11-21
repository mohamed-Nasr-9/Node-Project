import crypto from "crypto";
import Token from "../models/Token.js";
import User from "../models/User.js";
import sendEmail from "../services/sendemail.js";

const pass_forgot = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "User Not Found" });

    await newPasswordResetToken(user);

    res.json({ message: "Reset Email Has been sent to your email." });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export async function newPasswordResetToken(user) {
    const reset_token = crypto.randomBytes(32).toString("hex");
    const hashed_token = crypto.createHash("sha256").update(reset_token).digest("hex");

    await Token.create({
      userId: user._id,
      type: "reset",
      tokenHash: hashed_token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), 
      used: false,
    });

    const resetLink = `http://18.184.165.152/password-management/reset-password/${reset_token}`;
    //const resetLink = `http://localhost:4200/password-management/reset-password/${reset_token}`;

    const fullName = `${user.FirstName} ${user.LastName}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 20px; background-color: #fafafa;">
      <h2 style="color: #000000ff; text-align: center;">🔐 Password Reset Request</h2>
      <p style="font-size: 16px; color: #555;">
        Hello <strong>${fullName || "User"}</strong>,
      </p>
      <p style="font-size: 15px; color: #f93c65ff;">
        We received a request to reset your account password. If you made this request, please click the button below to set a new password.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" target="_blank" 
          style="background-color: #e11d48; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; display: inline-block; font-weight: bold;">
          Reset Password
        </a>
      </div>

      <p style="font-size: 14px; color: #777;">
        This link will expire in <strong>15 minutes</strong> for security reasons.
      </p>

      <p style="font-size: 14px; color: #777;">
        If you didn’t request this change, you can safely ignore this email — your account will remain secure.
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">

      <p style="font-size: 12px; color: #aaa; text-align: center;">
        © ${new Date().getFullYear()} Your Company Name. All rights reserved.
      </p>
    </div>
  `;

    await sendEmail(user.email, "Password Reset Request", html);
}

export default pass_forgot;