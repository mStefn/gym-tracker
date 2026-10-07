// frontend/src/constants/theme.ts

export const theme = {
  // 1. Tło i Layout
  bg: {
    main: 'bg-zinc-950 text-zinc-100 min-h-screen',
    card: 'bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl',
    sidebar: 'bg-zinc-900 border-r border-zinc-800 flex flex-col',
    navItem: 'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
  },

  // 2. Typografia i Akcenty
  text: {
    primary: 'text-zinc-100',
    secondary: 'text-zinc-400',
    accent: 'text-[#ccff00]', // Cyber Lime
    error: 'text-red-500',
    heading: 'text-2xl font-bold tracking-tight',
  },

  // 3. Przyciski
  button: {
    // Główny przycisk akcji (np. Zapisz, Rozpocznij trening, Zaloguj)
    primary: 'w-full bg-[#ccff00] text-zinc-950 font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:bg-[#b3e600] hover:shadow-[0_0_15px_rgba(204,255,0,0.4)] active:scale-95 flex items-center justify-center gap-2',
    
    // Przycisk poboczny (np. Anuluj, Wróć)
    secondary: 'w-full bg-zinc-800 text-zinc-100 font-bold py-3 px-4 rounded-xl border border-zinc-700 transition-all duration-300 hover:bg-zinc-700 hover:border-zinc-600 active:scale-95 flex items-center justify-center gap-2',
    
    // Ghost button (np. Wyloguj, małe linki)
    ghost: 'text-zinc-400 hover:text-[#ccff00] transition-colors duration-300',
    
    // Przycisk destrukcyjny (np. Usuń trening)
    danger: 'w-full bg-red-500/10 text-red-500 font-bold py-3 px-4 rounded-xl border border-red-500/20 transition-all duration-300 hover:bg-red-500/20 active:scale-95',
  },

  // 4. Inputy i Formularze
  input: {
    wrapper: 'flex flex-col gap-1.5',
    label: 'text-sm font-medium text-zinc-400 ml-1',
    field: 'w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00] transition-all duration-300 placeholder:text-zinc-600',
    fieldError: 'w-full bg-zinc-950 border border-red-500/50 text-zinc-100 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-300',
  },

  // 5. Efekty wizualne (Glow, cienie, separatory)
  fx: {
    glowLime: 'shadow-[0_0_20px_rgba(204,255,0,0.15)]',
    glowLimeHover: 'hover:shadow-[0_0_25px_rgba(204,255,0,0.3)]',
    divider: 'h-px w-full bg-zinc-800 my-4',
  }
} as const;