import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { cn } from '../lib/utils';
import { 
  RefreshCw, 
  Loader2, 
  Plus, 
  Search,
  AlertTriangle,
  Building2,
  Wallet,
  ArrowDownCircle,
  Ban,
  DollarSign
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Refunds = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);
  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPayments, setProjectPayments] = useState(null);
  
  const [formData, setFormData] = useState({
    project_id: '',
    amount: '',
    refund_type: 'partial',
    reason: '',
    account_id: '',
    notes: ''
  });

  const hasPermission = (perm) => {
    if (user?.role === 'Admin') return true;
    return user?.permissions?.includes(perm);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [refundsRes, projectsRes, accountsRes] = await Promise.all([
        axios.get(`${API}/finance/refunds`, { withCredentials: true }),
        axios.get(`${API}/projects`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API}/accounting/accounts`, { withCredentials: true }).catch(() => ({ data: [] }))
      ]);
      setRefunds(refundsRes.data || []);
      setProjects(projectsRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleProjectSelect = async (projectId) => {
    setFormData(prev => ({ ...prev, project_id: projectId }));
    
    if (!projectId) {
      setSelectedProject(null);
      setProjectPayments(null);
      return;
    }

    const proj = projects.find(p => p.project_id === projectId);
    setSelectedProject(proj);

    // Fetch project payment summary
    try {
      const res = await axios.get(`${API}/finance/project-payment-summary/${projectId}`, { withCredentials: true });
      setProjectPayments(res.data);
      // Set max amount for full refund
      if (formData.refund_type === 'full') {
        setFormData(prev => ({ ...prev, amount: res.data.total_received || 0 }));
      }
    } catch (error) {
      console.error('Failed to fetch project payments:', error);
      setProjectPayments(null);
    }
  };

  const handleRefundTypeChange = (type) => {
    setFormData(prev => ({ ...prev, refund_type: type }));
    if (type === 'full' && projectPayments) {
      setFormData(prev => ({ ...prev, amount: projectPayments.total_received || 0 }));
    } else if (type === 'forfeited') {
      setFormData(prev => ({ ...prev, amount: 0 }));
    }
  };

  const handleCreateRefund = async () => {
    if (!formData.project_id) {
      toast.error('Please select a project');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    if (formData.refund_type !== 'forfeited' && (!formData.amount || formData.amount <= 0)) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    if (formData.refund_type !== 'forfeited' && !formData.account_id) {
      toast.error('Please select an account for the refund');
      return;
    }

    try {
      setCreating(true);
      await axios.post(`${API}/finance/refunds`, {
        project_id: formData.project_id,
        amount: parseFloat(formData.amount) || 0,
        refund_type: formData.refund_type,
        reason: formData.reason,
        account_id: formData.account_id || 'none',
        notes: formData.notes
      }, { withCredentials: true });
      
      toast.success('Refund processed successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create refund:', error);
      toast.error(error.response?.data?.detail || 'Failed to process refund');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      amount: '',
      refund_type: 'partial',
      reason: '',
      account_id: '',
      notes: ''
    });
    setSelectedProject(null);
    setProjectPayments(null);
  };

  const filteredRefunds = refunds.filter(ref => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ref.refund_number?.toLowerCase().includes(search) ||
      ref.project?.client_name?.toLowerCase().includes(search) ||
      ref.reason?.toLowerCase().includes(search)
    );
  });

  const getRefundTypeBadge = (type) => {
    switch (type) {
      case 'full':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Full Refund</Badge>;
      case 'partial':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Partial Refund</Badge>;
      case 'forfeited':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Forfeited</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-spinner">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="refunds-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-red-600" />
            Refunds & Cancellations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Process refunds, cancellations, and booking forfeitures
          </p>
        </div>
        {hasPermission('finance.issue_refund') && (
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-red-600 hover:bg-red-700"
            data-testid="process-refund-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Process Refund
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search refunds by number, client, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              data-testid="search-refunds-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Refund Types</p>
            <ul className="text-xs text-red-600 mt-1 space-y-1">
              <li><strong>Full Refund:</strong> Return entire amount received to customer</li>
              <li><strong>Partial Refund:</strong> Return a portion, keep the rest</li>
              <li><strong>Forfeited:</strong> Booking cancelled, no refund issued (e.g., cancellation charges)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-lg">Refund History</CardTitle>
          <CardDescription>{filteredRefunds.length} refund(s) processed</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRefunds.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No refunds processed yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Refund #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Refunded</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Forfeited</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRefunds.map((refund) => (
                    <tr key={refund.refund_id} className="hover:bg-slate-50" data-testid={`refund-row-${refund.refund_id}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-red-600">{refund.refund_number}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(refund.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-900">{refund.project?.project_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {getRefundTypeBadge(refund.refund_type)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {refund.amount > 0 ? (
                          <span className="font-medium text-red-600">{formatCurrency(refund.amount)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {refund.forfeited_amount > 0 ? (
                          <span className="font-medium text-slate-600">{formatCurrency(refund.forfeited_amount)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{refund.reason}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{refund.created_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Refund Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsCreateDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-red-600" />
              Process Refund / Cancellation
            </DialogTitle>
            <DialogDescription>
              Select a project and specify refund details. This action will be recorded and reflected in the cashbook.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label>Select Project *</Label>
              <Select value={formData.project_id} onValueChange={handleProjectSelect}>
                <SelectTrigger data-testid="select-project-for-refund">
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((proj) => (
                    <SelectItem key={proj.project_id} value={proj.project_id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{proj.project_name}</span>
                        <span className="text-xs text-slate-400">({proj.client_name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Payment Summary */}
            {projectPayments && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-slate-700">Payment Summary</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Contract Value</p>
                    <p className="font-medium">{formatCurrency(projectPayments.contract_value)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total Received</p>
                    <p className="font-medium text-green-600">{formatCurrency(projectPayments.total_received)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Refund Type */}
            <div className="space-y-2">
              <Label>Refund Type *</Label>
              <Select value={formData.refund_type} onValueChange={handleRefundTypeChange}>
                <SelectTrigger data-testid="select-refund-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-amber-500" />
                      <span>Partial Refund</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-red-500" />
                      <span>Full Refund</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="forfeited">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-slate-500" />
                      <span>Forfeited (No Refund)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refund Amount */}
            {formData.refund_type !== 'forfeited' && (
              <div className="space-y-2">
                <Label>Refund Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className="pl-7"
                    disabled={formData.refund_type === 'full'}
                    data-testid="refund-amount-input"
                  />
                </div>
                {projectPayments && formData.refund_type === 'partial' && (
                  <p className="text-xs text-slate-500">
                    Maximum: {formatCurrency(projectPayments.total_received)}
                  </p>
                )}
              </div>
            )}

            {/* Account Selection */}
            {formData.refund_type !== 'forfeited' && (
              <div className="space-y-2">
                <Label>Refund From Account *</Label>
                <Select value={formData.account_id} onValueChange={(v) => setFormData(prev => ({ ...prev, account_id: v }))}>
                  <SelectTrigger data-testid="select-refund-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.account_id} value={acc.account_id}>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-slate-400" />
                          <span>{acc.account_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Customer requested cancellation, Project scope change"
                data-testid="refund-reason-input"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional details..."
                rows={2}
                data-testid="refund-notes-input"
              />
            </div>

            {/* Warning for forfeited */}
            {formData.refund_type === 'forfeited' && projectPayments && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Forfeited Amount:</strong> {formatCurrency(projectPayments.total_received)}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  This amount will be marked as forfeited. No refund will be issued to the customer.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false); }}>Cancel</Button>
            <Button 
              onClick={handleCreateRefund}
              disabled={creating}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-refund-btn"
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Refunds;
