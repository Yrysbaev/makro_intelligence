'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, X,
  Download, Table, ChevronRight,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ParsedInvoiceRow } from '@/types';

interface UploadState {
  file: File | null;
  status: 'idle' | 'parsing' | 'preview' | 'uploading' | 'success' | 'error';
  progress: number;
  parsedRows: ParsedInvoiceRow[];
  errors: string[];
  recordsProcessed: number;
}

const SAMPLE_CSV = `invoice_number,invoice_date,customer_name,product_name,sku,quantity,unit_price,total,sales_manager,city,state,category
INV-2024-001,2024-11-15,Metro Grocery Chain,Fresh Chicken Breast,MET-001,10,89.99,899.90,James Thompson,New York,NY,Meat & Poultry
INV-2024-001,2024-11-15,Metro Grocery Chain,Roma Tomatoes,PRD-001,20,24.99,499.80,James Thompson,New York,NY,Produce
INV-2024-002,2024-11-16,Chicago Steakhouse,Ground Beef 80/20,MET-002,5,145.00,725.00,Sarah Wilson,Chicago,IL,Meat & Poultry
INV-2024-002,2024-11-16,Chicago Steakhouse,Mozzarella Cheese,DRY-001,8,67.50,540.00,Sarah Wilson,Chicago,IL,Dairy
INV-2024-003,2024-11-18,Austin BBQ House,Pork Shoulder,MET-003,12,110.00,1320.00,Maria Rodriguez,Austin,TX,Meat & Poultry`;

