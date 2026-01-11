import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  Calendar, Download, RefreshCw, Loader2, Building, Wallet, Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const CashFlowReport = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('3months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async (selectedPeriod = period) => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/finance/reports/cash-flow?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        url += `&start_date=${customStartDate}&end_date=${customEndDate}`;
      }
      
      const response = await axios.get(url, { withCredentials: true });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.error(error.response?.data?.detail || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      fetchReport(newPeriod);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      fetchReport('custom');
    } else {
      toast.error('Please select both start and end dates');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/export`,
        {
          data_type: 'cashbook',
          format: 'xlsx',
          date_from: reportData?.date_from,
          date_to: reportData?.date_to,
        },
        {
          withCredentials: true,
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cash_flow_report_${reportData?.date_from}_${reportData?.date_to}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const { summary, monthly_trend, category_breakdown, account_breakdown, project_cash_flow } = reportData || {};

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="cash-flow-report">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Flow Report</h1>
          <p className="text-gray-500 mt-1">
            {reportData?.date_from} to {reportData?.date_to}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => fetchReport(period)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-40">
              <Label className="text-sm">Period</Label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="mt-1" data-testid="period-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {period === 'custom' && (
              <>
                <div>
                  <Label className="text-sm">Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="mt-1 w-40"
                  />
                </div>
                <div>
                  <Label className="text-sm">End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="mt-1 w-40"
                  />
                </div>
                <Button onClick={handleCustomDateApply}>
                  <Filter className="w-4 h-4 mr-2" />
                  Apply
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Inflow</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(summary?.total_inflow)}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Total Outflow</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(summary?.total_outflow)}</p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={summary?.net_cash_flow >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${summary?.net_cash_flow >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Net Cash Flow
                </p>
                <p className={`text-2xl font-bold ${summary?.net_cash_flow >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {formatCurrency(summary?.net_cash_flow)}
                </p>
              </div>
              {summary?.net_cash_flow >= 0 ? (
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-amber-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.transaction_count || 0}</p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthly_trend?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Inflow</TableHead>
                  <TableHead className="text-right">Outflow</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthly_trend.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell className="font-medium">{formatMonth(item.month)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(item.inflow)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(item.outflow)}</TableCell>
                    <TableCell className={`text-right font-medium ${item.net >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formatCurrency(item.net)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Inflow by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              Inflow by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {category_breakdown?.inflow?.length > 0 ? (
              <div className="space-y-3">
                {category_breakdown.inflow.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.category}</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No inflow data</p>
            )}
          </CardContent>
        </Card>

        {/* Outflow by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
              Outflow by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {category_breakdown?.outflow?.length > 0 ? (
              <div className="space-y-3">
                {category_breakdown.outflow.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.category}</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No outflow data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Account Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {account_breakdown?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Inflow</TableHead>
                  <TableHead className="text-right">Outflow</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account_breakdown.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.account}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(item.inflow)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(item.outflow)}</TableCell>
                    <TableCell className={`text-right font-medium ${item.net >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formatCurrency(item.net)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-4">No account data</p>
          )}
        </CardContent>
      </Card>

      {/* Project Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="w-5 h-5" />
            Project Cash Flow (Top 20)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project_cash_flow?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>PID</TableHead>
                  <TableHead className="text-right">Inflow</TableHead>
                  <TableHead className="text-right">Outflow</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project_cash_flow.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.project_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.pid || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(item.inflow)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(item.outflow)}</TableCell>
                    <TableCell className={`text-right font-medium ${item.net >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formatCurrency(item.net)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-4">No project data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CashFlowReport;
