import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Notificacao } from './notificacao.entity';
import { CriarNotificacaoDto } from './dto/notificacao.dto';
import { StatusNotificacao } from './enum/notificacao.enum';
import { Agendamento } from 'src/agendamentos/agendamento.entity';

@Injectable()
export class NotificacaoService {
  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,

    @InjectRepository(Agendamento)
    private readonly agendamentoRepo: Repository<Agendamento>,
  ) { }

  async criar(manager: EntityManager, dados: CriarNotificacaoDto) {
    const notificacao = manager.create(Notificacao, dados);
    return manager.save(notificacao);
  }

  async listarPorUsuario(usuarioId: number) {
    return this.notificacaoRepository.find({
      where: { usuarioId },
      order: { criadoEm: 'DESC' },
    });
  }

  async marcarComoLida(notificacaoId: string) {
    await this.notificacaoRepository.update(notificacaoId, {
      status: StatusNotificacao.LIDA,
    });
  }

  async getNotificacoesNaoLidasCount(usuarioId: number) {
    return this.notificacaoRepository.count({
      where: { status: StatusNotificacao.NAO_LIDA, usuarioId },
    });
  }

  async getNotificacoesNaoLidas(usuarioId: number) {
    return this.getDetalhadas(usuarioId, StatusNotificacao.NAO_LIDA);
  }

  async getNotificacoesLidas(usuarioId: number) {
    return this.getDetalhadas(usuarioId, StatusNotificacao.LIDA);
  }

  private async getDetalhadas(
    usuarioId: number,
    status: StatusNotificacao,
  ) {
    const notificacoes = await this.notificacaoRepository.find({
      where: { usuarioId, status },
      order: { criadoEm: 'DESC' },
    });

    if (notificacoes.length === 0) return [];

    const agendamentoIds = notificacoes
      .map((n) => n.agendamentoId)
      .filter(Boolean) as number[];

    const agendamentos = await this.agendamentoRepo.find({
      where: { id: In(agendamentoIds) },
      relations: ['jogador', 'local'],
    });

    const agMap = new Map(
      agendamentos.map((a) => [a.id, a]),
    );

    return notificacoes.map((n) => {
      const ag = n.agendamentoId
        ? agMap.get(n.agendamentoId)
        : null;

      return {
        id: n.id,
        titulo: n.titulo,
        mensagem: n.mensagem,
        tipo: n.tipo,
        criadaEm: n.criadoEm.toISOString(),
        lida: n.status === StatusNotificacao.LIDA,

        dataAgendamento: ag?.data,
        horaAgendamento: ag?.inicio,

        jogador: ag
          ? {
            id: ag.jogador.id,
            nome: ag.jogador.nome,
            fotoUrl: ag.jogador.fotoUrl,
          }
          : undefined,

        local: ag
          ? {
            id: ag.local.id,
            nome: ag.local.nome,
            fotoUrl: ag.local.fotos?.[0],
          }
          : undefined,
      };
    });
  }

}
