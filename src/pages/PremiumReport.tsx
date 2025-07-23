import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Star, 
  Shield, 
  CheckCircle, 
  Clock, 
  FileText,
  Users,
  TrendingUp,
  Award,
  Lock,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { usePdfs, PDF } from '@/hooks/usePdfs';
import { useStripePayment } from '@/hooks/useStripePayment';
import { formatPrice } from '@/lib/stripe';
import { formatBytes } from '@/lib/utils';

const PremiumReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pdfs, loading: pdfsLoading } = usePdfs();
  const { loading: paymentLoading, processPayment, checkPurchaseStatus } = useStripePayment();
  
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  useEffect(() => {
    if (!pdfsLoading && pdfs.length > 0 && id) {
      const foundPdf = pdfs.find(p => p.id === id);
      if (foundPdf) {
        setPdf(foundPdf);
      } else {
        navigate('/episodes');
      }
    }
  }, [pdfs, pdfsLoading, id, navigate]);

  useEffect(() => {
    const checkPurchase = async () => {
      if (pdf?.is_premium && id) {
        setCheckingPurchase(true);
        const purchase = await checkPurchaseStatus(id);
        setIsPurchased(!!purchase);
        setCheckingPurchase(false);
      }
    };

    checkPurchase();
  }, [pdf?.is_premium, id, checkPurchaseStatus]);

  const handlePurchase = async () => {
    if (id) {
      await processPayment(id);
    }
  };

  const handleDownload = () => {
    if (pdf?.file_url) {
      window.open(pdf.file_url, '_blank');
    }
  };

  if (pdfsLoading || !pdf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13B87B]"></div>
      </div>
    );
  }

  const isPremium = pdf.is_premium && pdf.price && pdf.price > 0;
  const showPurchaseSection = isPremium && !isPurchased;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/episodes')}
              className="text-gray-600 hover:text-[#13B87B]"
            >
              <ArrowLeft size={20} className="mr-2" />
              Zurück zu den Reports
            </Button>
            <Link to="/" className="text-2xl font-bold text-gray-900 font-cooper">
              Finance Transformers
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <Card className="overflow-hidden">
              <div className="relative">
                {pdf.image_url ? (
                  <img
                    src={pdf.image_url}
                    alt={pdf.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-r from-[#13B87B] to-[#0F9A6A] flex items-center justify-center">
                    <FileText size={80} className="text-white" />
                  </div>
                )}
                
                {isPremium && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Lock size={12} className="mr-1" />
                      Premium Report
                    </Badge>
                  </div>
                )}

                {isPurchased && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle size={12} className="mr-1" />
                      Gekauft
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold mb-2">{pdf.title}</CardTitle>
                    {pdf.description && (
                      <p className="text-gray-600 text-lg leading-relaxed">{pdf.description}</p>
                    )}
                  </div>
                  {isPremium && (
                    <div className="ml-6 text-right">
                      <div className="text-3xl font-bold text-[#13B87B]">
                        {formatPrice(pdf.price!, pdf.currency)}
                      </div>
                      <div className="text-sm text-gray-500">Einmaliger Kauf</div>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Was Sie in diesem Report erwarten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-[#13B87B] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Tiefgreifende Marktanalyse</h4>
                      <p className="text-sm text-gray-600">Detaillierte Einblicke in aktuelle Trends und Entwicklungen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-[#13B87B] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Expertenwissen</h4>
                      <p className="text-sm text-gray-600">Von führenden Finanzexperten recherchiert und verfasst</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-[#13B87B] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Praxisnahe Insights</h4>
                      <p className="text-sm text-gray-600">Umsetzbare Erkenntnisse für Ihre Investitionsentscheidungen</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#13B87B] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Zeitnahe Aktualität</h4>
                      <p className="text-sm text-gray-600">Immer auf dem neuesten Stand der Marktentwicklungen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Report Vorschau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium mb-3">Inhaltsverzeichnis (Auszug)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>1. Executive Summary</span>
                      <span className="text-gray-500">Seite 3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2. Marktüberblick & Trends</span>
                      <span className="text-gray-500">Seite 7</span>
                    </div>
                    <div className="flex justify-between">
                      <span>3. Detailanalyse</span>
                      <span className="text-gray-500">Seite 15</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>4. Investmentstrategien</span>
                      <span>Seite 22</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>5. Risikobewertung</span>
                      <span>Seite 28</span>
                    </div>
                    <div className="text-center pt-2 text-gray-500">
                      {isPremium && !isPurchased && (
                        <div className="flex items-center justify-center gap-2">
                          <Lock size={14} />
                          <span>Vollständiger Inhalt nach dem Kauf verfügbar</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <Card>
              <CardHeader>
                <CardTitle>Das sagen unsere Leser</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      "Excellente Analyse mit praktischen Insights. Hat mir sehr bei meinen Investitionsentscheidungen geholfen."
                    </p>
                    <div className="text-xs text-gray-500">- M. Weber, Portfolio Manager</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      "Tiefgreifende Marktanalyse auf höchstem Niveau. Jeden Euro wert!"
                    </p>
                    <div className="text-xs text-gray-500">- A. Schmidt, Investment Advisor</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase/Download Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  {showPurchaseSection ? 'Report kaufen' : 'Report herunterladen'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showPurchaseSection && (
                  <>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-[#13B87B] mb-2">
                        {formatPrice(pdf.price!, pdf.currency)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Einmaliger Kauf • Sofortiger Download
                      </div>
                    </div>
                    
                    <Button
                      onClick={handlePurchase}
                      disabled={paymentLoading || checkingPurchase}
                      className="w-full bg-gradient-to-r from-[#13B87B] to-[#0F9A6A] hover:from-[#0F9A6A] hover:to-[#0D8A5A] text-white font-semibold py-3"
                      size="lg"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verarbeitung...
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} className="mr-2" />
                          Jetzt kaufen
                        </>
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Shield size={12} />
                        <span>Sichere Zahlung über Stripe</span>
                      </div>
                    </div>
                  </>
                )}

                {(!isPremium || isPurchased) && (
                  <Button
                    onClick={handleDownload}
                    disabled={checkingPurchase}
                    className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white py-3"
                    size="lg"
                  >
                    {checkingPurchase ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Überprüfung...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        {isPurchased ? 'PDF herunterladen' : 'Kostenlos herunterladen'}
                      </>
                    )}
                  </Button>
                )}

                <Separator />

                {/* Report Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span>PDF</span>
                  </div>
                  {pdf.file_size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dateigröße:</span>
                      <span>{formatBytes(pdf.file_size)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sprache:</span>
                    <span>Deutsch</span>
                  </div>
                  {pdf.download_count !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Downloads:</span>
                      <span>{pdf.download_count}</span>
                    </div>
                  )}
                  {pdf.created_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Veröffentlicht:</span>
                      <span>{new Date(pdf.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Why Choose Us */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Warum Finance Transformers?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Expertenwissen</div>
                    <div className="text-gray-600">20+ Jahre Erfahrung in Finanzmärkten</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Aktuelle Daten</div>
                    <div className="text-gray-600">Immer auf dem neuesten Stand</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Praxisnah</div>
                    <div className="text-gray-600">Direkt umsetzbare Erkenntnisse</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Support</div>
                    <div className="text-gray-600">Fragen? Wir helfen gerne weiter</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vertrauen & Sicherheit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="text-blue-500" size={16} />
                  <span>SSL-verschlüsselte Übertragung</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CreditCard className="text-blue-500" size={16} />
                  <span>Sichere Zahlung über Stripe</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Download className="text-blue-500" size={16} />
                  <span>Sofortiger Download nach Kauf</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumReport;