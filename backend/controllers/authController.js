import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import sendEmail from "../services/sendemail.js";


// Login function
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if(user.isDeleted){
      return res.status(401).json({error:'Email has been deleted please restore before you can use it again '});
    }
    if (!user.isVerified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await Session.deleteMany({ userId: user._id });

    const token = jwt.sign(
      { id: user._id, FirstName: user.FirstName, LastName: user.LastName, email: user.email, addresses: user.addresses, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await Session.create({
      userId: user._id,
      token: token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        addresses: user.addresses,
        role: user.role
      }
    });

    await sendLoginAlertEmail(user, req);


  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization?.split(' ')[1];

    await Session.deleteOne({ userId: userId, token: token });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


const sendLoginAlertEmail = async (user, req) => {
  try {
    let ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "Unknown";

    if (typeof ip === "string" && ip.includes(":")) {
      ip = ip.split(":").pop();
    }
    const loginTime = new Date().toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
      hour12: true,
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#222; padding:24px; background:#f6f8fa;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.06);">
          
          <div style="padding:20px 24px; border-bottom:1px solid #f93c65ff; display:flex; align-items:center; gap:12px;">
            <div>
              <h2 style="margin:0; font-size:18px; color:#f93c65ff;">We noticed a new login to your account</h2>
              <p style="margin:4px 0 0; color:#f93c65ff; font-size:13px;">If this was you, you can safely ignore this message.</p>
            </div>
          </div>

          <div style="padding:20px 24px;">
            <p style="margin:0 0 12px; color:#333;">Hi <strong>${user.FirstName || "there"}</strong>,</p>

            <p style="margin:0 0 14px; color:#f93c65ff;">We noticed a new sign-in to your account. Here are the details:</p>

            <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
              <tr>
                <td style="padding:8px 0; width:120px; color:#6b7280; font-size:13px;">IP Address</td>
                <td style="padding:8px 0; color:#111; font-weight:600;">${ip}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#6b7280; font-size:13px;">Time</td>
                <td style="padding:8px 0; color:#111; font-weight:600;">${loginTime}</td>
              </tr>
            </table>

            <p style="margin:0 0 18px; color:#333;">If this wasn't you, please secure your account immediately.</p>

            <p style="margin:0 0 24px;">
              <a href="http://18.184.165.152/login" style="display:inline-block; padding:10px 16px; background:#f93c65ff; color:#eef2f6; text-decoration:none; border-radius:6px; font-weight:600;">Secure my account</a>
            </p>
          </div>
          <div style="padding:14px 24px; background:#fbfdff; border-top:1px solid #eef2f6; color:#6b7280; font-size:13px;">
            Bookly BookStore Security Team
          </div>
        </div>
      </div>
    `;
    await sendEmail(user.email, "Login Alert", html);
  } catch (error) {
    console.error("Error sending login alert email:", error);
  }
};

export { login, logout };