function parseCsvSimple(content: string): ParsedInvoiceRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return {
      invoice_number: row.invoice_number || '',
      invoice_date: row.invoice_date || '',
      customer_name: row.customer_name || '',
      product_name: row.product_name || '',
      sku: row.sku,
      quantity: parseFloat(row.quantity) || 0,
      unit_price: parseFloat(row.unit_price) || 0,
      total: parseFloat(row.total) || 0,
      sales_manager: row.sales_manager,
      city: row.city,
      state: row.state,
      category: row.category,
    };
  });
}

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<UploadState>({
    file: null,
    status: 'idle',
    progress: 0,
    parsedRows: [],
    errors: [],
    recordsProcessed: 0,
  });

  const processFile = async (file: File) => {
    setState((prev) => ({ ...prev, file, status: 'parsing', progress: 20 }));

    try {
      const text = await file.text();
      const rows = parseCsvSimple(text);

      if (rows.length === 0) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          errors: ['Could not parse file. Make sure it matches the expected CSV format.'],
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        status: 'preview',
        progress: 60,
        parsedRows: rows,
        errors: [],
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        errors: ['Failed to read file. Please ensure it is a valid CSV.'],
      }));
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        errors: ['Unsupported file type. Please upload a CSV or Excel file.'],
      }));
      return;
    }
    processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleImport = async () => {
    setState((prev) => ({ ...prev, status: 'uploading', progress: 70 }));
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setState((prev) => ({
      ...prev,
      status: 'success',
      progress: 100,
      recordsProcessed: prev.parsedRows.length,
    }));
  };

  const handleReset = () => {
    setState({
      file: null,
      status: 'idle',
      progress: 0,
      parsedRows: [],
      errors: [],
      recordsProcessed: 0,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'makro_sample_invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col">
      <Header title="Upload Data" subtitle="Import invoices, sales data, products, and customers" />
      <div className="p-6 space-y-6">

        {/* Upload instructions */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { step: '1', title: 'Prepare Your File', desc: 'Format your data as CSV or Excel with the required column headers.' },
            { step: '2', title: 'Upload & Preview', desc: 'Drag & drop or select your file. Review the parsed data before importing.' },
            { step: '3', title: 'Import & Sync', desc: 'Confirm the import to update your dashboard with the new data.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Upload Area */}
          <div className="xl:col-span-2 space-y-4">
            {state.status === 'idle' || state.status === 'error' ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Upload File</CardTitle>
                  <CardDescription>Supported formats: CSV, XLSX, XLS (max 10MB)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                      isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className={`mx-auto h-10 w-10 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="text-base font-semibold text-gray-700">Drop your file here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                  </div>

                  {state.status === 'error' && state.errors.length > 0 && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                      {state.errors.map((err, i) => (
                        <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : state.status === 'parsing' ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                    <FileText className="h-6 w-6 text-blue-500 animate-pulse" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-4">Parsing file...</p>
                  <Progress value={state.progress} className="w-full max-w-xs mx-auto" />
                </CardContent>
              </Card>
            ) : state.status === 'preview' ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Preview Import</CardTitle>
                      <CardDescription>{state.parsedRows.length} rows parsed from {state.file?.name}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleImport}>
                        <ChevronRight className="h-4 w-4 mr-1" /> Import Data
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Invoice #', 'Date', 'Customer', 'Product', 'Qty', 'Price', 'Total', 'Manager'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {state.parsedRows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono text-gray-600">{row.invoice_number}</td>
                            <td className="px-3 py-2 text-gray-600">{row.invoice_date}</td>
                            <td className="px-3 py-2 font-medium text-gray-800">{row.customer_name}</td>
                            <td className="px-3 py-2 text-gray-700">{row.product_name}</td>
                            <td className="px-3 py-2 text-gray-600">{row.quantity}</td>
                            <td className="px-3 py-2 text-gray-600">${row.unit_price}</td>
                            <td className="px-3 py-2 font-semibold text-gray-900">${row.total}</td>
                            <td className="px-3 py-2 text-gray-600">{row.sales_manager}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {state.parsedRows.length > 10 && (
                      <p className="py-2 text-center text-xs text-gray-400">
                        ... and {state.parsedRows.length - 10} more rows
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : state.status === 'uploading' ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                    <Upload className="h-6 w-6 text-blue-500 animate-bounce" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-4">Importing data...</p>
                  <Progress value={state.progress} className="w-full max-w-xs mx-auto" />
                  <p className="mt-2 text-xs text-gray-500">Processing {state.parsedRows.length} records</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-800">Import Successful!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {state.recordsProcessed} records imported from {state.file?.name}
                  </p>
                  <div className="mt-4 flex gap-3 justify-center">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      Upload Another File
                    </Button>
                    <Button size="sm" asChild>
                      <a href="/">View Dashboard</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sample Template</CardTitle>
                <CardDescription className="text-xs">Download the template to format your data correctly</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full text-sm" onClick={downloadSampleCsv}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Required Columns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {[
                    { col: 'invoice_number', req: true },
                    { col: 'invoice_date', req: true },
                    { col: 'customer_name', req: true },
                    { col: 'product_name', req: true },
                    { col: 'quantity', req: true },
                    { col: 'unit_price', req: true },
                    { col: 'total', req: true },
                    { col: 'sku', req: false },
                    { col: 'sales_manager', req: false },
                    { col: 'city', req: false },
                    { col: 'state', req: false },
                    { col: 'category', req: false },
                  ].map((item) => (
                    <div key={item.col} className="flex items-center justify-between">
                      <code className="text-xs font-mono text-gray-700">{item.col}</code>
                      <Badge variant={item.req ? 'info' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {item.req ? 'Required' : 'Optional'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'november_invoices.csv', date: '2024-11-30', status: 'success', records: 155 },
                    { name: 'october_invoices.csv', date: '2024-10-31', status: 'success', records: 142 },
                    { name: 'inventory_update.xlsx', date: '2024-10-15', status: 'success', records: 20 },
                  ].map((upload) => (
                    <div key={upload.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-700 truncate max-w-[130px]">{upload.name}</p>
                          <p className="text-[10px] text-gray-400">{upload.records} records · {upload.date}</p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px]">Done</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
