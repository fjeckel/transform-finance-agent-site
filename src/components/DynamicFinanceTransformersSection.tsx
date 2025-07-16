import React from 'react';
import { MainPageSection } from '@/hooks/useMainPageSections';
import FinanceTransformersSection from './FinanceTransformersSection';

interface DynamicFinanceTransformersSectionProps {
  section: MainPageSection;
}

const DynamicFinanceTransformersSection: React.FC<DynamicFinanceTransformersSectionProps> = ({ section }) => {
  // For now, we'll use the existing FinanceTransformersSection component
  // This keeps the episode carousel functionality intact
  return <FinanceTransformersSection />;
};

export default DynamicFinanceTransformersSection;
