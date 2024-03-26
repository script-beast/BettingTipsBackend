const nodemailer = require("nodemailer");

const emailTemplateResetPassword = (name, otp) => {
  return `<div>
    <p>Dear ${name},</p>
    <p>We have received a request to reset your password. Please use the following OTP (One-Time Password) to proceed:</p>
    <h2>${otp}</h2>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>If you have any questions or concerns, please contact our support team at <a href="mailto:support@jordanspicks.com">support@jordanspicks.com</a>.</p>
    <p>Thank you!</p>
    <p>Best regards,</p>
    <p>The Jordanspicks.com Team</p>
</div>`;
};

const sendResetPassword = async (email, name, otp, title) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
        // refreshToken: process.env.REFRESH_TOKEN,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_EMAIL,
      to: email,
      subject: title,
      html: emailTemplateResetPassword(name, otp),
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendResetPassword;
// export default sendOTP;
