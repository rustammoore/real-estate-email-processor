import React from 'react';

const LandingPage = ({ onGetStarted }) => {
  const features = [
    {
      icon: (
        <svg
          className="h-12 w-12 text-gray-600"
          style={{ width: '48px', height: '48px', flexShrink: 0 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'Automated Email Processing',
      description:
        'Automatically fetch and process real estate listing emails from Gmail with intelligent content extraction.'
    },
    {
      icon: (
        <svg
          className="h-12 w-12 text-gray-600"
          style={{ width: '48px', height: '48px', flexShrink: 0 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      title: 'Property Management',
      description:
        'Comprehensive CRUD operations for property listings with advanced search, filtering, and organization features.'
    },
    {
      icon: (
        <svg
          className="h-12 w-12 text-gray-600"
          style={{ width: '48px', height: '48px', flexShrink: 0 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      title: 'Multi-User Authentication',
      description:
        'Secure user registration and login with complete data isolation. Each user manages their own property portfolio.'
    },
    {
      icon: (
        <svg
          className="h-12 w-12 text-gray-600"
          style={{ width: '48px', height: '48px', flexShrink: 0 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'Smart Analytics',
      description:
        'Dashboard with property statistics, follow-up tracking, and performance metrics to optimize your workflow.'
    },
    {
      icon: (
        <svg
          className="h-12 w-12 text-gray-600"
          style={{ width: '48px', height: '48px', flexShrink: 0 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Follow-Up System',
      description:
        'Set intelligent reminders for property follow-ups with customizable schedules and automated notifications.'
    },
    {
      icon: (
        <svg
          className="h-12 w-12 text-gray-600"
          style={{ width: '48px', height: '48px', flexShrink: 0 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      title: 'Duplicate Detection',
      description:
        'Advanced AI-powered duplicate detection prevents redundant entries and keeps your database clean and organized.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Real Estate Agent',
      company: 'Premium Properties LLC',
      quote:
        'This platform has revolutionized how I manage property listings. The automated email processing saves me hours every week!'
    },
    {
      name: 'Michael Chen',
      role: 'Property Manager',
      company: 'Urban Realty Group',
      quote:
        'The multi-user system is perfect for our team. Everyone can manage their own listings while maintaining data privacy.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Broker',
      company: 'Coastal Real Estate',
      quote:
        'The follow-up system ensures I never miss an opportunity. The dashboard gives me complete visibility into my pipeline.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="p-4 md:p-6 flex justify-between items-center bg-white border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="h-6 w-6 text-gray-700"
              style={{ width: '24px', height: '24px', flexShrink: 0 }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
              />
            </svg>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Real Estate Email Processor</h1>
        </div>
        <button
          onClick={onGetStarted}
          className="rounded-lg px-4 py-2 md:px-6 bg-gray-900 text-white font-medium hover:bg-black transition-colors text-sm md:text-base"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-semibold mb-6 leading-tight tracking-tight">
          Streamline Your Real Estate
          <br />
          <span className="text-gray-800">Email Workflow</span>
        </h2>
        <p className="text-lg md:text-xl mb-10 text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Automatically process real estate listing emails, manage properties efficiently, and never miss a follow-up with our minimalist, distraction-free interface.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGetStarted}
            className="rounded-lg px-7 py-3 bg-gray-900 text-white font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            Start Free Trial
            <svg
              className="h-5 w-5"
              style={{ width: '20px', height: '20px', flexShrink: 0 }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button className="rounded-lg px-7 py-3 bg-white text-gray-900 border border-gray-300 font-medium hover:bg-gray-50 transition-colors">
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 md:px-8 py-14 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h3 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight">Powerful Features</h3>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your real estate email workflow efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 md:p-7 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
              >
                <div className="mb-4">{feature.icon}</div>
                <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 md:px-8 py-14 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h3 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight">Trusted by Real Estate Professionals</h3>
            <p className="text-lg md:text-xl text-gray-600">See what our users have to say</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 md:p-7 border border-gray-200 shadow-sm">
                <p className="text-base md:text-lg leading-relaxed mb-6 italic text-gray-700">"{testimonial.quote}"</p>
                <div>
                  <h5 className="font-semibold mb-0.5 text-gray-900">{testimonial.name}</h5>
                  <p className="text-sm text-gray-500">{testimonial.role} • {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 py-16 md:py-24 text-center bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight">Ready to Transform Your Workflow?</h3>
          <p className="text-lg md:text-xl mb-8 text-gray-600">
            Join real estate professionals who have streamlined their email processing
          </p>
          <button
            onClick={onGetStarted}
            className="rounded-lg px-8 py-4 bg-gray-900 text-white font-medium hover:bg-black transition-colors"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-8 py-8 text-center border-t border-gray-200 bg-white">
        <p className="text-gray-500 text-sm">
          © 2024 Real Estate Email Processor. Built for real estate professionals.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;