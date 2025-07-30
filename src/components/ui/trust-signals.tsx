import React from 'react';
import { Shield, Lock, CheckCircle, CreditCard, Globe, Award } from 'lucide-react';

export const SecurityBadges: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground py-2">
      <div className="flex items-center gap-1">
        <Shield className="h-4 w-4 text-green-600" />
        <span>SSL Verschlüsselt</span>
      </div>
      <div className="flex items-center gap-1">
        <Lock className="h-4 w-4 text-blue-600" />
        <span>256-Bit Sicherheit</span>
      </div>
      <div className="flex items-center gap-1">
        <CreditCard className="h-4 w-4 text-purple-600" />
        <span>Stripe Sicher</span>
      </div>
    </div>
  );
};

export const TrustIndicators: React.FC = () => {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-3">
      <h3 className="font-semibold text-green-800 dark:text-green-400 flex items-center gap-2">
        <CheckCircle className="h-5 w-5" />
        Vertrauenswürdig & Sicher
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-green-700 dark:text-green-300">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>SSL-verschlüsselte Übertragung</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span>Sichere Zahlung über Stripe</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>DSGVO-konform</span>
        </div>
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          <span>Professionelle Zertifizierung</span>
        </div>
      </div>
    </div>
  );
};

export const PurchaseGuarantee: React.FC = () => {
  return (
    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Shield className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-blue-800 dark:text-blue-400">
          100% Sichere Zahlung
        </span>
      </div>
      <p className="text-sm text-blue-700 dark:text-blue-300">
        Ihre Daten sind bei uns sicher. Sofortiger Download nach erfolgreichem Kauf.
      </p>
    </div>
  );
};

export const CompanyCredentials: React.FC = () => {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-foreground">Über Finance Transformers</h4>
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-start gap-2">
          <Award className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span>20+ Jahre Erfahrung in Finanzmärkten</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <span>Vertrauenswürdige Finanzexperten</span>
        </div>
        <div className="flex items-start gap-2">
          <Globe className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <span>DSGVO-konforme Datenverarbeitung</span>
        </div>
      </div>
    </div>
  );
};