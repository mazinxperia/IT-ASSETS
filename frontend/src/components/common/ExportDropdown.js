import React, { useState } from 'react';
import { Download, Mail, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';

export function ExportDropdown({ onExport, disabled = false }) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  const handleExport = async (sendEmail) => {
    setExporting(true);
    setExportType(sendEmail ? 'email' : 'download');
    try {
      const response = await onExport(sendEmail);
      
      if (sendEmail) {
        // Email was sent - response is JSON
        toast.success(response.data.message || 'Export sent to your email');
      } else {
        // Download the file - response is blob
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Extract filename from content-disposition header if available
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'export.csv';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export downloaded successfully');
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Export failed';
      toast.error(message);
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || exporting} data-testid="export-dropdown-trigger">
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {exportType === 'email' ? 'Sending...' : 'Exporting...'}
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
              <ChevronDown className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport(false)} data-testid="export-csv-btn">
          <Download className="w-4 h-4 mr-2" />
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(true)} data-testid="export-email-btn">
          <Mail className="w-4 h-4 mr-2" />
          Send to Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
