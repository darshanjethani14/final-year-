import nodemailer from "nodemailer";
import "dotenv/config";

async function testEmail() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  console.log("Attempting to send test email...");
  console.log("User:", user);
  console.log("Pass (masked):", pass ? pass.replace(/./g, "*") : "MISSING");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ Connection success! Your credentials are correct.");
    
    await transporter.sendMail({
      from: user,
      to: user, // send to yourself
      subject: "Test Email from IELTS App",
      text: "If you see this, your email settings are perfect!",
    });
    console.log("✅ Test email sent successfully!");
  } catch (err) {
    console.error("❌ Email test failed:");
    console.error(err);
    if (err.responseCode === 535) {
        console.log("\n💡 TIP: Your password or email is definitely rejected by Google.");
        console.log("1. Check if you have quotes in your .env (try removing them).");
        console.log("2. Ensure you are using a 16-character App Password, NOT your regular password.");
        console.log("3. Make sure 2-Step Verification is still enabled on your account.");
    }
  }
}

testEmail();
