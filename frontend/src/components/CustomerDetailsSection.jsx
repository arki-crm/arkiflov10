import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Tag,
  Edit2,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../lib/utils';

const LEAD_SOURCES = ['Meta', 'Walk-in', 'Referral', 'Others'];

const SOURCE_COLORS = {
  'Meta': 'bg-blue-100 text-blue-700',
  'Walk-in': 'bg-green-100 text-green-700',
  'Referral': 'bg-orange-100 text-orange-700',
  'Others': 'bg-slate-100 text-slate-700'
};

/**
 * CustomerDetailsSection - Reusable component for displaying/editing customer info
 * Used in: PreSales Detail, Lead Detail, Project Detail
 * 
 * Props:
 * - data: { customer_name, customer_phone, customer_email, customer_address, customer_requirements, source/lead_source, budget, pid }
 * - canEdit: boolean - whether user can edit
 * - onSave: async (updatedData) => void - called when saving changes
 * - isProject: boolean - whether this is project context (uses client_* fields)
 * - loading: boolean - show loading state
 * - defaultCollapsed: boolean - start collapsed (default: true)
 */
const CustomerDetailsSection = ({ 
  data, 
  canEdit = false, 
  onSave,
  isProject = false,
  loading = false,
  defaultCollapsed = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Normalize field names between lead (customer_*) and project (client_*)
  const customerName = isProject ? data?.client_name : data?.customer_name;
  const customerPhone = isProject ? data?.client_phone : data?.customer_phone;
  const customerEmail = isProject ? data?.client_email : data?.customer_email;
  const customerAddress = isProject ? data?.client_address : data?.customer_address;
  const customerRequirements = isProject ? data?.client_requirements : data?.customer_requirements;
  const source = isProject ? data?.lead_source : data?.source;
  const budget = data?.budget;
  const pid = data?.pid;

  const startEditing = () => {
    setEditData({
      [isProject ? 'client_name' : 'customer_name']: customerName || '',
      [isProject ? 'client_phone' : 'customer_phone']: customerPhone || '',
      [isProject ? 'client_email' : 'customer_email']: customerEmail || '',
      [isProject ? 'client_address' : 'customer_address']: customerAddress || '',
      [isProject ? 'client_requirements' : 'customer_requirements']: customerRequirements || '',
      [isProject ? 'lead_source' : 'source']: source || 'Others',
      budget: budget || ''
    });
    setIsEditing(true);
    setIsCollapsed(false); // Expand when editing
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(editData);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Left side - Title and collapsed summary */}
          <button
            onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}
            className={cn(
              "flex items-center gap-3 text-left",
              !isEditing && "cursor-pointer hover:opacity-80"
            )}
            disabled={isEditing}
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Customer Details</CardTitle>
              {!isEditing && (
                isCollapsed ? 
                  <ChevronDown className="w-4 h-4 text-slate-400" /> : 
                  <ChevronUp className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>
          
          {/* Right side - Summary when collapsed + Edit button */}
          <div className="flex items-center gap-3">
            {/* Collapsed Summary: Name + PID */}
            {isCollapsed && !isEditing && (
              <div className="flex items-center gap-2 text-sm">
                {pid && (
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {pid}
                  </span>
                )}
                <span className="text-slate-600 font-medium">{customerName || 'N/A'}</span>
              </div>
            )}
            
            {canEdit && !isEditing && (
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Collapsible Content */}
      {(!isCollapsed || isEditing) && (
        <CardContent className="space-y-4">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Customer Name *</label>
                  <Input
                    value={editData[isProject ? 'client_name' : 'customer_name']}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      [isProject ? 'client_name' : 'customer_name']: e.target.value
                    }))}
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number *</label>
                  <Input
                    value={editData[isProject ? 'client_phone' : 'customer_phone']}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      [isProject ? 'client_phone' : 'customer_phone']: e.target.value
                    }))}
                    placeholder="Enter phone"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <Input
                    type="email"
                    value={editData[isProject ? 'client_email' : 'customer_email']}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      [isProject ? 'client_email' : 'customer_email']: e.target.value
                    }))}
                    placeholder="Enter email"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Budget</label>
                  <Input
                    type="number"
                    value={editData.budget}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      budget: e.target.value ? parseFloat(e.target.value) : ''
                    }))}
                    placeholder="Enter budget"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Lead Source</label>
                  <Select
                    value={editData[isProject ? 'lead_source' : 'source']}
                    onValueChange={(value) => setEditData(prev => ({
                      ...prev,
                      [isProject ? 'lead_source' : 'source']: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map(src => (
                        <SelectItem key={src} value={src}>{src}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <Input
                  value={editData[isProject ? 'client_address' : 'customer_address']}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    [isProject ? 'client_address' : 'customer_address']: e.target.value
                  }))}
                  placeholder="Enter full address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Requirements / Brief</label>
                <Textarea
                  value={editData[isProject ? 'client_requirements' : 'customer_requirements']}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    [isProject ? 'client_requirements' : 'customer_requirements']: e.target.value
                  }))}
                  placeholder="Enter customer requirements or project brief"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-4">
              {/* PID Badge - Prominent display */}
              {pid && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Project ID</span>
                  <span className="font-mono font-bold text-lg text-slate-900">{pid}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Name</p>
                    <p className="text-sm font-medium text-slate-800">{customerName || '—'}</p>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Phone</p>
                    <p className="text-sm font-medium text-slate-800">{customerPhone || '—'}</p>
                  </div>
                </div>
                
                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Email</p>
                    <p className="text-sm font-medium text-slate-800">{customerEmail || '—'}</p>
                  </div>
                </div>
                
                {/* Budget */}
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Budget</p>
                    <p className="text-sm font-medium text-slate-800">{formatCurrency(budget)}</p>
                  </div>
                </div>
                
                {/* Source */}
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Lead Source</p>
                    {source ? (
                      <Badge className={cn("text-xs mt-0.5", SOURCE_COLORS[source] || SOURCE_COLORS['Others'])}>
                        {source}
                      </Badge>
                    ) : (
                      <p className="text-sm text-slate-500">—</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Address - Full width */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase">Address</p>
                  <p className="text-sm text-slate-800">{customerAddress || '—'}</p>
                </div>
              </div>
              
              {/* Requirements - Full width */}
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase">Requirements / Brief</p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{customerRequirements || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CustomerDetailsSection;
