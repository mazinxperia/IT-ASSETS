import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TransferStepper({ steps, currentStep, onStepClick }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step circle + label */}
            <div className="flex flex-col items-center flex-shrink-0">
              <button
                onClick={() => onStepClick && isCompleted && onStepClick(index)}
                disabled={!isCompleted}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 border-2",
                  isCompleted && "bg-primary border-primary text-primary-foreground cursor-pointer hover:opacity-90",
                  isActive && "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110",
                  !isCompleted && !isActive && "bg-muted border-border text-muted-foreground cursor-default"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </button>
              <span className={cn(
                "mt-2 text-xs font-medium whitespace-nowrap",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connector line between steps */}
            {!isLast && (
              <div className="flex-1 mx-2 mb-5">
                <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
