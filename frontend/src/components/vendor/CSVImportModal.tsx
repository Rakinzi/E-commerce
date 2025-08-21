import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { vendorAPI } from '@/lib/api';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onImportComplete
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const csvFile = e.dataTransfer.files[0];
      if (csvFile.type === 'text/csv' || csvFile.name.endsWith('.csv')) {
        setFile(csvFile);
      } else {
        alert('Please select a CSV file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const csvFile = e.target.files[0];
      if (csvFile.type === 'text/csv' || csvFile.name.endsWith('.csv')) {
        setFile(csvFile);
      } else {
        alert('Please select a CSV file');
        e.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await vendorAPI.downloadCSVTemplate();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('csvFile', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await vendorAPI.importProductsCSV(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setImportResult(response.data);
        setIsUploading(false);
      }, 500);
      
    } catch (error: any) {
      console.error('Import failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
      
      // Try to extract error details from response
      let errorMessage = 'Import failed. Please check your CSV file and try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setImportResult({
        success: false,
        successCount: 0,
        errorCount: 1,
        errors: [{ row: 0, errors: [errorMessage] }]
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  const handleComplete = () => {
    handleClose();
    onImportComplete();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-none shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-black text-black tracking-tight">
              BULK IMPORT PRODUCTS
            </h2>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="rounded-none"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!importResult && !isUploading && (
              <>
                {/* Instructions */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3">How to Import Products:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Download our CSV template to ensure proper formatting</li>
                    <li>Fill in your product data following the template structure</li>
                    <li>Upload your completed CSV file using the area below</li>
                    <li>Review the import results and fix any errors if needed</li>
                  </ol>
                </div>

                {/* Template Download */}
                <div className="mb-6">
                  <Button
                    onClick={handleDownloadTemplate}
                    variant="outline"
                    className="w-full border-black text-black hover:bg-gray-50 rounded-none"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    DOWNLOAD CSV TEMPLATE
                  </Button>
                </div>

                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-none p-8 text-center transition-colors mb-6 ${
                    dragActive ? 'border-black bg-gray-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {file ? (
                    <div>
                      <p className="font-medium text-black mb-2">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        Size: {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-2">
                        Drag and drop your CSV file here, or{' '}
                        <label className="text-black font-medium cursor-pointer hover:underline">
                          browse files
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500">
                        Only CSV files are accepted
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1 rounded-none border-gray-300"
                  >
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!file}
                    className="flex-1 bg-black text-white hover:bg-gray-800 rounded-none"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    IMPORT PRODUCTS
                  </Button>
                </div>
              </>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="font-bold text-lg mb-2">Importing Products...</h3>
                  <p className="text-gray-600">Please wait while we process your CSV file</p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <Progress value={uploadProgress} className="mb-2" />
                  <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
                </div>
              </div>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="py-4">
                <div className="flex items-center justify-center mb-6">
                  {importResult.success ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : (
                    <AlertCircle className="h-16 w-16 text-red-500" />
                  )}
                </div>

                <div className="text-center mb-6">
                  <h3 className="font-bold text-xl mb-2">
                    {importResult.success ? 'Import Completed!' : 'Import Issues Found'}
                  </h3>
                  
                  <div className="space-y-2">
                    {importResult.successCount > 0 && (
                      <p className="text-green-600 font-medium">
                        ✓ {importResult.successCount} products imported successfully
                      </p>
                    )}
                    
                    {importResult.errorCount > 0 && (
                      <p className="text-red-600 font-medium">
                        ✗ {importResult.errorCount} products failed to import
                      </p>
                    )}
                  </div>
                </div>

                {/* Error Details */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-lg mb-3 text-red-600">Errors:</h4>
                    <div className="max-h-60 overflow-y-auto bg-red-50 border border-red-200 rounded p-4">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <p className="font-medium text-red-800">
                            Row {error.row === 0 ? 'General' : error.row}:
                          </p>
                          <ul className="list-disc list-inside text-red-700 text-sm ml-4">
                            {error.errors.map((err, errIndex) => (
                              <li key={errIndex}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  {importResult.success ? (
                    <Button
                      onClick={handleComplete}
                      className="w-full bg-black text-white hover:bg-gray-800 rounded-none"
                    >
                      DONE
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setImportResult(null);
                          setFile(null);
                        }}
                        variant="outline"
                        className="flex-1 rounded-none border-gray-300"
                      >
                        TRY AGAIN
                      </Button>
                      {importResult.successCount > 0 && (
                        <Button
                          onClick={handleComplete}
                          className="flex-1 bg-black text-white hover:bg-gray-800 rounded-none"
                        >
                          CONTINUE
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}