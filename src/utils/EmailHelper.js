import nodemailer from "nodemailer";

const EmailSend = async (EmailTo, EmailSubject, EmailText) => {
  let transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });

  let mailOption = {
    from: "Abdus Samad <abdusjscript@gmail.com>",
    to: EmailTo,
    subject: EmailSubject,
    text: EmailText,
  };
  return await transport.sendMail(mailOption);
};

export default EmailSend;
