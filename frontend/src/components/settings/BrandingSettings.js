import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Upload, Loader2, X, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { settingsAPI, filesAPI } from '../../services/api';
import { toast } from 'sonner';

export function BrandingSettings() {
  const [form, setForm] = useState({
    appName: '',
    loginTitle: '',
    headerText: '',
    logoFileId: null,
    faviconFileId: null,
    loginBackgroundFileId: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({
    logo: false,
    favicon: false,
    loginBackground: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getBranding();
      if (response.data) {
        setForm({
          appName: response.data.appName || '',
          loginTitle: response.data.loginTitle || '',
          headerText: response.data.headerText || '',
          logoFileId: response.data.logoFileId || null,
          faviconFileId: response.data.faviconFileId || null,
          loginBackgroundFileId: response.data.loginBackgroundFileId || null
        });
      }
    } catch (error) {
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateBranding({
        appName: form.appName || null,
        loginTitle: form.loginTitle || null,
        headerText: form.headerText || null,
        logoFileId: form.logoFileId,
        faviconFileId: form.faviconFileId,
        loginBackgroundFileId: form.loginBackgroundFileId
      });
      toast.success('Branding settings saved successfully');
    } catch (error) {
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await filesAPI.upload(formData);
      const fileId = response.data.fileId;
      const fieldMap = {
        logo: 'logoFileId',
        favicon: 'faviconFileId',
        loginBackground: 'loginBackgroundFileId'
      };
      setForm(prev => ({ ...prev, [fieldMap[type]]: fileId }));
      toast.success('File uploaded — click Save Changes to apply');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleRemoveFile = (type) => {
    const fieldMap = {
      logo: 'logoFileId',
      favicon: 'faviconFileId',
      loginBackground: 'loginBackgroundFileId'
    };
    setForm(prev => ({ ...prev, [fieldMap[type]]: null }));
    toast.info('File removed — click Save Changes to apply');
  };

  const FileUploadBox = ({ type, label, description, fileId }) => {
    const isUploading = uploading[type];
    const hasFile = Boolean(fileId);

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>

        {hasFile ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/30">
            <div className="w-16 h-16 rounded-lg overflow-hidden border bg-background flex items-center justify-center">
              <img
                src={filesAPI.getUrl(fileId)}
                alt={label}
                className="w-full h-full object-contain"
                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">File uploaded</p>
              <p className="text-xs text-muted-foreground truncate">{fileId}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveFile(type)}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => document.getElementById('upload-' + type).click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </div>
            )}
          </div>
        )}

        <input
          id={'upload-' + type}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { handleFileUpload(type, e.target.files?.[0]); e.target.value = ''; }}
          disabled={isUploading}
        />
      </div>
    );
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
            <Building2 className="w-5 h-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Customize the application branding and appearance. Changes apply to all users instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="space-y-4">
            <div>
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={form.appName}
                onChange={(e) => setForm(prev => ({ ...prev, appName: e.target.value }))}
                placeholder="e.g. AssetFlow"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Shown in browser tab and sidebar</p>
            </div>

            <div>
              <Label htmlFor="loginTitle">Login Page Title</Label>
              <Input
                id="loginTitle"
                value={form.loginTitle}
                onChange={(e) => setForm(prev => ({ ...prev, loginTitle: e.target.value }))}
                placeholder="e.g. Welcome to AssetFlow"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Shown as the heading on the login page</p>
            </div>

            <div>
              <Label htmlFor="headerText">Header Text</Label>
              <Input
                id="headerText"
                value={form.headerText}
                onChange={(e) => setForm(prev => ({ ...prev, headerText: e.target.value }))}
                placeholder="e.g. AssetFlow"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Shown in the top left header bar</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-6">
            <h4 className="font-medium flex items-center gap-2">
              <Image className="w-4 h-4" />
              Brand Assets
            </h4>

            <FileUploadBox
              type="logo"
              label="Logo"
              description="Recommended: 128x128px PNG with transparent background"
              fileId={form.logoFileId}
            />

            <FileUploadBox
              type="favicon"
              label="Favicon"
              description="Recommended: 32x32px PNG or ICO"
              fileId={form.faviconFileId}
            />

            <FileUploadBox
              type="loginBackground"
              label="Login Background"
              description="Recommended: 1920x1080px high-resolution image"
              fileId={form.loginBackgroundFileId}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleSave}
              disabled={saving || Object.values(uploading).some(v => v)}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
