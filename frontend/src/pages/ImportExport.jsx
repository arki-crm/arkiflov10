import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, 
  XCircle, Loader2, FileText, Users, DollarSign, Receipt, 
  Wallet, Building, TrendingUp, ChevronRight, History, Info,
  RefreshCw, Trash2, Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ICON_MAP = {
  cashbook: Wallet,
  receipts: Receipt,
  liabilities: AlertTriangle,
  salaries: Users,
  project_finance: TrendingUp,
  leads: Users,
  projects: Building,
  customers: Users,
};

const ImportExport = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [exportTypes, setExportTypes] = useState({ finance: [], crm: [] });
  const [importTypes, setImportTypes] = useState({ finance: [], crm: [], duplicate_strategies: [] });
  const [importHistory, setImportHistory] = useState([]);
  
  // Export state
  const [selectedExportType, setSelectedExportType] = useState('');
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Import state
  const [selectedImportType, setSelectedImportType] = useState('');
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchExportTypes();
    fetchImportTypes();
    fetchImportHistory();
  }, []);

  const fetchExportTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/export/types`, { withCredentials: true });
      setExportTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch export types:', error);
    }
  };

  const fetchImportTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/import/types`, { withCredentials: true });
      setImportTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch import types:', error);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/import/history`, { withCredentials: true });
      setImportHistory(response.data.imports || []);
    } catch (error) {
      console.error('Failed to fetch import history:', error);
    }
  };

  const handleExport = async () => {
    if (!selectedExportType) {
      toast.error('Please select a data type to export');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/export`,
        {
          data_type: selectedExportType,
          format: exportFormat,
          date_from: dateFrom || null,
          date_to: dateTo || null,
        },
        {
          withCredentials: true,
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = response.headers['content-disposition']?.split('filename=')[1] || 
        `${selectedExportType}_export.${exportFormat}`;
      link.setAttribute('download', filename.replace(/"/g, ''));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(error.response?.data?.detail || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async (dataType) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/export/template/${dataType}`,
        {
          withCredentials: true,
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataType}_import_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded');
    } catch (error) {
      console.error('Template download failed:', error);
      toast.error('Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(ext)) {
        toast.error('Please select an Excel (.xlsx, .xls) or CSV file');
        return;
      }
      setSelectedFile(file);
      setPreviewData(null);
    }
  };

  const handlePreviewImport = async () => {
    if (!selectedFile || !selectedImportType) {
      toast.error('Please select a file and data type');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(
        `${API_URL}/api/admin/import/preview?data_type=${selectedImportType}&duplicate_strategy=${duplicateStrategy}`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setPreviewData(response.data);
      setShowPreviewDialog(true);
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to preview import');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData?.preview_id) {
      toast.error('No preview data available');
      return;
    }

    setImporting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/import/execute`,
        {
          data_type: selectedImportType,
          duplicate_strategy: duplicateStrategy,
          preview_id: previewData.preview_id,
        },
        { withCredentials: true }
      );

      toast.success(response.data.message);
      setShowPreviewDialog(false);
      setPreviewData(null);
      setSelectedFile(null);
      fetchImportHistory();
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const DataTypeCard = ({ item, onClick, selected }) => {
    const Icon = ICON_MAP[item.id] || FileText;
    return (
      <Card 
        className={`cursor-pointer transition-all hover:border-blue-500 ${selected ? 'border-blue-500 bg-blue-50' : ''}`}
        onClick={onClick}
        data-testid={`export-type-${item.id}`}
      >
        <CardContent className="p-4 flex items-start gap-3">
          <div className={`p-2 rounded-lg ${selected ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Icon className={`w-5 h-5 ${selected ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{item.name}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
          </div>
          {selected && <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="import-export-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import / Export</h1>
        <p className="text-gray-500 mt-1">
          Export data for CA compliance or import historical records
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="export" className="gap-2" data-testid="export-tab">
            <Download className="w-4 h-4" />
            Export Data
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2" data-testid="import-tab">
            <Upload className="w-4 h-4" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" data-testid="history-tab">
            <History className="w-4 h-4" />
            Import History
          </TabsTrigger>
        </TabsList>

        {/* EXPORT TAB */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Data</CardTitle>
              <CardDescription>
                Select data type and format to export. Data will be downloaded as Excel or CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Finance Data Types */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Finance Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {exportTypes.finance?.map((item) => (
                    <DataTypeCard
                      key={item.id}
                      item={item}
                      selected={selectedExportType === item.id}
                      onClick={() => setSelectedExportType(item.id)}
                    />
                  ))}
                </div>
              </div>

              {/* CRM Data Types */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  CRM Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {exportTypes.crm?.map((item) => (
                    <DataTypeCard
                      key={item.id}
                      item={item}
                      selected={selectedExportType === item.id}
                      onClick={() => setSelectedExportType(item.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm">Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="mt-1" data-testid="export-format-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">From Date (Optional)</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="mt-1"
                      data-testid="export-date-from"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">To Date (Optional)</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="mt-1"
                      data-testid="export-date-to"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleExport}
                      disabled={!selectedExportType || loading}
                      className="w-full"
                      data-testid="export-button"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IMPORT TAB */}
        <TabsContent value="import" className="space-y-6">
          {/* Critical Warning */}
          <Alert variant="warning" className="border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Important: Imported Data Restrictions</AlertTitle>
            <AlertDescription className="text-amber-700">
              <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
                <li>All imported records will be tagged as <strong>"imported"</strong></li>
                <li>Imported financial data is <strong>EXCLUDED</strong> from live calculations</li>
                <li>Cash lock, safe surplus, and spending eligibility will NOT include imported data</li>
                <li>Imported data is for <strong>historical reference and CA/audit compliance only</strong></li>
              </ul>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Data</CardTitle>
              <CardDescription>
                Import historical data from Excel or CSV files. Download a template first to ensure correct format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Finance Import Types */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Finance Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {importTypes.finance?.map((item) => (
                    <Card 
                      key={item.id}
                      className={`cursor-pointer transition-all hover:border-blue-500 ${selectedImportType === item.id ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setSelectedImportType(item.id)}
                      data-testid={`import-type-${item.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${selectedImportType === item.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              {React.createElement(ICON_MAP[item.id] || FileText, {
                                className: `w-5 h-5 ${selectedImportType === item.id ? 'text-blue-600' : 'text-gray-600'}`
                              })}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.required_fields?.map((field) => (
                                  <Badge key={field} variant="secondary" className="text-xs">
                                    {field}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadTemplate(item.id);
                            }}
                            data-testid={`download-template-${item.id}`}
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* CRM Import Types */}
              <div>
                <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  CRM Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {importTypes.crm?.map((item) => (
                    <Card 
                      key={item.id}
                      className={`cursor-pointer transition-all hover:border-blue-500 ${selectedImportType === item.id ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setSelectedImportType(item.id)}
                      data-testid={`import-type-${item.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${selectedImportType === item.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              {React.createElement(ICON_MAP[item.id] || FileText, {
                                className: `w-5 h-5 ${selectedImportType === item.id ? 'text-blue-600' : 'text-gray-600'}`
                              })}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.required_fields?.map((field) => (
                                  <Badge key={field} variant="secondary" className="text-xs">
                                    {field}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadTemplate(item.id);
                            }}
                            data-testid={`download-template-${item.id}`}
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Import Options */}
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm">Duplicate Handling</Label>
                    <Select value={duplicateStrategy} onValueChange={setDuplicateStrategy}>
                      <SelectTrigger className="mt-1" data-testid="duplicate-strategy-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {importTypes.duplicate_strategies?.map((strategy) => (
                          <SelectItem key={strategy.id} value={strategy.id}>
                            {strategy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {importTypes.duplicate_strategies?.find(s => s.id === duplicateStrategy)?.description}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">Select File</Label>
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="mt-1"
                      data-testid="import-file-input"
                    />
                    {selectedFile && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {selectedFile.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handlePreviewImport}
                      disabled={!selectedImportType || !selectedFile || loading}
                      className="w-full"
                      data-testid="preview-import-button"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      Preview Import
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Import History</CardTitle>
                <CardDescription>
                  View past import operations and their results
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchImportHistory}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {importHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No import history found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Import ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Total Rows</TableHead>
                      <TableHead>Imported</TableHead>
                      <TableHead>Skipped</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((item) => (
                      <TableRow key={item.import_id} data-testid={`import-history-${item.import_id}`}>
                        <TableCell className="font-mono text-xs">{item.import_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.data_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={item.file_name}>
                          {item.file_name}
                        </TableCell>
                        <TableCell>{item.total_rows}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{item.imported_count}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-500">{item.skipped_count}</span>
                        </TableCell>
                        <TableCell>
                          {item.error_count > 0 ? (
                            <span className="text-red-600 font-medium">{item.error_count}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(item.import_date)}</TableCell>
                        <TableCell className="text-sm">{item.imported_by_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              Review the data before importing. File: {previewData?.file_name}
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{previewData.total_rows}</div>
                    <div className="text-xs text-gray-500">Total Rows</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{previewData.valid_count}</div>
                    <div className="text-xs text-green-600">Valid</div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">{previewData.duplicate_count}</div>
                    <div className="text-xs text-amber-600">Duplicates</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{previewData.error_count}</div>
                    <div className="text-xs text-red-600">Errors</div>
                  </CardContent>
                </Card>
              </div>

              {/* Warnings */}
              {previewData.warnings?.length > 0 && (
                <Alert variant="warning" className="border-amber-500 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Warnings</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    <ul className="list-disc ml-4 mt-1 space-y-1 text-sm">
                      {previewData.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Sample Valid Rows */}
              {previewData.sample_valid?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Sample Valid Rows (first 5)
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(previewData.sample_valid.map(r => r.data), null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {previewData.duplicates?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Duplicates (showing first 10)
                  </h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {previewData.duplicates.map((d, i) => (
                      <div key={i} className="text-xs mb-2 pb-2 border-b border-amber-200 last:border-0">
                        <span className="text-amber-700">Row {d.row}:</span> {d.match_reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {previewData.errors?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Errors (showing first 10)
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {previewData.errors.map((e, i) => (
                      <div key={i} className="text-xs mb-2 pb-2 border-b border-red-200 last:border-0">
                        <span className="text-red-700 font-medium">Row {e.row}:</span>
                        <ul className="ml-4 list-disc">
                          {e.errors.map((err, j) => (
                            <li key={j}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExecuteImport}
              disabled={importing || (previewData?.valid_count === 0 && previewData?.duplicate_count === 0)}
              data-testid="execute-import-button"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import {previewData?.valid_count || 0} Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExport;
