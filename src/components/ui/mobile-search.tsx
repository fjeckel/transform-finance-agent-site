import React from 'react';
import { SearchBox } from './search-box';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MobileSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileSearch: React.FC<MobileSearchProps> = ({ open, onOpenChange }) => {
  const { performSearch } = useGlobalSearch();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      performSearch(query);
      onOpenChange(false); // Close modal after search
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <SearchBox 
          onSearch={handleSearch}
          placeholder="Search episodes, insights..."
          className="w-full"
        />
      </DialogContent>
    </Dialog>
  );
};

export default MobileSearch;