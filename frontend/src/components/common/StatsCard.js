import React from 'react';
import { motion } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

// previewData is now passed from parent (DashboardPage) - preloaded on mount
export function StatsCard({ title, value, icon: Icon, delay = 0, trend, hoverType, previewData }) {

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hoverType ? { scale: 1.02, y: -5 } : undefined}
      className="w-full"
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200",
        hoverType && "cursor-pointer"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                {trend && (
                  <span className={cn(
                    "text-xs font-medium",
                    trend > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
        
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      </Card>
    </motion.div>
  );

  if (!hoverType || !previewData) {
    return cardContent;
  }

  const items = previewData?.items || [];

  return (
    <HoverCard openDelay={500}>
      <HoverCardTrigger asChild>
        {cardContent}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="bottom" align="start">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{title}</h4>
          {items.length > 0 ? (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="text-sm p-2 rounded hover:bg-accent transition-colors"
                >
                  {item.name && <div className="font-medium">{item.name}</div>}
                  {item.assetTag && <div className="font-medium">{item.assetTag}</div>}
                  {item.type && <div className="text-xs text-muted-foreground">{item.type}</div>}
                  {item.assignedTo && (
                    <div className="text-xs text-muted-foreground">
                      Assigned to: {item.assignedTo}
                    </div>
                  )}
                  {item.count !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      {item.count} assets
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items to preview</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
