import crypto from "crypto";
import Token from "../models/Token.js";
import User from "../models/User.js";

const FRONTEND_LOGIN_URL = "http://18.184.165.152/login";


const generateHtmlResponse = (title, message, linkHref = null, linkText = null, isError = false) => {
  const primaryColor = isError ? '#D8000C' : '#4CAF50';
  
  let linkHtml = '';
  if (linkHref && linkText) {
    linkHtml = `
      <a href="${linkHref}" style="display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        ${linkText}
      </a>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f4f4f4;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          text-align: center;
          padding: 40px;
          max-width: 450px;
          width: 100%;
          border-top: 5px solid ${primaryColor};
        }
        h1 {
          color: ${primaryColor};
          font-size: 24px;
          margin-top: 0;
          margin-bottom: 15px;
        }
        p {
          color: #555555;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 25px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <p>${message}</p>
        ${linkHtml}
      </div>
    </body>
    </html>
  `;
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const tokenDoc = await Token.findOne({
      tokenHash,
      type: "verify",
      used: false,
    });

    if (!tokenDoc) {
      const html = generateHtmlResponse(
        "Verification Failed",
        "This verification link is invalid or has already been used. You may need to register again.",
        FRONTEND_LOGIN_URL,
        "Back to Login",
        true
      );
      return res.status(400).send(html);
    }

    if (tokenDoc.expiresAt < new Date()) {
      const html = generateHtmlResponse(
        "Verification Failed",
        "Your verification link has expired. Please request a new verification email.",
        FRONTEND_LOGIN_URL,
        "Back to Login",
        true
      );
      return res.status(400).send(html);
    }
      
    const user = await User.findById(tokenDoc.userId);
    
    if (!user) {
      const html = generateHtmlResponse(
        "Verification Failed",
        "The user associated with this token could not be found.",
        FRONTEND_LOGIN_URL,
        "Back to Login",
        true
      );
      return res.status(404).send(html);
    }

    user.isVerified = true;
    await user.save();

    await Token.findByIdAndUpdate(tokenDoc._id, { used: true });

    const html = generateHtmlResponse(
      "Email Verified!",
      "Your email has been successfully verified. You can now log in.",
      FRONTEND_LOGIN_URL,
      "Proceed to Login",
      false
    );
    res.status(200).send(html);

  } catch (err) {
    console.error(err);
    const html = generateHtmlResponse(
      "Server Error",
      "An unexpected server error occurred during verification. Please try again later.",
      FRONTEND_LOGIN_URL,
      "Back to Login",
      true
    );
    res.status(500).send(html);
  }
};

export default verifyEmail;