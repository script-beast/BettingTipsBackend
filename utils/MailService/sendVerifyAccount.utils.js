const nodemailer = require("nodemailer");

const emailTemplateVerifyAccount = (name, otp) => {
  return `<div>
    <p>Dear ${name},</p>
    <p>We have received a request for verifying your account. Please use the following OTP (One-Time Password) to proceed:</p>
    <h2>${otp}</h2>
    <p>If you did not request this, please ignore this email.</p>
    <p>If you have any questions or concerns, please contact our support team at <a href="mailto:${process.env.SUPPORT_MAIL}">${process.env.SUPPORT_MAIL}</a>.</p>
    <p>Thank you!</p>
    <p>Best regards,</p>
    <p>The Jordanspicks.com Team</p>
</div>`;
};

const sendVerifyAccount = async (email, name, otp, title) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_PASSWORD,
        // refreshToken: process.env.REFRESH_TOKEN,
      },
    });

    const mailOptions = {
      from: { name: process.env.MAIL_USER, address: process.env.MAIL_EMAIL },
      to: email,
      subject: title,
      html: emailTemplateVerifyAccount(name, otp),
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendVerifyAccount;
// export default sendOTP;
