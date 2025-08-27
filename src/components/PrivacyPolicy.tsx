import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Database, Cloud, Users, FileText, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';

export function PrivacyPolicy() {
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();

  const sections = [
    {
      id: 'overview',
      title: 'Privacy Overview',
      icon: Shield,
      content: [
        'At Uzaji, your privacy is our top priority. We believe that your financial data should remain private and under your complete control.',
        'Our application is designed with privacy-first principles, using client-side encryption and local storage to ensure that your sensitive business information never leaves your device unencrypted.',
        'This Privacy Policy explains how we collect, use, and protect your information when you use our smart business bookkeeping application.'
      ]
    },
    {
      id: 'data-collection',
      title: 'Information We Collect',
      icon: Database,
      content: [
        'Account Information: When you create an account, we collect your email address, name, and encrypted authentication credentials.',
        'Financial Data: All your business transactions, products, services, and financial records are stored locally on your device and encrypted using your account credentials.',
        'Application Settings: Your preferences for currency, language, theme, and other app settings are stored to provide a personalized experience.',
        'Usage Analytics: We may collect anonymous usage statistics to improve our application, but this data cannot be linked back to your identity or financial information.'
      ]
    },
    {
      id: 'data-storage',
      title: 'How We Store Your Data',
      icon: Lock,
      content: [
        'Local Storage: All your financial data is stored locally on your device using encrypted IndexedDB storage. This means your data never leaves your device unless you explicitly choose to back it up.',
        'Client-Side Encryption: Your data is encrypted using AES-256 encryption with keys derived from your account credentials. Even we cannot access your encrypted data.',
        'Optional Cloud Backup: If you enable cloud backup through Supabase, your data is encrypted before being transmitted and stored in the cloud. The encryption keys never leave your device.',
        'No Plain Text Storage: We never store your financial data in plain text format, anywhere, at any time.'
      ]
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Information',
      icon: Eye,
      content: [
        'Service Provision: We use your account information to provide you with access to the Uzaji application and its features.',
        'Data Synchronization: If you enable cloud backup, we use your encrypted data to provide synchronization across your devices.',
        'Customer Support: We may use your contact information to respond to your support requests and provide assistance.',
        'Service Improvement: Anonymous usage analytics help us understand how to improve the application, but cannot be traced back to individual users.',
        'Legal Compliance: We may use your information as required by law or to protect our rights and the rights of our users.'
      ]
    },
    {
      id: 'data-sharing',
      title: 'Information Sharing and Disclosure',
      icon: Users,
      content: [
        'No Data Sales: We never sell, rent, or trade your personal or financial information to third parties.',
        'Service Providers: We may share encrypted data with trusted service providers (like Supabase for cloud storage) who assist in operating our service. These providers cannot decrypt your data.',
        'Legal Requirements: We may disclose information if required by law, court order, or government request, but only the minimum necessary information.',
        'Business Transfers: In the event of a merger or acquisition, user data may be transferred, but the same privacy protections will apply.',
        'Your Consent: We will only share your information in ways you have explicitly consented to.'
      ]
    },
    {
      id: 'security',
      title: 'Data Security Measures',
      icon: Shield,
      content: [
        'End-to-End Encryption: All your financial data is encrypted using industry-standard AES-256 encryption before storage or transmission.',
        'Secure Authentication: We use secure authentication methods and never store your passwords in plain text.',
        'Local-First Architecture: By storing data locally first, we minimize the attack surface and reduce the risk of data breaches.',
        'Regular Security Updates: We regularly update our security measures and dependencies to protect against new threats.',
        'Zero-Knowledge Architecture: Our system is designed so that even our administrators cannot access your decrypted financial data.'
      ]
    },
    {
      id: 'user-rights',
      title: 'Your Privacy Rights',
      icon: FileText,
      content: [
        'Data Access: You have complete access to all your data stored in the application at any time.',
        'Data Portability: You can export all your data in standard formats (JSON) for use in other applications.',
        'Data Deletion: You can delete your account and all associated data at any time through the application settings.',
        'Backup Control: You have full control over whether your data is backed up to the cloud or kept only locally.',
        'Consent Withdrawal: You can withdraw consent for data processing at any time by deleting your account.'
      ]
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking',
      icon: Eye,
      content: [
        'Essential Cookies: We use essential cookies and local storage to maintain your login session and application preferences.',
        'No Tracking Cookies: We do not use tracking cookies, advertising cookies, or third-party analytics that could compromise your privacy.',
        'Local Storage: Application data is stored locally on your device and is not transmitted to external servers unless you enable cloud backup.',
        'Browser Settings: You can control cookie settings through your browser, though disabling essential cookies may affect application functionality.'
      ]
    },
    {
      id: 'third-party',
      title: 'Third-Party Services',
      icon: Cloud,
      content: [
        'Supabase (Optional): If you enable cloud backup, we use Supabase for encrypted data storage. Supabase cannot decrypt your data.',
        'Google OAuth (Optional): If you choose to sign in with Google, we receive only basic profile information (name, email) as permitted by OAuth standards.',
        'No Analytics Services: We do not use Google Analytics, Facebook Pixel, or other third-party tracking services.',
        'Open Source Dependencies: Our application uses open-source libraries that are regularly audited for security and privacy compliance.'
      ]
    },
    {
      id: 'international',
      title: 'International Data Transfers',
      icon: Users,
      content: [
        'Local Processing: All data processing occurs locally on your device, minimizing international data transfers.',
        'Cloud Backup Location: If you enable cloud backup, your encrypted data may be stored in data centers operated by Supabase in various locations.',
        'Encryption in Transit: Any data transmitted internationally is encrypted using TLS 1.3 or higher.',
        'Compliance: We ensure that any international data transfers comply with applicable privacy laws and regulations.'
      ]
    },
    {
      id: 'children',
      title: 'Children\'s Privacy',
      icon: Users,
      content: [
        'Age Restriction: Uzaji is not intended for use by children under the age of 13, and we do not knowingly collect personal information from children under 13.',
        'Parental Consent: If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to delete that information.',
        'Business Use: Our application is designed for business use and is not marketed to or intended for children.'
      ]
    },
    {
      id: 'updates',
      title: 'Policy Updates',
      icon: Calendar,
      content: [
        'Notification of Changes: We will notify users of any material changes to this Privacy Policy through the application or via email.',
        'Effective Date: Changes to this policy will include an updated effective date at the top of this document.',
        'Continued Use: Your continued use of the application after policy changes constitutes acceptance of the updated terms.',
        'Version History: We maintain a history of policy changes for transparency.'
      ]
    },
    {
      id: 'contact',
      title: 'Contact Information',
      icon: Mail,
      content: [
        'Privacy Questions: If you have questions about this Privacy Policy or our privacy practices, please contact us at info@uzaji.com.',
        'Data Requests: For requests regarding your personal data (access, deletion, correction), please reach out to our support team at info@uzaji.com.',
        'Security Concerns: If you discover a security vulnerability, please report it to us immediately at info@uzaji.com.',
        'Response Time: We aim to respond to all privacy-related inquiries within 48 hours.'
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${themeClasses.background}`} dir={themeClasses.direction}>
      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm ${themeClasses.border} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className={`mr-4 p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UzajiLogo size="md" className="mr-4" />
            <h1 className={`text-xl font-bold ${themeClasses.text}`}>Privacy Policy</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-4xl font-bold ${themeClasses.text} mb-4`}>
            Privacy Policy
          </h1>
          <p className={`text-xl ${themeClasses.textSecondary} max-w-3xl mx-auto leading-relaxed`}>
            Your privacy and data security are fundamental to everything we do. 
            Learn how we protect your financial information with industry-leading encryption and privacy practices.
          </p>
          <div className={`mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg`}>
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Last updated: December 29, 2024
            </span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 mb-8`}>
          <h2 className={`text-lg font-semibold ${themeClasses.text} mb-4 flex items-center`}>
            <FileText className="w-5 h-5 mr-2" />
            Table of Contents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`flex items-center space-x-2 p-2 rounded-lg ${themeClasses.hover} transition-colors group`}
              >
                <section.icon className={`w-4 h-4 ${themeClasses.textSecondary} group-hover:text-blue-600`} />
                <span className={`text-sm ${themeClasses.text} group-hover:text-blue-600`}>
                  {index + 1}. {section.title}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-8`}
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                    {index + 1}. {section.title}
                  </h2>
                </div>
              </div>
              
              <div className="space-y-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className={`${themeClasses.text} leading-relaxed`}>
                    {paragraph.includes(':') ? (
                      <>
                        <span className="font-semibold">
                          {paragraph.split(':')[0]}:
                        </span>
                        {paragraph.split(':').slice(1).join(':')}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact Section */}
        <div className={`mt-12 ${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-8 text-center`}>
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h3 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>
            Questions About Your Privacy?
          </h3>
          <p className={`${themeClasses.textSecondary} mb-6 max-w-2xl mx-auto`}>
            We're committed to transparency and protecting your privacy. If you have any questions 
            about this policy or how we handle your data, please don't hesitate to reach out.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a
              href="mailto:info@uzaji.com"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
            <button
              onClick={() => navigate('/')}
              className={`px-6 py-3 ${themeClasses.border} border rounded-lg ${themeClasses.text} ${themeClasses.hover} transition-colors font-semibold`}
            >
              Back to Home
            </button>
          </div>
        </div>

        {/* Security Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 text-center`}>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <h4 className={`font-semibold ${themeClasses.text} mb-2`}>End-to-End Encryption</h4>
            <p className={`text-sm ${themeClasses.textSecondary}`}>
              Your data is encrypted with AES-256 before storage or transmission
            </p>
          </div>
          
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 text-center`}>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className={`font-semibold ${themeClasses.text} mb-2`}>Local-First Storage</h4>
            <p className={`text-sm ${themeClasses.textSecondary}`}>
              Your data stays on your device unless you choose cloud backup
            </p>
          </div>
          
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 text-center`}>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className={`font-semibold ${themeClasses.text} mb-2`}>Zero-Knowledge</h4>
            <p className={`text-sm ${themeClasses.textSecondary}`}>
              We cannot access your decrypted financial information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}