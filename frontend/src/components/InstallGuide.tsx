import React from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface InstallGuideProps {
  onClose: () => void;
}

export function InstallGuide({ onClose }: InstallGuideProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
            Install App
          </h2>

          <p className="mt-2 text-sm text-muted">
            Add Gym Tracker to your home screen for the best experience.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-4">
            <span className="font-black text-accent">1.</span>

            <p className="text-sm text-muted">
              Tap <strong className="text-foreground">Share</strong> on iOS
              or <strong className="text-foreground">Menu</strong> on
              Android.
            </p>
          </div>

          <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-4">
            <span className="font-black text-accent">2.</span>

            <p className="text-sm text-muted">
              Select{' '}
              <strong className="text-foreground">
                "Add to Home Screen"
              </strong>
              .
            </p>
          </div>
        </div>

        <Button onClick={onClose} className="mt-6">
          Got it
        </Button>
      </Card>
    </div>
  );
}