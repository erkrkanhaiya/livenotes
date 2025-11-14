import React from 'react';
import { Mail, Phone, Shield, Users, FileText, Share2, Bell, Search, Palette, Pin, Globe, Smartphone, Zap } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            LiveNotes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your Privacy Matters to Us
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* About the App */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            About LiveNotes
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-left">
            LiveNotes is a powerful, modern note-taking application designed to help you capture, organize, and share your ideas seamlessly across all your devices. Whether you're using our Chrome Extension, Web App, or Mobile App, LiveNotes provides a unified experience that keeps your notes synchronized in real-time.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-left">
            Our mission is to make note-taking simple, collaborative, and accessible. With LiveNotes, you can create beautiful notes, organize them efficiently, collaborate with others, and access your content anywhere, anytime.
          </p>
        </section>

        {/* Features Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rich Note Creation</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Create beautiful notes with titles, descriptions, and color coding for better organization.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <Pin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pin Important Notes</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Pin your most important notes to the top for quick access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <Share2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Share & Collaborate</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Share notes publicly or privately with collaborators. Control edit permissions for each user.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Group Management</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Organize notes into groups and share entire groups with team members or collaborators.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                <Bell className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Notifications</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Get instant notifications when collaborators make changes to shared notes or groups.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                <Search className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart Search & Filter</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Quickly find notes using powerful search and filter by color, tags, or other criteria.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-lg">
                <Palette className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Color Organization</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Organize notes with color coding and visual categorization.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-teal-100 dark:bg-teal-900 p-3 rounded-lg">
                <Globe className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
                <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cross-Platform Sync</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Access your notes seamlessly across Chrome Extension, Web App, and Mobile Apps (iOS & Android).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
                <Smartphone className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className='text-left'>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Offline Support</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Work offline and sync automatically when you reconnect to the internet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            Privacy Policy
          </h2>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-left">1. Information We Collect</h3>
              <p className="leading-relaxed mb-4 text-left">
                LiveNotes collects the following information to provide and improve our services:
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-left"><strong>Account Information:</strong></h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm text-left">Email address, display name, and profile picture (when using Google Sign-In)</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-left"><strong>Note Content:</strong></h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm text-left">All notes, titles, descriptions, and metadata you create</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-left"><strong>Usage Data:</strong></h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm text-left">How you interact with the app, features used, and performance metrics</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-left"><strong>Device Information:</strong></h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm text-left">Device type, operating system, and app version for optimization</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-left"><strong>Collaboration Data:</strong></h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm text-left">Information about shared notes, collaborators, and group memberships</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-left">2. How We Use Your Information</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">To provide, maintain, and improve our services</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">To enable real-time synchronization across your devices</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">To facilitate collaboration and sharing features</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">To send you notifications about important updates and collaboration activities</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">To analyze usage patterns and improve user experience</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">To ensure security and prevent fraud</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-left">3. Data Security</h3>
              <p className="leading-relaxed mb-4 text-left">
                We take data security seriously and implement industry-standard security measures:
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">All data is encrypted in transit using SSL/TLS</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Firebase Authentication ensures secure user authentication</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Firestore security rules protect your data from unauthorized access</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Regular security audits and updates</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Access controls and permission management for shared content</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-left">4. Data Sharing</h3>
              <p className="leading-relaxed mb-4 text-left">
                We respect your privacy and do not sell your personal information. We only share data:
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">When you explicitly choose to share notes or groups with others</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">With service providers (like Firebase) necessary to operate our services</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">When required by law or to protect our rights and safety</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-left">5. Your Rights</h3>
              <p className="leading-relaxed mb-4 text-left">
                You have the right to:
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Access, update, or delete your personal information</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Export your notes and data at any time</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Control sharing permissions for your notes and groups</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Opt-out of non-essential notifications</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Delete your account and all associated data</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-left">6. Cookies and Tracking</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">We use essential cookies and local storage to maintain your session and preferences</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">We do not use third-party tracking cookies or advertising trackers</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">All data is stored securely and used solely to provide our services</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-left">7. Children's Privacy</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">LiveNotes is not intended for children under 13 years of age</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">We do not knowingly collect personal information from children</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">If you believe we have collected information from a child, please contact us immediately</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-left">8. Changes to This Policy</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">We may update this Privacy Policy from time to time</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 text-left">Your continued use of LiveNotes after changes become effective constitutes acceptance of the updated policy</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Mail className="w-8 h-8" />
            Contact Us
          </h2>
          <p className="text-blue-100 mb-6 leading-relaxed text-left">
            Have questions about our Privacy Policy, need support, or want to report an issue? We're here to help! Reach out to us through any of the following channels:
          </p>
          
          <div className="space-y-4 text-left">
            <a 
              href="mailto:enterjpk@gmail.com" 
              className="flex  gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <div className="bg-white/20 p-3 rounded-lg">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-lg">Email</div>
                <div className="text-blue-100">enterjpk@gmail.com</div>
              </div>
            </a>

            <a 
              href="tel:+919234861665" 
              className="flex gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              <div className="bg-white/20 p-3 rounded-lg">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-lg">Phone</div>
                <div className="text-blue-100">+91 92348 61665</div>
              </div>
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-blue-100 text-sm">
              We typically respond to inquiries within 24-48 hours during business days. For urgent matters, please call us directly.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            © {new Date().getFullYear()} LiveNotes. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            Built with ❤️ for seamless note-taking and collaboration
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

