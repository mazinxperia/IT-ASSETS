import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function PageHeader({ 
  title, 
  description, 
  actions, 
  className 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8", className)}
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight" data-testid="page-title">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1" data-testid="page-description">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3" data-testid="page-actions">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
