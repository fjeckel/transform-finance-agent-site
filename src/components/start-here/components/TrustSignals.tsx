'use client';

import React from 'react';
import Image from 'next/image';

interface Company {
  name: string;
  logo?: string;
  category: 'startup' | 'scaleup' | 'enterprise' | 'saas' | 'consulting';
  description: string;
}

interface TrustSignalsProps {
  companies: Company[];
  onInteraction: (signalType: 'company_logo', signalId: string, action: 'viewed' | 'clicked' | 'hovered') => void;
  className?: string;
}

export const TrustSignals: React.FC<TrustSignalsProps> = ({
  companies,
  onInteraction,
  className = ''
}) => {
  const handleCompanyHover = (companyName: string) => {
    onInteraction('company_logo', companyName.toLowerCase(), 'hovered');
  };

  const handleCompanyClick = (companyName: string) => {
    onInteraction('company_logo', companyName.toLowerCase(), 'clicked');
  };

  React.useEffect(() => {
    // Track initial view of trust signals
    companies.forEach(company => {
      onInteraction('company_logo', company.name.toLowerCase(), 'viewed');
    });
  }, [companies, onInteraction]);

  return (
    <div className={`${className}`}>
      <p className="text-sm text-gray-500 mb-4">
        Vertraut von Finance-Führungskräften bei:
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 hover:opacity-80 transition-opacity duration-300">
        {companies.map((company, index) => (
          <div
            key={company.name}
            className="group cursor-pointer transition-all duration-200 hover:scale-105"
            onMouseEnter={() => handleCompanyHover(company.name)}
            onClick={() => handleCompanyClick(company.name)}
            title={`${company.name} - ${company.description}`}
          >
            {company.logo ? (
              <div className="relative">
                <Image
                  src={company.logo}
                  alt={`${company.name} Logo`}
                  width={120}
                  height={40}
                  className="h-8 w-auto grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 group-hover:border-gray-300 group-hover:bg-gray-100 transition-all duration-200">
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                  {company.name}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  {company.description}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <span className="text-xs text-gray-400">
          und 100+ weitere innovative Unternehmen
        </span>
      </div>
    </div>
  );
};