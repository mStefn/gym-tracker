import React from 'react';
// Możemy później dodać tu osobny plik CSS Module, na razie zostawiamy Twoje klasy

interface InstallGuideProps {
  onClose: () => void;
}

export function InstallGuide({ onClose }: InstallGuideProps) {
  return (
    <div id="install-guide-overlay" style={{ display: 'flex' }}>
      <div className="install-card">
        <h2 className="install-title">Install App</h2>
        <p className="install-subtitle">Add Gym Tracker to your home screen for the best experience.</p>
        
        <div className="install-step">
          <span className="step-num">1.</span> Tap <b>Share</b> <span className="icon">⍗</span> (iOS) or <b>Menu</b> <span className="icon">⋮</span> (Android).
        </div>
        <div className="install-step">
          <span className="step-num">2.</span> Select <br /><b>"Add to Home Screen"</b> ➕.
        </div>
        
        <button onClick={onClose} className="btn-modal-close">Got it</button>
      </div>
    </div>
  );
}