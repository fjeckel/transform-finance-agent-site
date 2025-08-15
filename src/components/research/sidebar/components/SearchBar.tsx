import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  SortAsc, 
  SortDesc,
  Calendar,
  Star,
  Archive,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SidebarSearchState, SidebarFilters, ResearchFolder } from '../types';

interface SearchBarProps {
  searchState: SidebarSearchState;
  folders: ResearchFolder[];
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: Partial<SidebarFilters>) => void;
  onSortChange: (sortBy: SidebarSearchState['sortBy'], sortOrder?: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchState,
  folders,
  onSearchChange,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  className
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = Object.values(searchState.filters).filter(value => {
    if (typeof value === 'boolean') return value !== false;
    if (value === null) return false;
    return value !== 'all';
  }).length;

  const sortIcon = searchState.sortOrder === 'asc' ? SortAsc : SortDesc;

  return (
    <div className={cn('space-y-3 p-3 border-b bg-white', className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search sessions..."
          value={searchState.query}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchState.query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter and sort controls */}
      <div className="flex items-center justify-between gap-2">
        {/* Filter button */}
        <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="start">
            <DropdownMenuLabel>Filter Sessions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Status filter */}
            <div className="p-2">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={searchState.filters.status}
                onValueChange={(value) => onFiltersChange({ status: value as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range filter */}
            <div className="p-2">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select
                value={searchState.filters.dateRange}
                onValueChange={(value) => onFiltersChange({ dateRange: value as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Folder filter */}
            <div className="p-2">
              <label className="text-sm font-medium mb-2 block">Folder</label>
              <Select
                value={searchState.filters.folder}
                onValueChange={(value) => onFiltersChange({ folder: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  <SelectItem value="unorganized">Unorganized</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: folder.color }}
                        />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Provider filter */}
            <div className="p-2">
              <label className="text-sm font-medium mb-2 block">AI Provider</label>
              <Select
                value={searchState.filters.provider}
                onValueChange={(value) => onFiltersChange({ provider: value as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="grok">Grok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DropdownMenuSeparator />

            {/* Toggle filters */}
            <DropdownMenuCheckboxItem
              checked={searchState.filters.favorite === true}
              onCheckedChange={(checked) => onFiltersChange({ favorite: checked ? true : null })}
            >
              <Star className="h-4 w-4 mr-2" />
              Favorites Only
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={searchState.filters.archived}
              onCheckedChange={(checked) => onFiltersChange({ archived: checked })}
            >
              <Archive className="h-4 w-4 mr-2" />
              Show Archived
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {React.createElement(sortIcon, { className: 'h-4 w-4 mr-1' })}
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSortChange('updated_at')}>
              <Calendar className="h-4 w-4 mr-2" />
              Last Updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('created_at')}>
              <Calendar className="h-4 w-4 mr-2" />
              Date Created
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('title')}>
              <Search className="h-4 w-4 mr-2" />
              Title
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('cost')}>
              <span className="h-4 w-4 mr-2">$</span>
              Cost
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {searchState.filters.status !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {searchState.filters.status}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ status: 'all' })}
              />
            </Badge>
          )}
          {searchState.filters.dateRange !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {searchState.filters.dateRange}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ dateRange: 'all' })}
              />
            </Badge>
          )}
          {searchState.filters.folder !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              <Folder className="h-3 w-3 mr-1" />
              {searchState.filters.folder === 'unorganized' 
                ? 'Unorganized' 
                : folders.find(f => f.id === searchState.filters.folder)?.name || 'Folder'
              }
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ folder: 'all' })}
              />
            </Badge>
          )}
          {searchState.filters.favorite === true && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Favorites
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFiltersChange({ favorite: null })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};