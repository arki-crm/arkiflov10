import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BarChart3, TrendingUp, DollarSign, Building, FileText,
  ArrowRight, Loader2, Lock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FinanceReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableReports, setAvailableReports] = useState([]);

  useEffect(() => {
    fetchAvailableReports();
  }, []);

  const fetchAvailableReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/finance/reports/available`, { withCredentials: true });
      setAvailableReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load available reports');
    } finally {
      setLoading(false);
    }
  };

  const REPORT_ICONS = {
    'cash-flow': TrendingUp,
    'project-profitability': Building,
  };

  const REPORT_COLORS = {
    'cash-flow': 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    'project-profitability': 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  };

  const handleReportClick = (reportId) => {
    navigate(`/finance/reports/${reportId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="finance-reports-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          Finance Reports
        </h1>
        <p className="text-gray-500 mt-1">
          Analyze cash flow, project profitability, and financial performance
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableReports.map((report) => {
          const Icon = REPORT_ICONS[report.id] || FileText;
          const colorClass = REPORT_COLORS[report.id] || 'bg-gray-50 hover:bg-gray-100';
          
          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all ${colorClass}`}
              onClick={() => handleReportClick(report.id)}
              data-testid={`report-card-${report.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          Default: {report.default_period}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {availableReports.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Reports Available</h3>
            <p className="text-gray-500 mt-2">
              You don't have permission to view any financial reports.
              Contact your administrator for access.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/finance/cashbook')}
          >
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto text-blue-600 mb-2" />
              <p className="text-sm font-medium">Cash Book</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/finance/project-finance')}
          >
            <CardContent className="p-4 text-center">
              <Building className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-medium">Project Finance</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/finance/pnl-snapshot')}
          >
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-2" />
              <p className="text-sm font-medium">P&L Snapshot</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/admin/import-export')}
          >
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto text-orange-600 mb-2" />
              <p className="text-sm font-medium">Export Data</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FinanceReports;
