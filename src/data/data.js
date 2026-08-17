// ============================================================
// JetFlow — Client-side constants
//
// Everything that used to be mock seed data (clients, tickets, plans,
// modules, module checklist templates, offers, stages) now lives in
// Supabase, scoped per account — see src/lib/supabaseSync.js. What's left
// here is genuinely static: a display-only fallback profile shape.
// ============================================================

export const initialProfile = {
  name: 'Gabriel Almeida',
  role: 'Especialista de Implantação',
  avatarInitials: 'GA',
  alertDiasAtencao: 15,
  alertDiasRisco: 30,
};
