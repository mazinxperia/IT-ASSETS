import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { settingsAPI } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

export function EmployeeFieldsSettings() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    fieldType: 'text',
    required: false,
    options: ''
  });

  useEffect(() => {
    fetchFields();
  }, []);

  async function fetchFields() {
    try {
      const response = await settingsAPI.getEmployeeFields();
      setFields(response.data);
    } catch (error) {
      // Use defaults if fetch fails
      setFields([
        { id: '1', name: 'Department', fieldType: 'text', required: false, isDefault: true },
        { id: '2', name: 'Position', fieldType: 'text', required: false, isDefault: true },
        { id: '3', name: 'Phone', fieldType: 'phone', required: false, isDefault: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    try {
      const fieldData = {
        name: fieldForm.name,
        fieldType: fieldForm.fieldType,
        required: fieldForm.required,
        options: fieldForm.fieldType === 'select' ? fieldForm.options.split(',').map(o => o.trim()) : null
      };

      let updatedFields;
      if (editingField) {
        updatedFields = fields.map(f => f.id === editingField.id ? { ...f, ...fieldData } : f);
      } else {
        updatedFields = [...fields, { ...fieldData, id: Date.now().toString() }];
      }

      await settingsAPI.updateEmployeeFields(updatedFields);
      setFields(updatedFields);
      toast.success(editingField ? 'Field updated' : 'Field created');
      closeDialog();
    } catch (error) {
      toast.error('Failed to save field');
    }
  };

  const handleDelete = async (fieldId) => {
    try {
      const updatedFields = fields.filter(f => f.id !== fieldId);
      await settingsAPI.updateEmployeeFields(updatedFields);
      setFields(updatedFields);
      toast.success('Field deleted');
    } catch (error) {
      toast.error('Failed to delete field');
    }
  };

  const openDialog = (field = null) => {
    if (field) {
      setFieldForm({
        name: field.name,
        fieldType: field.fieldType,
        required: field.required,
        options: field.options?.join(', ') || ''
      });
      setEditingField(field);
    } else {
      setFieldForm({ name: '', fieldType: 'text', required: false, options: '' });
      setEditingField(null);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingField(null);
    setFieldForm({ name: '', fieldType: 'text', required: false, options: '' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-semibold">Employee Fields</h2>
          <p className="text-sm text-muted-foreground">
            Customize the fields shown for employee records
          </p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-employee-field-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      <Card className="dark:border-border">
        <CardHeader>
          <CardTitle className="text-base">System Fields</CardTitle>
          <CardDescription>These fields are always present and cannot be removed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <span className="font-medium">Employee ID</span>
                <Badge variant="outline">text</Badge>
                <Badge>Required</Badge>
              </div>
              <span className="text-muted-foreground text-sm">System field</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <span className="font-medium">Name</span>
                <Badge variant="outline">text</Badge>
                <Badge>Required</Badge>
              </div>
              <span className="text-muted-foreground text-sm">System field</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:border-border">
        <CardHeader>
          <CardTitle className="text-base">Custom Fields</CardTitle>
          <CardDescription>Additional fields you've configured</CardDescription>
        </CardHeader>
        <CardContent>
          {fields.length > 0 ? (
            <div className="space-y-2">
              {fields.map(field => (
                <div 
                  key={field.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <span className="font-medium">{field.name}</span>
                    <Badge variant="outline">{field.fieldType}</Badge>
                    {field.required && <Badge>Required</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(field)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(field.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No custom fields configured. Click "Add Field" to create one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Field Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'New Field'}</DialogTitle>
            <DialogDescription>Configure the employee field</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="fieldName">Field Name</Label>
              <Input
                id="fieldName"
                value={fieldForm.name}
                onChange={(e) => setFieldForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Department, Position"
                className="mt-2"
                data-testid="employee-field-name-input"
              />
            </div>
            <div>
              <Label htmlFor="fieldType">Field Type</Label>
              <Select 
                value={fieldForm.fieldType} 
                onValueChange={(value) => setFieldForm(prev => ({ ...prev, fieldType: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fieldForm.fieldType === 'select' && (
              <div>
                <Label htmlFor="options">Options (comma-separated)</Label>
                <Input
                  id="options"
                  value={fieldForm.options}
                  onChange={(e) => setFieldForm(prev => ({ ...prev, options: e.target.value }))}
                  placeholder="Option 1, Option 2, Option 3"
                  className="mt-2"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="required">Required Field</Label>
              <Switch
                id="required"
                checked={fieldForm.required}
                onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, required: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={!fieldForm.name.trim()}>
              {editingField ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
