export type GreetingStyle = 'friendly' | 'formal';

// Shared by the Greet step and its Studio page, so the preview matches what automations produce.
export function greet(name: string, style: GreetingStyle = 'friendly'): string {
  const who = name.trim() || 'there';
  return style === 'formal' ? `Good day, ${who}.` : `Hello, ${who}!`;
}
