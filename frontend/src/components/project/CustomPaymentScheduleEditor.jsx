import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export const CustomPaymentScheduleEditor = ({ schedule, projectValue, canEdit, onSave }) => {
  const [localSchedule, setLocalSchedule] = useState(schedule || []);
  const [saving, setSaving] = useState(false);

  // Sync local state when schedule prop changes
  const scheduleJson = JSON.stringify(schedule);
  useEffect(() => {
    const parsed = schedule || [];
    if (JSON.stringify(localSchedule) !== JSON.stringify(parsed)) {
      setLocalSchedule(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleJson]);

  const addStage = () => {
    setLocalSchedule([...localSchedule, {
      stage: `Stage ${localSchedule.length + 1}`,
      type: 'percentage',
      percentage: 0,
      fixedAmount: 0
    }]);
  };

  const removeStage = (index) => {
    setLocalSchedule(localSchedule.filter((_, i) => i !== index));
  };

  const updateStage = (index, field, value) => {
    const updated = [...localSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSchedule(updated);
  };

  const calculateAmounts = () => {
    let totalFixedAndPercentage = 0;
    const amounts = localSchedule.map(item => {
      if (item.type === 'fixed') {
        totalFixedAndPercentage += item.fixedAmount || 0;
        return item.fixedAmount || 0;
      } else if (item.type === 'percentage') {
        const amt = (projectValue * (item.percentage || 0)) / 100;
        totalFixedAndPercentage += amt;
        return amt;
      }
      return 0;
    });
    
    // Calculate remaining
    const remainingIndex = localSchedule.findIndex(item => item.type === 'remaining');
    if (remainingIndex >= 0) {
      amounts[remainingIndex] = Math.max(0, projectValue - totalFixedAndPercentage);
    }
    
    return amounts;
  };

  const getTotalPercentage = () => {
    return localSchedule
      .filter(item => item.type === 'percentage')
      .reduce((sum, item) => sum + (item.percentage || 0), 0);
  };

  const hasMultipleRemaining = () => {
    return localSchedule.filter(item => item.type === 'remaining').length > 1;
  };

  const handleSave = async () => {
    if (hasMultipleRemaining()) {
      toast.error('Only one "remaining" stage is allowed');
      return;
    }
    if (getTotalPercentage() > 100) {
      toast.error('Total percentage cannot exceed 100%');
      return;
    }
    
    setSaving(true);
    await onSave(localSchedule);
    setSaving(false);
  };

  const amounts = calculateAmounts();
  const totalPercentage = getTotalPercentage();

  if (!canEdit && (!localSchedule || localSchedule.length === 0)) {
    return (
      <div className="text-center py-6 text-slate-500">
        <p>No custom schedule defined</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {localSchedule.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <p className="mb-3">No custom stages defined</p>
          {canEdit && (
            <Button onClick={addStage} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add First Stage
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {localSchedule.map((item, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Stage Name */}
                  <div className="col-span-3">
                    {canEdit ? (
                      <Input
                        value={item.stage || ''}
                        onChange={(e) => updateStage(index, 'stage', e.target.value)}
                        placeholder="Stage name"
                        className="h-9"
                      />
                    ) : (
                      <span className="font-medium text-slate-700">{item.stage}</span>
                    )}
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    {canEdit ? (
                      <Select
                        value={item.type}
                        onValueChange={(value) => updateStage(index, 'type', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="remaining">Remaining</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                    )}
                  </div>

                  {/* Value */}
                  <div className="col-span-3">
                    {item.type === 'fixed' && (
                      canEdit ? (
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-1">₹</span>
                          <Input
                            type="number"
                            value={item.fixedAmount || ''}
                            onChange={(e) => updateStage(index, 'fixedAmount', parseFloat(e.target.value) || 0)}
                            placeholder="Amount"
                            className="h-9"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-600">₹{item.fixedAmount?.toLocaleString('en-IN')}</span>
                      )
                    )}
                    {item.type === 'percentage' && (
                      canEdit ? (
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.percentage || ''}
                            onChange={(e) => updateStage(index, 'percentage', parseFloat(e.target.value) || 0)}
                            placeholder="%"
                            className="h-9"
                          />
                          <span className="text-slate-500 ml-1">%</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">{item.percentage}%</span>
                      )
                    )}
                    {item.type === 'remaining' && (
                      <span className="text-slate-500 italic">Auto-calculated</span>
                    )}
                  </div>

                  {/* Calculated Amount */}
                  <div className="col-span-3">
                    <span className="text-lg font-bold text-emerald-600">
                      ₹{amounts[index]?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>

                  {/* Delete */}
                  <div className="col-span-1 text-right">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStage(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Messages */}
          {totalPercentage > 100 && (
            <p className="text-sm text-red-600">
              ⚠️ Total percentage ({totalPercentage}%) exceeds 100%
            </p>
          )}
          {hasMultipleRemaining() && (
            <p className="text-sm text-red-600">
              ⚠️ Only one &quot;remaining&quot; stage is allowed
            </p>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex items-center justify-between pt-2">
              <Button onClick={addStage} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Stage
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm"
                disabled={saving || totalPercentage > 100 || hasMultipleRemaining()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
