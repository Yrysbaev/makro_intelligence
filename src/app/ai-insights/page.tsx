'use client';

import { useState } from 'react';
import {
  Lightbulb, TrendingUp, AlertTriangle, AlertCircle,
  ChevronRight, CheckCircle, RefreshCw, Filter,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sampleAiInsights } from '@/lib/sample-data';
import { formatDate } from '@/lib/utils';
import type { AiInsight } from '@/types';

const typeConfig = {
  opportunity: {
    icon: TrendingUp,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    badgeVariant: 'success' as const,
    label: 'Opportunity',
    border: 'border-green-200',
    bg: 'bg-green-50/50',
  },
  risk: {
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    badgeVariant: 'danger' as const,
    label: 'Risk',
    border: 'border-red-200',
    bg: 'bg-red-50/50',
  },
  recommendation: {
    icon: Lightbulb,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    badgeVariant: 'info' as const,
    label: 'Recommendation',
    border: 'border-blue-200',
    bg: 'bg-blue-50/50',
  },
  alert: {
    icon: AlertCircle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    badgeVariant: 'warning' as const,
    label: 'Alert',
    border: 'border-amber-200',
    bg: 'bg-amber-50/50',
  },
};

const priorityConfig = {
  high: { variant: 'danger' as const, label: 'High Priority' },
  medium: { variant: 'warning' as const, label: 'Medium' },
  low: { variant: 'secondary' as const, label: 'Low' },
};

export default function AiInsightsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showRead, setShowRead] = useState(true);
  const [readInsights, setReadInsights] = useState<Set<string>>(
    new Set(sampleAiInsights.filter((i) => i.is_read).map((i) => i.id))
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const filtered = sampleAiInsights.filter((insight) => {
    const matchesType = typeFilter === 'all' || insight.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || insight.priority === priorityFilter;
    const matchesRead = showRead || !readInsights.has(insight.id);
    return matchesType && matchesPriority && matchesRead;
  });

  const unreadCount = sampleAiInsights.filter((i) => !readInsights.has(i.id)).length;

  const markAsRead = (id: string) => {
    setReadInsights((prev) => new Set([...prev, id]));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const typeCounts = {
    opportunity: sampleAiInsights.filter((i) => i.type === 'opportunity').length,
    risk: sampleAiInsights.filter((i) => i.type === 'risk').length,
    recommendation: sampleAiInsights.filter((i) => i.type === 'recommendation').length,
    alert: sampleAiInsights.filter((i) => i.type === 'alert').length,
  };

  return (
    <div className="flex flex-col">
      <Header title="AI Insights" subtitle="Automated business recommendations powered by AI" />
      <div className="p-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Object.entries(typeConfig).map(([key, conf]) => {
            const Icon = conf.icon;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
                className={`rounded-xl border p-5 text-left shadow-sm transition-all hover:shadow-md ${typeFilter === key ? 'ring-2 ring-blue-400' : 'bg-white border-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${conf.iconBg}`}>
                    <Icon className={`h-4.5 w-4.5 ${conf.iconColor}`} size={18} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{typeCounts[key as keyof typeof typeCounts]}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{conf.label}s</p>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={unreadCount > 0 ? 'danger' : 'success'} className="text-xs px-2 py-1">
              {unreadCount} unread
            </Badge>
            <span className="text-sm text-gray-500">{filtered.length} insights shown</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-36 text-sm">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRead(!showRead)}
              className="text-xs"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {showRead ? 'Hide Read' : 'Show All'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate New Insights'}
            </Button>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="space-y-4">
          {filtered.map((insight) => {
            const tConf = typeConfig[insight.type];
            const pConf = priorityConfig[insight.priority];
            const Icon = tConf.icon;
            const isRead = readInsights.has(insight.id);

            return (
              <Card
                key={insight.id}
                className={`transition-all hover:shadow-md ${isRead ? 'opacity-70' : ''} border ${tConf.border}`}
              >
                <CardContent className={`p-5 ${tConf.bg}`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tConf.iconBg}`}>
                      <Icon className={`h-5 w-5 ${tConf.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-gray-900">{insight.title}</h3>
                        <Badge variant={tConf.badgeVariant} className="text-[10px]">{tConf.label}</Badge>
                        <Badge variant={pConf.variant} className="text-[10px]">{pConf.label}</Badge>
                        {!isRead && (
                          <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>

                      {insight.action && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/70 border border-white/50 px-3 py-2">
                          <ChevronRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-blue-700">{insight.action}</p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {insight.related_entity_name && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="font-medium text-gray-700">{insight.related_entity_name}</span>
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{formatDate(insight.created_at)}</span>
                        </div>
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(insight.id)}
                            className="h-7 text-xs text-gray-500 hover:text-gray-700"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mb-3" />
              <p className="text-base font-semibold text-gray-600">All caught up!</p>
              <p className="text-sm text-gray-400">No insights match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
