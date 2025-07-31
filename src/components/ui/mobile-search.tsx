import React from 'react';
import { SearchBox } from './search-box';

interface MobileSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileSearch: React.FC<MobileSearchProps> = ({ open, onOpenChange }) => {
  return (
    <SearchBox 
      mobile 
      open={open} 
      onOpenChange={onOpenChange}
    />
  );
};

export default MobileSearch;