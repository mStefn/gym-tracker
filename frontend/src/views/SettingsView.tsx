import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function SettingsView() {
  const { currentUserName, logout } = useAuthStore();

  return (
    <div className="relative z-10 space-y-6 sm:space-y-8">
      <section>
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Your <span className="text-[#ccff00]">Settings</span>
        </h1>
        <p className="text-sm font-medium tracking-wide text-zinc-400">
          Customize your profile, application preferences and account.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-5 sm:space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 border-b border-zinc-800/60 pb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
              User Profile
            </h2>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-2xl font-black text-[#ccff00]">
                {currentUserName?.charAt(0).toUpperCase() || 'U'}
              </div>

              <div>
                <div className="text-xl font-bold text-white">
                  {currentUserName}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  Active account
                </div>
              </div>
            </div>

            <form className="space-y-4">
              <Input
                id="display-name"
                label="Display Name"
                type="text"
                defaultValue={currentUserName || ''}
              />

              <Input
                id="new-pin"
                label="New PIN (Optional)"
                type="password"
                placeholder="••••"
              />

              <Button type="button" className="mt-2">
                Save Changes
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 border-b border-zinc-800/60 pb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
              App Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">
                    App Theme
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Dark mode is enabled
                  </div>
                </div>

                <div className="relative h-6 w-12 cursor-not-allowed rounded-full bg-[#ccff00] opacity-80">
                  <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-zinc-950" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">
                    Weight Units
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Kilograms (kg)
                  </div>
                </div>

                <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
                  <button
                    type="button"
                    className="rounded-md bg-[#ccff00] px-3 py-1 text-xs font-bold text-zinc-950"
                  >
                    KG
                  </button>

                  <button
                    type="button"
                    className="rounded-md px-3 py-1 text-xs font-bold text-zinc-500 transition-colors hover:text-white"
                  >
                    LBS
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5 p-5 sm:p-6">
            <h2 className="mb-5 border-b border-red-500/20 pb-3 text-xs font-bold uppercase tracking-widest text-red-500">
              Danger Zone
            </h2>

            <div className="space-y-3">
              <p className="mb-4 text-sm text-zinc-400">
                Signing out will remove your session token. Deleting your
                account is permanent and will remove all your workouts.
              </p>

              <Button variant="secondary" onClick={logout}>
                Sign Out
              </Button>

              <Button variant="danger">
                Delete Account & Data
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}