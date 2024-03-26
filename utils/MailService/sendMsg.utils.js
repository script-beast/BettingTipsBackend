const nodemailer = require("nodemailer");

const emailtemplateotp = (name) => {
  return `<div>
    <p>Hi ${name},</p>
    <p>Thank you for signing up to Jordanspicks.com, the ultimate destination for sports betting enthusiasts!</p>
    <p>You have made a smart choice by joining our community of winners. As a valued member, you will enjoy the following benefits:</p>
    <ul>
        <li>Access to amazing sports pick packages for various leagues and events, including NFL, NBA, MLB, NHL, UFC, and more!</li>
        <li>Penthouse Club Telegram Channel, get insider tips, and receive special offers and bonuses!</li>
        <li>Unlimited access to daily content, such as articles, expert analysis, predictions, and advice from Jordan and her team!</li>
        <li>Profit Guarantee on every standard package you purchase. If the bet loses, you get a store credit right back automatically on your account. No muss no fuss.</li>
    </ul>
    <p>To get started, simply log in to your account and browse our selection of sports pick packages. Choose the one that suits your budget and preferences, and place your bets with confidence. You can also join the Penthouse Club Telegram Channel by clicking the link in your account dashboard.</p>
    <p>We are thrilled to have you on board and we look forward to helping you win big!</p>
    <p>If you have any questions or feedback, please feel free to contact us at <a href="mailto:${process.env.SUPPORT_MAIL}">${process.env.SUPPORT_MAIL}</a>. We are always happy to hear from you.</p>
    <p>Happy betting!</p>
    <p>Jordan and the Jordanspicks.com team</p>
</div>`;
};

const sendOTP = async (email, otp, title) => {
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
      // user: process.env.MAIL_EMAIL,
      to: email,
      subject: title,
      html: emailtemplateotp(otp),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendOTP;
// export default sendOTP;
