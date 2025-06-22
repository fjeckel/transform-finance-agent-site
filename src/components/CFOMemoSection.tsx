
import React, { useState } from 'react';
import { CheckCircle, Mail, TrendingUp, Shield, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CFOMemoSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Ungültige E-Mail",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual Mailchimp integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Willkommen beim CFO Memo!",
        description: "Sie erhalten Ihr erstes Memo innerhalb von 24 Stunden.",
      });
      
      setEmail('');
    } catch (error) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Strategische Einblicke",
      description: "Wöchentliche Analyse von Finanztrends, die für Ihr Ergebnis wichtig sind"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Risiko-Intelligence",
      description: "Frühwarnungen zu Marktveränderungen und regulatorischen Änderungen"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Transformations-Tools",
      description: "Praktische Frameworks zur Modernisierung Ihrer Finanzfunktion"
    }
  ];

  return (
    <section id="cfo-memo" className="py-20 bg-gradient-to-br from-[#13B87B] to-[#0FA66A]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 uppercase tracking-tight">
            Das <span className="text-[#FBF4EB]">CFO Memo</span>
          </h2>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Durchschneiden Sie das Rauschen. Erhalten Sie die Einblicke, die wirklich zählen. 
            Wöchentliche Intelligence für Finanzführungskräfte, die sich nicht abhängen lassen.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8 mb-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-green-100">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Mail className="w-6 h-6 mr-2" />
                Schließen Sie sich 100+ Finanzführungskräften an
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Geben Sie Ihre E-Mail-Adresse ein"
                    className="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-white/30 font-medium"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#D0840E] text-white py-3 px-6 rounded-lg font-bold text-lg hover:bg-[#B8720C] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>DAS CFO MEMO ERHALTEN</span>
                    </>
                  )}
                </button>
              </form>
              
              <p className="text-green-100 text-sm mt-3 text-center">
                Kein Spam. Jederzeit abbestellbar. Wöchentliche Zustellung jeden Dienstag.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#13B87B] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">Das Memo dieser Woche</h4>
                <div className="text-left space-y-3 text-gray-700">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-[#13B87B] rounded-full mt-2 flex-shrink-0"></div>
                    <span>KI-gestützte Finanzplanung: Hype vs. Realität</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-[#D0840E] rounded-full mt-2 flex-shrink-0"></div>
                    <span>Q1 2025 Risikobewertungs-Framework</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-[#003FA5] rounded-full mt-2 flex-shrink-0"></div>
                    <span>Case Study: Digitale Finance-Transformation</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -left-6 w-24 h-24 border-4 border-white/30 rounded-full"></div>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 border-4 border-white/30 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CFOMemoSection;
