import { useState } from 'react';
import { ArrowRight, Shield, Smartphone, BarChart3, Zap, Check, Star, Users, Lock, Download, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.language);

  const features = [
    {
      icon: Shield,
      title: t('landing.feature.privacy.title'),
      description: t('landing.feature.privacy.description'),
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Smartphone,
      title: t('landing.feature.offline.title'),
      description: t('landing.feature.offline.description'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: t('landing.feature.comprehensive.title'),
      description: t('landing.feature.comprehensive.description'),
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: t('landing.feature.fast.title'),
      description: t('landing.feature.fast.description'),
      color: 'from-orange-500 to-red-500'
    }
  ];

  const benefits = [
    t('landing.footer.endToEndEncryption'),
    t('landing.offlineReady'),
    t('landing.footer.offlineSupport'),
    t('landing.footer.financialReports'),
    t('landing.footer.productManagement'),
    t('landing.footer.transactionTracking'),
    t('landing.feature.comprehensive.title'),
    t('landing.noDownloads')
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Freelance Designer',
      content: 'Finally, a bookkeeping app that respects my privacy. The offline functionality is perfect for my workflow.',
      rating: 5
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Small Business Owner',
      content: 'Uzaji simplified my financial tracking. The automatic encryption gives me peace of mind.',
      rating: 5
    },
    {
      name: 'Emily Watson',
      role: 'Consultant',
      content: 'The best part is that it works offline. I can track expenses anywhere without worrying about connectivity.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <UzajiLogo size="lg" />
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">{t('common.online')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">{t('common.offline')}</span>
                  </>
                )}
              </div>
              
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
              >
                <span>{t('landing.getStarted')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Smart Business Bookkeeping
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center space-x-3"
              >
                <span>{t('landing.startFreeToday')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-2 text-gray-600">
                <Lock className="w-5 h-5" />
                <span className="font-medium">{t('landing.noCreditCard')}</span>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>{t('landing.footer.endToEndEncryption')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span>{t('landing.offlineReady')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Trusted by 10,000+ Businesses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group">
                  <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                {t('landing.whyChoose.title')}
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {t('landing.whyChoose.subtitle')}
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onGetStarted}
                className="mt-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-3"
              >
                <span>{t('landing.startFreeToday')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{t('dashboard.todayPerformance')}</h3>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-sm text-green-600 font-medium">{t('dashboard.revenue')}</p>
                      <p className="text-2xl font-bold text-green-700">$12,450</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm text-blue-600 font-medium">{t('business.profit')}</p>
                      <p className="text-2xl font-bold text-blue-700">$8,320</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Web Design Service</span>
                      <span className="font-bold text-green-600">+$2,500</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Office Supplies</span>
                      <span className="font-bold text-red-600">-$150</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {t('landing.testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.testimonials.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 mb-12 leading-relaxed">
            {t('landing.cta.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center space-x-3"
            >
              <span>{t('landing.getStarted')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-2 text-blue-100">
              <Download className="w-5 h-5" />
              <span>{t('landing.noDownloads')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <UzajiLogo size="lg" className="mb-6" />
              <p className="text-gray-400 leading-relaxed max-w-md">
                {t('landing.footer.description')}
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">{t('landing.footer.features')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>{t('landing.footer.transactionTracking')}</li>
                <li>{t('landing.footer.productManagement')}</li>
                <li>{t('landing.footer.financialReports')}</li>
                <li>{t('landing.footer.offlineSupport')}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">{t('landing.footer.security')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li>{t('landing.footer.endToEndEncryption')}</li>
                <li>{t('landing.footer.localDataStorage')}</li>
                <li>{t('landing.footer.privacyFirst')}</li>
                <li>{t('landing.footer.noDataMining')}</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-gray-400 mb-4 md:mb-0">
                {t('landing.footer.copyright')}
              </p>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => navigate('/privacy')}
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  {t('landing.footer.privacyPolicy')}
                </button>
                <a
                  href="mailto:info@uzaji.com"
                  className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  {t('landing.footer.contactSupport')}
                </a>
               
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}