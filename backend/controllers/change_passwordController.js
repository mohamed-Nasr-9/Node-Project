import bcrypt from "bcrypt";
import Joi from "joi";
import User from "../models/User.js";
import sendEmail from "../services/sendemail.js";

const newpasswordSchema = Joi.object({
  new_password: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .message("Password must contain at least one uppercase, one lowercase, and one number")
    .required(),
});


const password_change = async (req, res) => {
  try {
    const userId = req.user.id;

    const { old_password, new_password , confirm_password} = req.body;
    const { error } = newpasswordSchema.validate({ new_password });
    if(error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    if (!old_password || !new_password || !confirm_password) {
      return res.status(400).json({ error: "Old and new passwords are required" });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ error: "New passwords do not match" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const verifying_old_password = await bcrypt.compare(old_password, user.passwordHash);
    if (!verifying_old_password) {
      return res.status(400).json({ error: "Incorrect old password" });
    }

    user.passwordHash = await bcrypt.hash(new_password, 10);
    await user.save();

  const fullName = `${req.user.FirstName} ${req.user.LastName}`;

  await sendEmail(
    req.user.email,
    " Password Changed Successfully",
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 20px; background-color: #fafafa;">
      <h2 style="color: #2c3e50; text-align: center;">Password Changed Successfully</h2>
      <p style="font-size: 16px; color: #555;">
        Hello <strong>${fullName || "User"}</strong>,
      </p>
      <p style="font-size: 15px; color: #555;">
        This is a confirmation that your account password was successfully changed.
      </p>
      <p style="font-size: 15px; color: #555;">
        You can now sign in using your new password.
      </p>

      <div style="text-align: center; margin: 25px 0;">
        <a href="http://18.184.165.152/login" target="_blank" 
          style="background-color: #28a745; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; display: inline-block; font-weight: bold;">
          Go to Login
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        © ${new Date().getFullYear()} Bookly. All rights reserved.
      </p>
    </div>
    `
  );

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export default password_change;