import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "darshanjethani934@gmail.com",
    pass: "vgffyzzzxlpvslbv",
  },
});

async function testMail() {
  try {
    const info = await transporter.sendMail({
      from: '"Test" <darshanjethani934@gmail.com>',
      to: "darshanjethani934@gmail.com",
      subject: "Test Email",
      text: "This is a test email.",
    });
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testMail();
