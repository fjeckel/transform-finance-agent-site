import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Search, 
  Filter,
  FileText,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PDFUpload } from '@/components/ui/pdf-upload';
import { useAdminPdfs } from '@/hooks/useAdminPdfs';
import { formatBytes } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PDF } from '@/hooks/usePdfs';

const createPdfSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  file_url: z.string().min(1, 'PDF file is required'),
  is_premium: z.boolean().default(false),
  price: z.number().min(0, 'Price must be positive').optional(),
  currency: z.string().default('EUR'),
});

const editPdfSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'archived']),
  is_premium: z.boolean().default(false),
  price: z.number().min(0, 'Price must be positive').optional(),
  currency: z.string().default('EUR'),
});

type CreatePdfForm = z.infer<typeof createPdfSchema>;
type EditPdfForm = z.infer<typeof editPdfSchema>;

const AdminPdfs = () => {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState<PDF | null>(null);

  const {
    pdfs,
    isLoading,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    categories,
    createPdf,
    updatePdf,
    archivePdf,
    deletePdf,
    isCreating,
    isUpdating,
    isArchiving,
    isDeleting,
  } = useAdminPdfs();

  const createForm = useForm<CreatePdfForm>({
    resolver: zodResolver(createPdfSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'general',
      file_url: '',
      is_premium: false,
      price: 0,
      currency: 'EUR',
    },
  });

  const editForm = useForm<EditPdfForm>({
    resolver: zodResolver(editPdfSchema),
  });

  const handleCreateSubmit = (data: CreatePdfForm) => {
    createPdf({
      title: data.title,
      description: data.description,
      category: data.category,
      file_url: data.file_url,
      file_size: null, // Will be updated when we get file size from upload
      is_premium: data.is_premium,
      price: data.is_premium ? data.price : 0,
      currency: data.currency,
    });
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const handleEditSubmit = (data: EditPdfForm) => {
    if (!editingPdf) return;
    
    updatePdf({
      id: editingPdf.id,
      updateData: data,
    });
    setIsEditDialogOpen(false);
    setEditingPdf(null);
    editForm.reset();
  };

  const handleEdit = (pdf: PDF) => {
    setEditingPdf(pdf);
    editForm.reset({
      title: pdf.title,
      description: pdf.description || '',
      category: (pdf.category as string) || 'general',
      status: (pdf.status as 'active' | 'archived') || 'active',
    });
    setIsEditDialogOpen(true);
  };

  const handleDownload = (pdf: PDF) => {
    window.open(pdf.file_url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      finance: 'bg-green-100 text-green-800',
      reports: 'bg-purple-100 text-purple-800',
      guides: 'bg-orange-100 text-orange-800',
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || colors.general}>
        {category}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link to="/" className="text-2xl font-bold text-gray-900 font-cooper">
                  Finance Transformers
                </Link>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-gray-900 font-cooper">
                Finance Transformers
              </Link>
              <Badge variant="secondary">Admin</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Back to Admin
              </Link>
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                PDF Library
              </CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#13B87B] hover:bg-[#0F9A6A]">
                    <Plus size={16} className="mr-2" />
                    Upload PDF
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload New PDF</DialogTitle>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="file_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PDF File</FormLabel>
                            <FormControl>
                              <PDFUpload
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isCreating}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="PDF title" disabled={isCreating} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="PDF description" disabled={isCreating} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCreating}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="reports">Reports</SelectItem>
                                <SelectItem value="guides">Guides</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Pricing Section */}
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-sm">Pricing & Monetization</h4>
                        
                        <FormField
                          control={createForm.control}
                          name="is_premium"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Premium Content</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Require payment to access this PDF
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={isCreating}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {createForm.watch('is_premium') && (
                          <>
                            <FormField
                              control={createForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      disabled={isCreating}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={createForm.control}
                              name="currency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Currency</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCreating}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="EUR">EUR (€)</SelectItem>
                                      <SelectItem value="USD">USD ($)</SelectItem>
                                      <SelectItem value="GBP">GBP (£)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                          {isCreating ? 'Uploading...' : 'Upload PDF'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PDFs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PDF List */}
            <div className="space-y-4">
              {pdfs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                    ? 'No PDFs found matching your filters.'
                    : 'No PDFs uploaded yet. Upload your first PDF to get started.'
                  }
                </div>
              ) : (
                pdfs.map((pdf) => (
                  <div key={pdf.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-red-600" />
                      <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium">{pdf.title}</h3>
                            {getCategoryBadge((pdf.category as string) || 'general')}
                            {getStatusBadge((pdf.status as string) || 'active')}
                            {pdf.is_premium && (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                Premium - {pdf.price ? `${pdf.price} ${pdf.currency || 'EUR'}` : 'No Price Set'}
                              </Badge>
                            )}
                          </div>
                        {pdf.description && (
                          <p className="text-sm text-gray-600 mb-1">{pdf.description}</p>
                        )}
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          {pdf.file_size && <span>Size: {formatBytes(pdf.file_size)}</span>}
                          <span>Downloads: {pdf.download_count || 0}</span>
                          <span>Created: {new Date(pdf.created_at!).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(pdf)}
                      >
                        <Download size={14} className="mr-1" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(pdf)}
                        disabled={isUpdating}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isArchiving}
                          >
                            <Archive size={14} className="mr-1" />
                            Archive
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive PDF</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to archive "{pdf.title}"? This will hide it from public view but keep it in the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => archivePdf(pdf.id)}>
                              Archive
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={isDeleting}
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              Permanently Delete PDF
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete "{pdf.title}"? This will remove the file from storage and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deletePdf(pdf)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit PDF</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="PDF title" disabled={isUpdating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="PDF description" disabled={isUpdating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isUpdating}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="reports">Reports</SelectItem>
                          <SelectItem value="guides">Guides</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                          disabled={isUpdating}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="active" id="active" />
                            <Label htmlFor="active">Active</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="archived" id="archived" />
                            <Label htmlFor="archived">Archived</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update PDF'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPdfs;