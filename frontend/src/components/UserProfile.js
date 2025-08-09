import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './ui/LoadingSpinner';
import PropertyPageLayout from './layout/PropertyPageLayout';

// Icons as SVG components for better performance
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserProfile = () => {
  const { user, updateProfile, changePassword, updateEmailConfig, isLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    agentProfile: {
      license: '',
      company: '',
      phone: '',
      bio: ''
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [emailConfigData, setEmailConfigData] = useState({
    gmailClientId: '',
    gmailClientSecret: '',
    gmailRefreshToken: ''
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        showSuccess('Profile updated successfully!');
      } else {
        showError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      showError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('New password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        showSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showError(result.error || 'Failed to change password');
      }
    } catch (error) {
      showError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailConfigSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateEmailConfig(emailConfigData);
      if (result.success) {
        showSuccess('Email configuration updated successfully!');
        setEmailConfigData({
          gmailClientId: '',
          gmailClientSecret: '',
          gmailRefreshToken: ''
        });
      } else {
        showError(result.error || 'Failed to update email configuration');
      }
    } catch (error) {
      showError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use useEffect to update profileData when user changes
  React.useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        agentProfile: {
          license: user.agentProfile?.license || '',
          company: user.agentProfile?.company || '',
          phone: user.agentProfile?.phone || '',
          bio: user.agentProfile?.bio || ''
        }
      });
    }
  }, [user]);

  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // If we have no user data and are not loading, show an error
  if (!isLoading && !user) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load profile</h2>
          <p className="text-gray-600">Please try refreshing the page or logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <PropertyPageLayout title="Profile" onBack={() => navigate('/')}> 
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
            <UserIcon />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{user?.name || 'User Profile'}</h1>
            {user?.email && <p className="text-sm text-gray-600">{user.email}</p>}
            {user?.agentProfile?.company && (
              <p className="text-xs text-gray-500">{user.agentProfile.company}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'profile', name: 'Profile', icon: UserIcon },
                { id: 'password', name: 'Password', icon: LockIcon },
                { id: 'email-config', name: 'Email Configuration', icon: MailIcon }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent />
                    <span className="ml-2 hidden sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h2>
                  <p className="text-sm text-gray-600">Update your personal details and professional information.</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <InfoIcon />
                          <span className="ml-1">Email cannot be changed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Real Estate License
                        </label>
                        <input
                          type="text"
                          value={profileData.agentProfile.license}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            agentProfile: { ...prev.agentProfile, license: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your license number"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Company
                        </label>
                        <input
                          type="text"
                          value={profileData.agentProfile.company}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            agentProfile: { ...prev.agentProfile, company: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Your real estate company"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileData.agentProfile.phone}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            agentProfile: { ...prev.agentProfile, phone: e.target.value }
                          }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Your contact number"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Professional Bio
                    </label>
                    <textarea
                      rows={5}
                      value={profileData.agentProfile.bio}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        agentProfile: { ...prev.agentProfile, bio: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Tell us about your experience, specializations, and what makes you unique as a real estate professional..."
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <span>Share your expertise and background with potential clients</span>
                      <span className={`font-medium ${profileData.agentProfile.bio.length > 450 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {profileData.agentProfile.bio.length}/500
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
                  <p className="text-sm text-gray-600">Update your password to keep your account secure.</p>
                </div>

                <div className="max-w-md">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <ExclamationIcon />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Password Requirements</h3>
                        <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
                          <li>Minimum 6 characters long</li>
                          <li>Use a unique password you don't use elsewhere</li>
                          <li>Consider using a mix of letters, numbers, and symbols</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Current Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        minLength={6}
                        required
                        placeholder="Enter your new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                        placeholder="Confirm your new password"
                      />
                      {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                      )}
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Changing Password...
                          </div>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Email Configuration Tab */}
            {activeTab === 'email-config' && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Configuration</h2>
                  <p className="text-sm text-gray-600">Configure Gmail API access for automated email processing.</p>
                </div>

                {/* Status Card */}
                <div className={`rounded-lg p-6 border ${
                  user?.emailConfig?.isConfigured 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {user?.emailConfig?.isConfigured ? (
                      <div className="flex items-center text-green-800">
                        <CheckIcon />
                        <h3 className="ml-2 text-lg font-semibold">Email Processing Enabled</h3>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-800">
                        <ExclamationIcon />
                        <h3 className="ml-2 text-lg font-semibold">Email Processing Not Configured</h3>
                      </div>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${
                    user?.emailConfig?.isConfigured ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {user?.emailConfig?.isConfigured 
                      ? 'Your email integration is active and ready to process incoming property listings.'
                      : 'Set up Gmail API credentials below to enable automatic email processing.'
                    }
                  </p>
                </div>

                <div className="max-w-2xl">
                  {/* Setup Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <div className="flex items-start">
                      <InfoIcon />
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Setup Instructions</h3>
                        <div className="text-sm text-blue-800 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">1. Google Cloud Console</h4>
                              <ul className="space-y-1 text-xs">
                                <li>• Visit console.cloud.google.com</li>
                                <li>• Create or select a project</li>
                                <li>• Enable Gmail API</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">2. Create Credentials</h4>
                              <ul className="space-y-1 text-xs">
                                <li>• Go to Credentials section</li>
                                <li>• Create OAuth 2.0 Client ID</li>
                                <li>• Configure authorized origins</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">3. OAuth Playground</h4>
                              <ul className="space-y-1 text-xs">
                                <li>• Visit developers.google.com/oauthplayground</li>
                                <li>• Select Gmail API scopes</li>
                                <li>• Generate refresh token</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">4. Configure Below</h4>
                              <ul className="space-y-1 text-xs">
                                <li>• Enter Client ID and Secret</li>
                                <li>• Add the refresh token</li>
                                <li>• Save configuration</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleEmailConfigSubmit} className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Gmail API Credentials</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Gmail Client ID
                          </label>
                          <input
                            type="text"
                            value={emailConfigData.gmailClientId}
                            onChange={(e) => setEmailConfigData(prev => ({ ...prev, gmailClientId: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                            placeholder="123456789-abcdef.apps.googleusercontent.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Gmail Client Secret
                          </label>
                          <input
                            type="password"
                            value={emailConfigData.gmailClientSecret}
                            onChange={(e) => setEmailConfigData(prev => ({ ...prev, gmailClientSecret: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                            placeholder="Enter your Gmail Client Secret"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Gmail Refresh Token
                          </label>
                          <input
                            type="password"
                            value={emailConfigData.gmailRefreshToken}
                            onChange={(e) => setEmailConfigData(prev => ({ ...prev, gmailRefreshToken: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                            placeholder="Enter your Gmail Refresh Token"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating Configuration...
                          </div>
                        ) : (
                          'Save Email Configuration'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
      </div>
    </PropertyPageLayout>
  );
};

export default UserProfile;