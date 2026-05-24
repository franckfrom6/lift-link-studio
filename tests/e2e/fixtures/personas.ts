export const PERSONAS = {
  coach: {
    email: 'test-coach@f6gym.test',
    role: 'coach' as const,
  },
  athlete: {
    email: 'test-athlete@f6gym.test',
    role: 'athlete' as const,
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;
