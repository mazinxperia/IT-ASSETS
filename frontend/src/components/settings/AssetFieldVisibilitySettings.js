import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { settingsAPI } from '../../services/api';
import { toast } from 'sonner';

export function AssetFieldVisibilitySettings() {
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await settingsAPI.getAssetFieldVisibility();
      setAssetTypes(response.data);
    } catch (error) {
      toast.error('Failed to load asset field visibility settings');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (assetTypeIndex, fieldIndex) => {
    setAssetTypes(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const current = updated[assetTypeIndex].fields[fieldIndex].showInList;
      updated[assetTypeIndex].fields[fieldIndex].showInList = current === false ? true : false;
      return updated;
    });
  };

  const handleSaveAssetType = async (assetType) => {
    setSaving(true);
    try {
      await settingsAPI.updateAssetFieldVisibility(assetType.assetTypeId, assetType.fields);
      toast.success(`${assetType.assetTypeName} visibility updated`);
      await fetchData();
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
            <Package className="w-5 h-5" />
            Asset Field Visibility
          </CardTitle>
          <CardDescription>
            Choose which custom fields appear as columns in the Assets list page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assetTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No asset types found. Create asset types first.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {assetTypes.map((assetType, atIndex) => (
                <AccordionItem key={assetType.assetTypeId} value={assetType.assetTypeId}>
                  <AccordionTrigger className="text-base font-medium">
                    {assetType.assetTypeName}
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({assetType.fields?.length || 0} fields)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-4">

                      {/* Header */}
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-secondary/30 rounded-lg text-sm font-medium">
                        <div className="col-span-9">Field Name</div>
                        <div className="col-span-3 text-center">Show in List</div>
                      </div>

                      {/* Fields */}
                      {assetType.fields && assetType.fields.length > 0 ? (
                        assetType.fields.map((field, fieldIndex) => (
                          <div key={field.id} className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-secondary/20 transition-colors items-center">
                            <div className="col-span-9">
                              <Label className="cursor-pointer font-normal">{field.name}</Label>
                              <span className="ml-2 text-xs text-muted-foreground">({field.type})</span>
                            </div>
                            <div className="col-span-3 flex items-center justify-center">
                              <Checkbox
                                checked={field.showInList !== false}
                                onCheckedChange={() => handleFieldToggle(atIndex, fieldIndex)}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No custom fields for this asset type
                        </div>
                      )}

                      {/* Save */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => handleSaveAssetType(assetType)}
                          disabled={saving}
                          size="sm"
                        >
                          {saving ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Save className="w-4 h-4" />
                              Save {assetType.assetTypeName} Settings
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
