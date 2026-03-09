#!/usr/bin/env node

require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendSimpleEmail() {
  try {
    console.log('Sending simple test email...');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const verified = await transporter.verify();
    console.log('Transporter verified:', verified);

    const info = await transporter.sendMail({
      from: `"Quantum Billing" <${process.env.SMTP_FROM}>`,
      to: 'gbharathitrs@gmail.com',  // Send to the SMTP user first
      subject: 'Test Email from Dunning System',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<p>This is a test email to verify SMTP configuration.</p>',
    });

    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

sendSimpleEmail();