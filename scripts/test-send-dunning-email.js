const path = require('path');
const prisma = require(path.join(__dirname, 'src/config/database')).default;
const emailTemplateService = require(path.join(__dirname, 'src/services/email-template.service')).default;
const nodemailer = require('nodemailer');

async function sendTestDunningEmail() {
  try {
    console.log('📧 Sending test dunning email to gbharathitrs@gmail.com...\n');

    // Get SMTP config from environment variables
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };
    
    console.log('📋 SMTP Configuration:');
    console.log(`   Host: ${smtpConfig.host}`);
    console.log(`   Port: ${smtpConfig.port}`);
    console.log(`   User: ${smtpConfig.auth.user}\n`);

    // Get a dunning policy with the payment_reminders template
    const step = await prisma.dunning_steps.findFirst({
      where: { template_name: 'payment_reminders' },
      include: {
        dunning_policies: {
          select: { name: true, org_id: true }
        }
      }
    });

    if (!step) {
      console.log('❌ No dunning step found with payment_reminders template');
      process.exit(1);
    }

    console.log(`✅ Found dunning step:`);
    console.log(`   Policy: ${step.dunning_policies.name}`);
    console.log(`   Template: ${step.template_name}`);
    console.log(`   Step: ${step.sort_order}, Day offset: ${step.day_offset}\n`);

    // Test data with realistic invoice information
    const testData = {
      customer_name: 'Bharathi G',
      invoice_number: 'INV-2026-TEST-001',
      amount: '2,500.00',
      due_date: 'March 5, 2026',
      step_number: step.sort_order.toString()
    };

    console.log('📝 Rendering template with data:');
    console.log(`   Customer: ${testData.customer_name}`);
    console.log(`   Invoice: ${testData.invoice_number}`);
    console.log(`   Amount: $${testData.amount}`);
    console.log(`   Due Date: ${testData.due_date}\n`);

    // Render the email template
    const rendered = await emailTemplateService.renderTemplate(
      step.template_name,
      step.dunning_policies.org_id,
      testData
    );

    if (!rendered) {
      console.log('❌ Template rendering failed - returned null');
      process.exit(1);
    }

    console.log(`✅ Template rendered successfully:`);
    console.log(`   Subject: ${rendered.subject}`);
    console.log(`   Text preview:\n`);
    console.log(rendered.text.substring(0, 300));
    console.log('\n...\n');

    // Check for unreplaced variables
    const hasUnreplacedVars = rendered.text.includes('{{') || rendered.html.includes('{{');
    if (hasUnreplacedVars) {
      console.log('⚠️  WARNING: Template contains unreplaced variables!');
      const matches = rendered.text.match(/\{\{[^}]+\}\}/g);
      if (matches) {
        console.log(`   Unreplaced: ${matches.join(', ')}`);
      }
    } else {
      console.log('✅ All template variables properly replaced');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Send email
    console.log('\n📤 Sending email...');
    const info = await transporter.sendMail({
      from: smtpConfig.auth.user,
      to: 'gbharathitrs@gmail.com',
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html
    });

    console.log(`\n✅ Email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: gbharathitrs@gmail.com`);
    console.log(`   Subject: ${rendered.subject}`);
    console.log('\n✅ Test complete! Check your inbox at gbharathitrs@gmail.com');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

sendTestDunningEmail();