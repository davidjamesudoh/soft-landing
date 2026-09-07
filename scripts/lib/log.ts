function timestamp(): string {
  return new Date().toTimeString().slice(0, 8);
}

function line(level: string, phase: string, message: string): string {
  return `[${timestamp()}] [${phase}] ${level}${message}`;
}

export function log(phase: string, message: string): void {
  console.log(line("", phase, message));
}

export function warn(phase: string, message: string): void {
  console.warn(line("⚠️  ", phase, message));
}

export function error(phase: string, message: string): void {
  console.error(line("❌ ", phase, message));
}
