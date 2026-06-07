export const PERSONAS = {
  coach: {
    email: 'test-coach@6way.test',
    role: 'coach' as const,
  },
  athlete: {
    email: 'test-athlete@6way.test',
    role: 'athlete' as const,
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;
