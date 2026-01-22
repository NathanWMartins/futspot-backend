export type JogadorStatsResponse = {
    createdAt: string;
    totalReservas: number;
    locaisDiferentes: number;
}

export type LocadorStatsResponse = {
    totalQuadras: number;
    totalReservas: number;
    totalFaturamento: number;
    createdAt: string;
}