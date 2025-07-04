import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronDown, Archive, Trash2, Eye } from 'lucide-react';

interface BulkActionsProps {
  selectedItems: string[];
  allItems: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (id: string, checked: boolean) => void;
  onBulkAction: (action: string, itemIds: string[]) => Promise<void>;
  disabled?: boolean;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedItems,
  allItems,
  onSelectAll,
  onSelectItem,
  onBulkAction,
  disabled = false,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const isAllSelected = selectedItems.length === allItems.length && allItems.length > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < allItems.length;

  const handleBulkAction = async (action: string) => {
    if (action === 'delete') {
      setShowDeleteDialog(true);
      setPendingAction('delete');
    } else {
      await onBulkAction(action, selectedItems);
    }
  };

  const confirmDelete = async () => {
    if (pendingAction === 'delete') {
      await onBulkAction('delete', selectedItems);
    }
    setShowDeleteDialog(false);
    setPendingAction(null);
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            disabled={disabled}
            data-state={isPartiallySelected ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked'}
          />
          <span className="text-sm text-muted-foreground">
            {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select all'}
          </span>
        </div>

        {selectedItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={disabled}>
                Bulk Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkAction('publish')}>
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleBulkAction('delete')}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Episodes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.length} episode{selectedItems.length > 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};