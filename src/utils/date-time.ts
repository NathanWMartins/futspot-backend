export function normalizeHHMM(time: string) {
  return time.slice(0, 5);
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function buildHourlySlots(inicio: string, fim: string) {
  const start = toMinutes(normalizeHHMM(inicio));
  const end = toMinutes(normalizeHHMM(fim));

  const slots: string[] = [];
  for (let t = start; t + 60 <= end; t += 60) {
    slots.push(fromMinutes(t));
  }
  return slots;
}

export function filterByPeriodos(slots: string[], periodosCsv?: string) {
  if (!periodosCsv) return slots;

  const periodos = periodosCsv
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!periodos.length) return slots;

  const ranges: Record<string, { start: number; end: number }> = {
    manha: { start: 6 * 60, end: 12 * 60 },
    tarde: { start: 12 * 60, end: 18 * 60 },
    noite: { start: 18 * 60, end: 24 * 60 },
    madrugada: { start: 0, end: 6 * 60 },
  };

  const allowed = periodos.map((p) => ranges[p]).filter(Boolean);

  if (!allowed.length) return slots;

  return slots.filter((s) => {
    const min = toMinutes(s);
    return allowed.some((r) => min >= r.start && min < r.end);
  });
}

export function hojeYYYYMMDDLocal(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function minutosAgoraLocal(): number {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

export function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
