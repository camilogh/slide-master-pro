import { useApp } from '@/context/AppContext';
import { Step1 } from '@/components/steps/Step1';
import { Step2 } from '@/components/steps/Step2';
import { Step3 } from '@/components/steps/Step3';
import { Step4 } from '@/components/steps/Step4';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Dimensiones & Fondo' },
  { number: 2, label: 'Datos Excel' },
  { number: 3, label: 'Diseño' },
  { number: 4, label: 'Generar PPTX' },
];

export const Wizard = () => {
  const { currentStep, setCurrentStep } = useApp();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">PP</span>
          </div>
          <h1 className="font-semibold text-foreground">PowerPoint Generator</h1>
        </div>
      </header>

      {/* Progress bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center gap-0">
            {STEPS.map((step, idx) => {
              const done = currentStep > step.number;
              const active = currentStep === step.number;
              return (
                <div key={step.number} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => done && setCurrentStep(step.number)}
                    disabled={!done && !active}
                    className={cn(
                      'flex items-center gap-2 text-sm font-medium shrink-0 transition-colors',
                      active && 'text-primary',
                      done && 'text-primary cursor-pointer',
                      !done && !active && 'text-muted-foreground cursor-default'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                      active && 'bg-primary text-primary-foreground border-primary',
                      done && 'bg-primary text-primary-foreground border-primary',
                      !done && !active && 'bg-background text-muted-foreground border-muted'
                    )}>
                      {done ? <Check className="w-3.5 h-3.5" /> : step.number}
                    </div>
                    <span className="hidden sm:block">{step.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      'h-0.5 flex-1 mx-3 transition-colors',
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {currentStep === 1 && <Step1 />}
        {currentStep === 2 && <Step2 />}
        {currentStep === 3 && <Step3 />}
        {currentStep === 4 && <Step4 />}
      </main>
    </div>
  );
};
