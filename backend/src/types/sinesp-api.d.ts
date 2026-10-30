declare module 'sinesp-api' {
  interface SinespConfig {
    host?: string;
    endpoint?: string;
    serviceVersion?: string;
    timeout?: number;
    maximumRetry?: number;
    proxy?: {
      host?: string;
      port?: number;
    };
  }

  interface SinespSearchResult {
    codigoRetorno: string;
    mensagemRetorno: string;
    codigoSituacao?: string;
    situacao?: string;
    modelo: string;
    marca: string;
    cor: string;
    ano: string;
    anoModelo: string;
    placa: string;
    data?: string;
    uf: string;
    municipio: string;
    chassi?: string;
    dataAtualizacaoCaracteristicasVeiculo?: string;
    dataAtualizacaoRouboFurto?: string;
  }

  function configure(config?: SinespConfig): {
    configure: typeof configure;
    search: (plate: string) => Promise<SinespSearchResult>;
  };

  function search(plate: string): Promise<SinespSearchResult>;

  const sinesp: {
    configure: typeof configure;
    search: typeof search;
  };

  export default sinesp;
}
