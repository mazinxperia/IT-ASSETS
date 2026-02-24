import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { settingsAPI } from '../../services/api';
import { toast } from 'sonner';

export function EmployeeFieldVisibilitySettings() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await settingsAPI.getEmployeeFieldVisibility();
      setFields(response.data.fields || []);
    } catch (error) {
      toast.error('Failed to load employee field visibility settings');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (fieldIndex, property) => {
    setFields(prev => {
      const updated = JSON.parse(JSON.stringify(prev)); // Deep clone
      if (!updated[fieldIndex].hasOwnProperty(property)) {
        updated[fieldIndex][property] = true;
      }
      updated[fieldIndex][property] = !updated[fieldIndex][property];
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateEmployeeFieldVisibility(fields);
      toast.success('Employee field visibility updated');
    } catch (error) {
      toast.error('Failed to update field visibility');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employee Field Visibility
          </CardTitle>
          <CardDescription>
            Control which employee fields are visible in list, detail, and form views
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-secondary/30 rounded-lg text-sm font-medium">
            <div className="col-span-6">Field Name</div>
            <div className="col-span-2 text-center">List View</div>
            <div className="col-span-2 text-center">Detail View</div>
            <div className="col-span-2 text-center">Form View</div>
          </div>

          {/* Fields */}
          {fields.length > 0 ? (
            <div className="space-y-2">
              {fields.map((field, fieldIndex) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-secondary/20 transition-colors">
                  <div className="col-span-6 flex items-center">
                    <Label className="cursor-pointer font-normal">{field.name}</Label>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <Checkbox
                      checked={field.showInList !== false}
                      onCheckedChange={() => handleFieldToggle(fieldIndex, 'showInList')}
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <Checkbox
                      checked={field.showInDetail !== false}
                      onCheckedChange={() => handleFieldToggle(fieldIndex, 'showInDetail')}
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <Checkbox
                      checked={field.showInForm !== false}
                      onCheckedChange={() => handleFieldToggle(fieldIndex, 'showInForm')}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No employee fields defined. Add fields in Employee Fields settings.
            </div>
          )}

          {/* Save Button */}
          {fields.length > 0 && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
