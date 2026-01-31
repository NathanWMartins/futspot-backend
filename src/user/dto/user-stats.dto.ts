export type JogadorStatsResponse = {
  createdAt: string;
  totalReservas: number;
  locaisDiferentes: number;
  comportamento:
    | 'Nunca cancelou'
    | 'Raramente cancela'
    | 'Às vezes cancela'
    | 'Cancela com frequência';
  mediaAvaliacoes: number | null;
  totalAvaliacoes: number | null;
  taxaCancelamento: number;
};

export type LocadorStatsResponse = {
  totalQuadras: number;
  totalReservas: number;
  totalFaturamento: number;
  createdAt: string;
  locaisCadastrados: number;
  comportamento:
    | 'Nunca cancelou'
    | 'Raramente cancela'
    | 'Às vezes cancela'
    | 'Cancela com frequência';
  mediaAvaliacoes: number | null;
  totalAvaliacoes: number | null;
  taxaCancelamento: number;
};
