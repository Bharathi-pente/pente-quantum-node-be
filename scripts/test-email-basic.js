/**
 * Basic Email Test Script
 *
 * Tests SMTP configuration by sending a test email
 * Run with: node backend/scripts/test-email-basic.js
 */

require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

console.log('🧪 Testing Email Configuration\n');

// Validate environment variables
const required = ['SMTP_USER', 'SMTP_PASSWORD', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

console.log('✅ Environment variables loaded:');
console.log(`   - SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`   - SMTP_PORT: ${process.env.SMTP_PORT}`);
console.log(`   - SMTP_FROM: ${process.env.SMTP_FROM}`);
console.log(`   - SMTP_USER: ${process.env.SMTP_USER}\n`);

async function testEmail() {
  try {
    console.log('📧 Creating SMTP transporter...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true, // Show debug output
    });

    console.log('✅ Transporter created\n');
    console.log('🔗 Verifying connection...');

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');

    console.log('📨 Sending test email...');
    
    const testEmail = {
      from: `"Quantum Billing Test" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_USER, // Send to same address for testing
      subject: `✅ Dunning Email Test - ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #28a745; margin-top: 0;">✅ Email Test Successful!</h2>
            
            <p style="color: #333; line-height: 1.6;">
              Your SMTP configuration is working correctly. This test was performed to verify the dunning email system.
            </p>

            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="margin: 5px 0;"><strong>Test Details:</strong></p>
              <p style="margin: 5px 0;">Timestamp: ${new Date().toISOString()}</p>
              <p style="margin: 5px 0;">SMTP Host: ${process.env.SMTP_HOST}</p>
              <p style="margin: 5px 0;">From: ${process.env.SMTP_FROM}</p>
            </div>

            <p style="color: #666; font-size: 14px;">
              This email confirms that your dunning notification system is ready to send payment reminders and notices to customers.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              Quantum Billing - Dunning System Test<br>
              Generated automatically - Do not reply
            </p>
          </div>
        </div>
      `,
      text: `
        Email Test Successful!
        
        Your SMTP configuration is working correctly. This test was performed to verify the dunning email system.
        
        Test Details:
        Timestamp: ${new Date().toISOString()}
        SMTP Host: ${process.env.SMTP_HOST}
        From: ${process.env.SMTP_FROM}
        
        This email confirms that your dunning notification system is ready to send payment reminders and notices to customers.
        
        Quantum Billing - Dunning System Test
        Generated automatically - Do not reply
      `,
    };

    const info = await transporter.sendMail(testEmail);

    console.log('✅ Test email sent successfully!\n');
    console.log('📬 Email Details:');
    console.log(`   - Message ID: ${info.messageId}`);
    console.log(`   - To: ${testEmail.to}`);
    console.log(`   - Response: ${info.response}\n`);
    
    console.log('🎉 All tests passed! Your dunning email system is ready.');
    console.log(`\n💡 Check your inbox at ${process.env.SMTP_USER} for the test email.\n`);

  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.code === 'EAUTH') {
      console.log('💡 Authentication failed. Please check:');
      console.log('   - SMTP_USER is correct');
      console.log('   - SMTP_PASSWORD is correct');
      console.log('   - Account allows SMTP access\n');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 Connection failed. Please check:');
      console.log('   - SMTP_HOST is correct');
      console.log('   - SMTP_PORT is correct');
      console.log('   - Firewall allows outbound SMTP\n');
    } else {
      console.log('💡 For detailed error information, check the debug output above.\n');
    }
    
    process.exit(1);
  }
}

// Run the test
testEmail();
