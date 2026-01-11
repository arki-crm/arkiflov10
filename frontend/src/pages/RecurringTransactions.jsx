import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, Plus, Play, Pause, Calendar, IndianRupee, Clock, Edit2, Loader2, CheckCircle, XCircle } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function RecurringTransactions() {
  const { token, user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [runningScheduled, setRunningScheduled] = useState(false);
  const [toggling, setToggling] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category_id: '',
    account_id: '',
    day_of_month: 1,
    description: '',
    paid_to: ''
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API}/api/finance/recurring/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch templates');
      }
      
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndAccounts = async () => {
    try {
      const [catRes, accRes] = await Promise.all([
        fetch(`${API}/api/accounting/categories`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/accounting/accounts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || catData || []);
      }
      
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData.accounts || accData || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories/accounts:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCategoriesAndAccounts();
  }, []);

  const handleCreateTemplate = async () => {
    if (!form.name || !form.amount || !form.category_id || !form.account_id) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch(`${API}/api/finance/recurring/templates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          amount: parseFloat(form.amount),
          category_id: form.category_id,
          account_id: form.account_id,
          day_of_month: parseInt(form.day_of_month),
          description: form.description || form.name,
          paid_to: form.paid_to
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create template');
      }
      
      toast.success('Recurring template created');
      setShowCreateModal(false);
      resetForm();
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!form.name || !form.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch(`${API}/api/finance/recurring/templates/${editingTemplate.template_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          amount: parseFloat(form.amount),
          category_id: form.category_id || undefined,
          account_id: form.account_id || undefined,
          day_of_month: parseInt(form.day_of_month),
          description: form.description,
          paid_to: form.paid_to
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update template');
      }
      
      toast.success('Template updated');
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleTemplate = async (templateId) => {
    setToggling(templateId);
    try {
      const res = await fetch(`${API}/api/finance/recurring/templates/${templateId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to toggle template');
      }
      
      const data = await res.json();
      toast.success(data.message);
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setToggling(null);
    }
  };

  const handleRunScheduled = async () => {
    setRunningScheduled(true);
    try {
      const res = await fetch(`${API}/api/finance/recurring/run-scheduled`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to run scheduled transactions');
      }
      
      const data = await res.json();
      if (data.created_count > 0) {
        toast.success(`Created ${data.created_count} transactions from recurring templates`);
      } else {
        toast.info('No recurring transactions due today');
      }
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRunningScheduled(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      amount: '',
      category_id: '',
      account_id: '',
      day_of_month: 1,
      description: '',
      paid_to: ''
    });
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      amount: template.amount.toString(),
      category_id: template.category_id,
      account_id: template.account_id,
      day_of_month: template.day_of_month,
      description: template.description || '',
      paid_to: template.paid_to || ''
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  const canManage = user && ['Admin', 'Founder', 'SeniorAccountant'].includes(user.role);

  return (
    <div className="p-6 space-y-6" data-testid="recurring-transactions-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-slate-700" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Recurring Transactions</h1>
            <p className="text-sm text-slate-500">Monthly recurring expense templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'Admin' && (
            <Button
              variant="outline"
              onClick={handleRunScheduled}
              disabled={runningScheduled}
              data-testid="run-scheduled-btn"
            >
              {runningScheduled ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Due Templates
            </Button>
          )}
          {canManage && (
            <Button onClick={() => setShowCreateModal(true)} data-testid="create-template-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          )}
        </div>
      </div>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Templates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No recurring templates. Create one to automate monthly expenses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-600">Name</th>
                    <th className="text-right p-3 font-medium text-slate-600">Amount</th>
                    <th className="text-left p-3 font-medium text-slate-600">Category</th>
                    <th className="text-left p-3 font-medium text-slate-600">Account</th>
                    <th className="text-center p-3 font-medium text-slate-600">Day</th>
                    <th className="text-center p-3 font-medium text-slate-600">Next Run</th>
                    <th className="text-center p-3 font-medium text-slate-600">Status</th>
                    <th className="text-center p-3 font-medium text-slate-600">Created</th>
                    {canManage && <th className="text-center p-3 font-medium text-slate-600">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {templates.map((template) => (
                    <tr key={template.template_id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-medium text-slate-700">{template.name}</div>
                        {template.paid_to && (
                          <div className="text-xs text-slate-400">To: {template.paid_to}</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {formatCurrency(template.amount)}
                      </td>
                      <td className="p-3 text-slate-600">
                        {template.category_name}
                      </td>
                      <td className="p-3 text-slate-600">
                        {template.account_name}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="outline">
                          {template.day_of_month}<sup>{getOrdinal(template.day_of_month)}</sup>
                        </Badge>
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        <div className="flex items-center gap-1 justify-center">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(template.next_run)}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {template.is_active ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600">
                            <Pause className="w-3 h-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-500 text-xs">
                        {template.total_entries_created} entries created
                      </td>
                      {canManage && (
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(template)}
                              data-testid={`edit-${template.template_id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleTemplate(template.template_id)}
                              disabled={toggling === template.template_id}
                              data-testid={`toggle-${template.template_id}`}
                            >
                              {toggling === template.template_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : template.is_active ? (
                                <Pause className="w-4 h-4 text-orange-500" />
                              ) : (
                                <Play className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b">
              <CardTitle>
                {editingTemplate ? 'Edit Recurring Template' : 'New Recurring Template'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., Office Rent, Internet Bill"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="form-name"
                />
              </div>
              
              <div>
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  data-testid="form-amount"
                />
              </div>
              
              <div>
                <Label>Category *</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => setForm({ ...form, category_id: v })}
                >
                  <SelectTrigger data-testid="form-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Account *</Label>
                <Select
                  value={form.account_id}
                  onValueChange={(v) => setForm({ ...form, account_id: v })}
                >
                  <SelectTrigger data-testid="form-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.account_id} value={acc.account_id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Day of Month (1-28)</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={form.day_of_month}
                  onChange={(e) => setForm({ ...form, day_of_month: e.target.value })}
                  data-testid="form-day"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Entry created on this day each month
                </p>
              </div>
              
              <div>
                <Label>Paid To</Label>
                <Input
                  placeholder="e.g., Landlord Name"
                  value={form.paid_to}
                  onChange={(e) => setForm({ ...form, paid_to: e.target.value })}
                  data-testid="form-paid-to"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  data-testid="form-description"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  data-testid="submit-template-btn"
                >
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
