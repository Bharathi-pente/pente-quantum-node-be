#!/usr/bin/env node

/**
 * Test SMTP Configuration
 *
 * Simple script to test if SMTP configuration is working
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('Testing SMTP configuration...');

  try {
    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    const testEmail = {
      from: `"Quantum Billing Test" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_FROM, // Send to yourself
      subject: 'SMTP Test - Quantum Billing',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">SMTP Test Successful! 🎉</h2>
          <p>This is a test email to verify SMTP configuration for Quantum Billing dunning notifications.</p>
          <p><strong>Configuration:</strong></p>
          <ul>
            <li>Host: ${process.env.SMTP_HOST}</li>
            <li>Port: ${process.env.SMTP_PORT}</li>
            <li>User: ${process.env.SMTP_USER}</li>
            <li>From: ${process.env.SMTP_FROM}</li>
          </ul>
          <p>If you received this email, SMTP is configured correctly!</p>
        </div>
      `,
      text: `
        SMTP Test Successful!

        This is a test email to verify SMTP configuration for Quantum Billing dunning notifications.

        Configuration:
        - Host: ${process.env.SMTP_HOST}
        - Port: ${process.env.SMTP_PORT}
        - User: ${process.env.SMTP_USER}
        - From: ${process.env.SMTP_FROM}

        If you received this email, SMTP is configured correctly!
      `,
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox for the test email.');

  } catch (error) {
    console.error('❌ SMTP test failed:', error.message);
    process.exit(1);
  }
}

testSMTP();