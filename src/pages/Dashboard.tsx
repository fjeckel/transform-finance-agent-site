import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Download, 
  FileText, 
  Calendar, 
  CreditCard, 
  Eye,
  Settings,
  LogOut,
  ShoppingBag,
  CheckCircle,
  Clock,
  Euro
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useStripePayment, Purchase } from '@/hooks/useStripePayment';
import { formatPrice } from '@/lib/stripe';
import { formatBytes } from '@/lib/utils';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { getUserPurchases } = useStripePayment();
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadUserData = async () => {
      setLoading(true);
      try {
        const userPurchases = await getUserPurchases();
        setPurchases(userPurchases);
        
        // Calculate stats
        const totalSpent = userPurchases.reduce((sum, purchase) => sum + purchase.amount_paid, 0);
        setStats({
          totalPurchases: userPurchases.length,
          totalSpent: totalSpent / 100, // Convert from cents
          activeSubscriptions: 0, // For future subscription features
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, navigate, getUserPurchases]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDownload = (purchase: Purchase) => {
    if (purchase.pdf?.file_url) {
      window.open(purchase.pdf.file_url, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-2xl font-bold text-gray-900 font-cooper">
                Finance Transformers
              </Link>
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <div className="lg:col-span-3 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-gray-900 font-cooper">
              Finance Transformers
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Willkommen, {user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut size={14} className="mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* User Profile Card */}
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-[#13B87B] rounded-full flex items-center justify-center mx-auto mb-2">
                  <User size={24} className="text-white" />
                </div>
                <CardTitle className="text-lg">{user?.email}</CardTitle>
                <p className="text-sm text-gray-600">Premium Kunde</p>
              </CardHeader>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Übersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#13B87B]" />
                    <span className="text-sm">Käufe</span>
                  </div>
                  <Badge variant="secondary">{stats.totalPurchases}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro size={16} className="text-[#13B87B]" />
                    <span className="text-sm">Ausgegeben</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPrice(stats.totalSpent, 'EUR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm">Status</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/episodes')}
                >
                  <Eye size={16} className="mr-2" />
                  Alle Reports
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled
                >
                  <Settings size={16} className="mr-2" />
                  Einstellungen
                  <Badge variant="secondary" className="ml-auto text-xs">Bald</Badge>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Willkommen in Ihrem Dashboard</CardTitle>
                <p className="text-gray-600">
                  Verwalten Sie Ihre gekauften Reports und verfolgen Sie Ihre Käufe.
                </p>
              </CardHeader>
            </Card>

            {/* Recent Purchases */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Meine gekauften Reports
                  </CardTitle>
                  {purchases.length > 0 && (
                    <Badge variant="secondary">{purchases.length} Reports</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Noch keine Reports gekauft
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Entdecken Sie unsere Premium Reports mit wertvollen Marktanalysen.
                    </p>
                    <Button onClick={() => navigate('/episodes')} className="bg-[#13B87B] hover:bg-[#0F9A6A]">
                      <Eye size={16} className="mr-2" />
                      Reports ansehen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <div key={purchase.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {purchase.pdf?.image_url ? (
                                <img
                                  src={purchase.pdf.image_url}
                                  alt={purchase.pdf.title}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <FileText size={24} className="text-red-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg mb-1">
                                {purchase.pdf?.title || 'Unbekannter Report'}
                              </h3>
                              {purchase.pdf?.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {purchase.pdf.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>Gekauft am {formatDate(purchase.purchased_at)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CreditCard size={14} />
                                  <span>
                                    {formatPrice(purchase.amount_paid / 100, purchase.currency)}
                                  </span>
                                </div>
                                <Badge 
                                  className={
                                    purchase.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {purchase.status === 'completed' ? 'Abgeschlossen' : 'Ausstehend'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/report/${purchase.pdf_id}`)}
                            >
                              <Eye size={14} className="mr-1" />
                              Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownload(purchase)}
                              className="bg-[#13B87B] hover:bg-[#0F9A6A]"
                              disabled={purchase.status !== 'completed'}
                            >
                              <Download size={14} className="mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchase History Summary */}
            {purchases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Kaufverlauf</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-[#13B87B] mb-1">
                        {stats.totalPurchases}
                      </div>
                      <div className="text-sm text-gray-600">Gekaufte Reports</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-[#13B87B] mb-1">
                        {formatPrice(stats.totalSpent, 'EUR')}
                      </div>
                      <div className="text-sm text-gray-600">Gesamt ausgegeben</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-[#13B87B] mb-1">
                        {purchases.filter(p => p.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-600">Verfügbare Downloads</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;