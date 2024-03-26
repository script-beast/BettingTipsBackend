const nodemailer = require("nodemailer");

const emailtemplateotp = (name, package) => {
  return `<div>
    <p>🙋‍♂️ Hey ${name}, are you ready for some action?</p>
    <p>🙋‍♂️ We've got some awesome packages for <a href="jordanspicks.com">Jordanspicks.com</a> that are out NOW! And guess what? You've got ($$) in your wallet to spend on them! 💸 </p> 
    <ul>
    ${
      package &&
      package.map(
        (item) =>
          `<li>${item.name} - ${item.gamePreview}</li>`
      )
    }
    </ul> 
    <p>Don't miss this chance to win big with our expert picks and profit guarantee. Trust us, you'll be laughing all the way to the bank. 😉 </p> 
    <p>Hurry up and grab your package before the games start. We can't wait to see you on the winning side. 🏆</p>
    <p>All the best,</p> 
    <p>Team Jordanspicks.com 😘</p>
</div>`;
};

const sendOTP = async (email, otp, title, package) => {
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
      from:{name : process.env.MAIL_USER,address :process.env.MAIL_EMAIL},
      to: email,
      subject: title,
      html: emailtemplateotp(otp, package),
    };

    const result = await transporter.sendMail(mailOptions);
    // console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendOTP;
// export default sendOTP;
