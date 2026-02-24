import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { assetsAPI, employeesAPI, transfersAPI } from '../../services/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ManualTransferDialog({ open, onOpenChange, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    assetId: '',
    fromType: 'employee',
    fromName: '',
    toType: 'employee',
    toName: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [assetsRes, employeesRes] = await Promise.all([
        assetsAPI.getAll(),
        employeesAPI.getAll()
      ]);
      setAssets(assetsRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.assetId || !formData.fromName || !formData.toName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await transfersAPI.addManualHistory(formData);
      toast.success('Manual transfer history added successfully');
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        assetId: '',
        fromType: 'employee',
        fromName: '',
        toType: 'employee',
        toName: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to add transfer history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Manual Transfer History</DialogTitle>
          <DialogDescription>
            Add a historical transfer record without changing current asset assignment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="asset">Asset *</Label>
            <Select
              value={formData.assetId}
              onValueChange={(value) => setFormData({ ...formData, assetId: value })}
            >
              <SelectTrigger id="asset">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.assetTag} - {asset.assetType?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-type">From Type *</Label>
              <Select
                value={formData.fromType}
                onValueChange={(value) => setFormData({ ...formData, fromType: value, fromName: '' })}
              >
                <SelectTrigger id="from-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-name">From *</Label>
              {formData.fromType === 'employee' ? (
                <Select
                  value={formData.fromName}
                  onValueChange={(value) => setFormData({ ...formData, fromName: value })}
                >
                  <SelectTrigger id="from-name">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.name}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="from-name"
                  placeholder={formData.fromType === 'inventory' ? 'Inventory' : 'Enter name'}
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="to-type">To Type *</Label>
              <Select
                value={formData.toType}
                onValueChange={(value) => setFormData({ ...formData, toType: value, toName: '' })}
              >
                <SelectTrigger id="to-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-name">To *</Label>
              {formData.toType === 'employee' ? (
                <Select
                  value={formData.toName}
                  onValueChange={(value) => setFormData({ ...formData, toName: value })}
                >
                  <SelectTrigger id="to-name">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.name}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="to-name"
                  placeholder={formData.toType === 'inventory' ? 'Inventory' : 'Enter name'}
                  value={formData.toName}
                  onChange={(e) => setFormData({ ...formData, toName: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this transfer..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add History
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
