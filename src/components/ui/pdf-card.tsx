import React from 'react';
import { Download, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PDF } from '@/hooks/usePdfs';
import { formatBytes } from '@/lib/utils';

interface PDFCardProps {
  pdf: PDF;
  onDownload: (pdfId: string) => void;
}


export const PDFCard = ({ pdf, onDownload }: PDFCardProps) => {
  const handleDownload = () => {
    onDownload(pdf.id);
    // Open the PDF in a new tab
    window.open(pdf.file_url, '_blank');
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
        {pdf.image_url ? (
          <img
            src={pdf.image_url}
            alt={pdf.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <FileText size={64} className="text-red-500" />
        )}
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight mb-2">
          {pdf.title}
        </CardTitle>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          {pdf.file_size && (
            <div className="flex items-center">
              <FileText size={14} className="mr-1" />
              <span>{formatBytes(pdf.file_size)}</span>
            </div>
          )}
          {pdf.created_at && (
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <span>{new Date(pdf.created_at).toLocaleDateString('de-DE')}</span>
            </div>
          )}
        </div>

        {pdf.download_count !== null && pdf.download_count > 0 && (
          <div className="text-sm text-gray-600 mb-3">
            <span>{pdf.download_count} Downloads</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {pdf.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {pdf.description}
          </p>
        )}
        
        <Button 
          onClick={handleDownload}
          className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white"
        >
          <Download size={16} className="mr-2" />
          PDF herunterladen
        </Button>
      </CardContent>
    </Card>
  );
};