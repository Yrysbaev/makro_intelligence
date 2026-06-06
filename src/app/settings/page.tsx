'use client';

import { useState } from 'react';
import { Save, Database, Bell, Palette, User, Shield, RefreshCw } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col">
      <Header title="Settings" subtitle="Configure your Makro Intelligence platform" />
      <div className="p-6 space-y-6 max-w-3xl">

        {/* Company Profile */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Company Profile</CardTitle>
                <CardDescription>Basic company information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Name</label>
                <Input defaultValue="Makro Foods Distribution" className="text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Industry</label>
                <Input defaultValue="Wholesale Food Distribution" className="text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admin Email</label>
                <Input defaultValue="admin@makro.com" type="email" className="text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fiscal Year Start</label>
                <Input defaultValue="January" className="text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database / Supabase */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <Database className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Supabase Connection</CardTitle>
                <CardDescription>Configure your database connection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-700 font-medium">
                Using sample data — connect Supabase to load live data
              </p>
              <Badge variant="warning" className="text-xs">Demo Mode</Badge>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Supabase Project URL</label>
              <Input
                placeholder="https://your-project-id.supabase.co"
                className="text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Anon / Public Key</label>
              <Input
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="text-sm font-mono"
                type="password"
              />
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Test Connection
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Bell className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription>Alert preferences and thresholds</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Low inventory alerts', sub: 'Notify when stock falls below reorder point', enabled: true },
              { label: 'Customer churn risk', sub: 'Alert when customers exceed inactivity threshold', enabled: true },
              { label: 'Revenue milestones', sub: 'Celebrate when monthly targets are hit', enabled: false },
              { label: 'New AI insights', sub: 'Daily digest of new recommendations', enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.sub}</p>
                </div>
                <button
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${item.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
            <Separator />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Churn Threshold (days inactive)</label>
              <Input defaultValue="60" type="number" className="text-sm w-32" />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                <Shield className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-base">AI Insights Configuration</CardTitle>
                <CardDescription>Control how AI recommendations are generated</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Auto-generate insights daily', sub: 'Run analysis every morning at 6 AM', enabled: true },
              { label: 'Reorder opportunity detection', sub: 'Identify products that need restocking', enabled: true },
              { label: 'Customer growth/decline analysis', sub: 'Detect trends in customer purchasing', enabled: true },
              { label: 'Revenue risk alerts', sub: 'Warn when revenue trends show decline', enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.sub}</p>
                </div>
                <button
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${item.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} className="min-w-[120px]">
            {saved ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
