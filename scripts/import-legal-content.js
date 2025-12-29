/**
 * Import Legal Content from Flutter App to CMS
 *
 * This script imports existing legal documents (Terms, Privacy, Guidelines)
 * from the Flutter app into the new CMS database.
 *
 * Usage:
 *   node scripts/import-legal-content.js
 *
 * Requirements:
 *   - Admin authentication token
 *   - Supabase Edge Functions deployed
 */

const SUPABASE_URL = 'https://hvwpdiyrqonuaomwkuxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2d3BkaXlycW9udWFvbXdrdXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNzcyODIsImV4cCI6MjA0ODk1MzI4Mn0.3c-wVY2laTu2Ng7Q_-xPG8f1R-jg4qx0bHo5KpPYO3s';

// You need to get an admin JWT token from Supabase Dashboard or login
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_JWT_TOKEN_HERE';

const content = [
  {
    slug: 'terms-of-service',
    category: 'legal',
    title: 'Terms of Service',
    excerpt: 'Legal agreement governing your use of Wheelbase app',
    effectiveDate: '2024-12-08',
    content: `# Wheelbase Terms of Service

Last Updated: December 8, 2024

## 1. Acceptance of Terms

By accessing and using Wheelbase ("the App"), you accept and agree to be bound by these Terms of Service, our Privacy Policy, and our Community Guidelines. If you do not agree to these terms, please do not use the App.

These terms constitute a legally binding agreement between you and Wheelbase. By creating an account, you represent that you are at least 18 years old and have the legal capacity to enter into this agreement.

## 2. Description of Service

Wheelbase is a motorcycle riding community app that provides features including but not limited to:

- Ride tracking and route sharing
- Social networking with other riders
- Group ride coordination and join requests
- Marketplace for motorcycle parts and gear
- Service provider directory
- Emergency safety features (crash detection, SOS)
- Push notifications for engagement and safety alerts
- Real-time location sharing during rides

## 3. User Accounts and Eligibility

You must be at least 18 years old to use Wheelbase. By creating an account, you represent and warrant that:

- You are 18 years of age or older
- You have the legal capacity to enter into this agreement
- All information you provide is accurate and complete
- You will maintain the security of your account credentials
- You are responsible for all activities under your account
- You will notify us immediately of any unauthorized use

We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.

## 4. User Content and Conduct

You retain ownership of content you post on Wheelbase. By posting content, you grant Wheelbase a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your content in connection with the service.

You are solely responsible for your content and the consequences of posting it. You agree that your content and conduct will comply with our Community Guidelines.

## 5. Community Guidelines and Content Moderation

You agree to follow our Community Guidelines, which are incorporated into these Terms of Service by reference. We reserve the right to:

- Review, monitor, and moderate user-generated content
- Remove content that violates our Community Guidelines
- Suspend or terminate accounts for violations
- Investigate reported violations
- Cooperate with law enforcement investigations
- Use automated systems to detect prohibited content

We have no obligation to pre-screen content but reserve the right to do so. We are not responsible for user-generated content and do not endorse any opinions expressed by users.

## 6. Push Notifications

By using Wheelbase, you consent to receive push notifications, including:

- Social engagement notifications (likes, comments, follows, mentions)
- Group activity notifications (invitations, join requests, events)
- Marketplace notifications (messages, offers)
- Safety and emergency notifications (crash detection, SOS alerts)
- Service announcements and updates

You can manage notification preferences in Settings or disable them through your device settings. Safety-critical notifications (emergency alerts) may override your preferences.

## 7. DISCLAIMER OF WARRANTIES

THE APP IS PROVIDED "AS IS" and "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.

## 8. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHEELBASE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.

## 9. Contact Information

Email: legal@ridewheelbase.app
Support: support@ridewheelbase.app
Website: www.ridewheelbase.app`,
    metadata: {
      seo: {
        title: 'Terms of Service - Wheelbase',
        description: 'Legal terms governing your use of the Wheelbase motorcycle community app'
      },
      tags: ['legal', 'terms', 'agreement']
    },
    changeSummary: 'Initial import from Flutter app - December 8, 2024 version',
    changeType: 'major'
  },
  {
    slug: 'privacy-policy',
    category: 'legal',
    title: 'Privacy Policy',
    excerpt: 'How we collect, use, and protect your personal information',
    effectiveDate: '2024-12-08',
    content: `# Wheelbase Privacy Policy

Last Updated: December 8, 2024

## 1. Introduction

Wheelbase ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

## 2. Information We Collect

### Personal Information
- Name, email address, phone number
- Profile picture and bio
- Motorcycle details (make, model, year)
- Location data (GPS coordinates during rides)
- Emergency contact information

### Usage Data
- Ride history and statistics
- Social interactions (posts, comments, likes)
- App usage analytics
- Device information

## 3. How We Use Your Information

We use your information to:
- Provide and improve our services
- Track rides and provide navigation
- Connect you with other riders
- Send notifications and updates
- Ensure safety (crash detection, emergency alerts)
- Process marketplace transactions
- Comply with legal obligations

## 4. Data Sharing and Disclosure

We do not sell your personal information. We may share data with:
- Other users (as you choose via privacy settings)
- Emergency contacts (during SOS alerts)
- Service providers (hosting, analytics)
- Law enforcement (when legally required)

## 5. Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your account and data
- Export your data
- Opt out of marketing communications

## 6. Data Security

We implement industry-standard security measures including encryption, secure servers, and access controls.

## 7. Contact Us

For privacy questions: legal@ridewheelbase.app`,
    metadata: {
      seo: {
        title: 'Privacy Policy - Wheelbase',
        description: 'Learn how Wheelbase protects your privacy and handles your data'
      },
      tags: ['legal', 'privacy', 'data-protection', 'gdpr']
    },
    changeSummary: 'Initial import from Flutter app - December 8, 2024 version',
    changeType: 'major'
  },
  {
    slug: 'community-guidelines',
    category: 'legal',
    title: 'Community Guidelines',
    excerpt: 'Rules for respectful and safe interactions on Wheelbase',
    effectiveDate: '2024-12-08',
    content: `# Wheelbase Community Guidelines

Last Updated: December 8, 2024

## Welcome to Wheelbase!

Our community is built on respect, safety, and a shared passion for riding. These guidelines help maintain a positive environment for all riders.

## Prohibited Content

1. **Illegal Content**
   - Illegal activities or drugs
   - Counterfeit goods
   - Stolen property

2. **Dangerous Behavior**
   - Extreme reckless riding
   - Street racing promotion
   - Encouraging unsafe practices

3. **Harassment & Hate**
   - Bullying or harassment
   - Hate speech or discrimination
   - Threats or violence

4. **Misinformation**
   - False safety information
   - Fraudulent listings
   - Impersonation

5. **Spam & Scams**
   - Unsolicited advertising
   - Pyramid schemes
   - Phishing attempts

6. **Adult Content**
   - Nudity or sexual content
   - Adult services

7. **Privacy Violations**
   - Sharing others' personal info
   - Non-consensual photos

## Enforcement

- **Warning**: First offense for minor violations
- **Temporary Ban**: Repeated or moderate violations
- **Permanent Ban**: Severe or repeated violations

## Reporting

Report violations via:
- In-app report button
- Email: support@ridewheelbase.app

## Appeal Process

If you believe your account was suspended in error, contact us at legal@ridewheelbase.app within 30 days.`,
    metadata: {
      seo: {
        title: 'Community Guidelines - Wheelbase',
        description: 'Community standards and rules for Wheelbase users'
      },
      tags: ['legal', 'community', 'guidelines', 'safety']
    },
    changeSummary: 'Initial import from Flutter app - December 8, 2024 version',
    changeType: 'major'
  }
];

async function importContent() {
  console.log('🚀 Starting legal content import...\n');

  for (const item of content) {
    console.log(`📄 Creating: ${item.title}`);

    try {
      // Create content as draft
      const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error(`  ❌ Failed to create: ${error}`);
        continue;
      }

      const createData = await createResponse.json();
      const contentId = createData.data.id;
      console.log(`  ✅ Created with ID: ${contentId}`);

      // Publish content
      const publishResponse = await fetch(`${SUPABASE_URL}/functions/v1/admin-publish-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: contentId,
          action: 'publish'
        })
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.text();
        console.error(`  ❌ Failed to publish: ${error}`);
        continue;
      }

      console.log(`  ✅ Published successfully\n`);

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ Import complete!');
}

// Run import
if (ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
  console.error('❌ Error: Please set ADMIN_TOKEN environment variable');
  console.log('\nUsage:');
  console.log('  ADMIN_TOKEN=your_jwt_token node scripts/import-legal-content.js');
  process.exit(1);
}

importContent().catch(console.error);
