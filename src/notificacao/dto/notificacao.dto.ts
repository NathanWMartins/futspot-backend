import { TipoNotificacao } from '../enum/notificacao.enum';

export class CriarNotificacaoDto {
  usuarioId: number;
  agendamentoId?: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
}

export interface NotificacaoDetalhadaDTO {
  id: string;
  titulo: string;
  mensagem: string;
  criadaEm: string;
  lida: boolean;

  jogador?: {
    id: number;
    nome: string;
    fotoUrl?: string;
  };

  local?: {
    id: number;
    nome: string;
    fotoUrl?: string;
  };
}