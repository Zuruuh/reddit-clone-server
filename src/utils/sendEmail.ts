import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, html: string) {
  let { user, pass } = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user,
      pass,
    },
  });

  console.log(html);

  await transporter.sendMail({
    from: "Zuruh <ziadi.mail.pro@gmail.com>",
    to,
    subject,
    html,
  });
}
