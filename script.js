let linhasAFD = [];
let layoutAFD = '671';

const loader = document.getElementById('loader');
const afdFileInput = document.getElementById('afdFile');
const cpfInput = document.getElementById('cpf');
const output = document.getElementById('output');

function detectarLayoutAFD(linhas) {
  if (!linhas.length) {
    layoutAFD = '671';
    return;
  }
  const temHifen = linhas.slice(0, 2).some(linha => linha.includes('-'));
  layoutAFD = temHifen ? '671' : '1510';
}

// Eventos sensíveis (tipo 6)
function filtrarEventosSensiveis() {
  loader.style.display = 'block';
  setTimeout(() => {
    const eventos = {
      '01': 'Abertura do REP',
      '02': 'Retorno de Energia',
      '03': 'Dispositivo externo inserido',
      '04': 'Dispositivo externo removido',
      '05': 'Emissão RIM',
      '06': 'Erro de impressão'
    };

    let resultados = [];
    if (layoutAFD === '1510') {
      resultados = linhasAFD.filter(linha => linha.charAt(9) === '6').map((linha) => {
        const nsr = linha.substring(0, 9);
        const tipoRegistro = linha.charAt(9);
        const dataEvento = linha.substring(10, 18); 
        const horaEvento = linha.substring(18, 22);
        const tipoEvento = linha.substring(22, 24);
        const evento = eventos[tipoEvento] || 'Evento desconhecido';

        return `${linha}\n\nNSR: ${nsr}
Data/Hora: ${formatarData1510(dataEvento, horaEvento)}
Tipo de evento: ${evento} (${tipoEvento})

______________________________________________________________________`;
      });
    } else {
      resultados = linhasAFD.filter(linha => linha.charAt(9) === '6').map((linha) => {
        const nsr = linha.substring(0, 9);
        const tipoRegistro = linha.charAt(9); 
        const dataHora = linha.substring(10, 34);
        const tipoEvento = linha.substring(34, 36);
        const evento = eventos[tipoEvento] || 'Evento desconhecido';

        return `${linha}\n\nNSR: ${nsr}
Data/Hora: ${formatarDataHora(dataHora)} 
Tipo de evento: ${evento} (${tipoEvento})
______________________________________________________________________`;
      });
    }

    output.value = resultados.length
      ? resultados.join('\n\n')
      : 'Nenhum evento sensível encontrado.';
    loader.style.display = 'none';
  }, 100);
}

// Marcação REP-C (tipo 3)
function filtrarMarcacoesRepC() {
  loader.style.display = 'block';
  setTimeout(() => {
    const busca = cpfInput.value.trim();
    if (!busca || busca.length < 11) {
      alert('Digite um CPF/PIS válido com 11 dígitos.');
      loader.style.display = 'none';
      return;
    }

    let resultados = [];
    if (layoutAFD === '1510') {
      resultados = linhasAFD.filter(linha => linha.charAt(9) === '3' && linha.substring(22, 34).includes(busca))
        .map(linha => {
          const nsr = linha.substring(0, 9);
          const tipoRegistro = linha.charAt(9);
          const dataMarcacao = linha.substring(10, 18); 
          const horaMarcacao = linha.substring(18, 22); 
          const pis = linha.substring(22, 34);
          const crc16 = linha.substring(34, 38);

          return `${linha}\n\nNSR: ${nsr} | Tipo: ${tipoRegistro} - Marcação REP-C 
Data/Hora da Marcação: ${formatarData1510(dataMarcacao, horaMarcacao)}
PIS do Colaborador: ${pis}
CRC-16: ${crc16}
______________________________________________________________________`;
        });
    } else {
      resultados = linhasAFD.filter(linha => linha.charAt(9) === '3' && linha.substring(34, 46).includes(busca))
        .map(linha => {
          const nsr = linha.substring(0, 9);
          const tipoRegistro = linha.charAt(9); 
          const dataHoraMarcacao = linha.substring(10, 34);
          const cpfEmpregado = linha.substring(34, 46).trim();
          const crc16 = linha.substring(46, 50).trim();

          return `${linha}\n\nNSR: ${nsr} | Tipo: ${tipoRegistro} - Marcação REP-C/REP-A
Data/Hora da Marcação: ${formatarDataHora(dataHoraMarcacao)}
CPF do Colaborador: ${cpfEmpregado}
CRC-16: ${crc16}
______________________________________________________________________`;
        });
    }

    output.value = resultados.length
      ? resultados.join('\n\n')
      : 'Nenhuma marcação REP-C encontrada para o CPF/PIS informado.';

    loader.style.display = 'none';
  }, 100);
}

// Marcação REP-P (tipo 7) - só o  layout 671 :(
function filtrarMarcacoesRepp() {
  loader.style.display = 'block';
  setTimeout(() => {
    const busca = cpfInput.value.trim();
    if (!busca || busca.length < 11) {
      alert('Digite um CPF válido com 11 dígitos.');
      loader.style.display = 'none';
      return;
    }

    if (layoutAFD === '1510') {
      output.value = 'REP-P não existe na Portaria 1510.';
      loader.style.display = 'none';
      return;
    }

    const resultados = linhasAFD.filter(linha => {
      if (linha.charAt(9) !== '7') return false;
      return linha.substring(34, 46).includes(busca);
    }).map(linha => {
      const nsr = linha.substring(0, 9);
      const tipoRegistro = linha.charAt(9);
      const dataHoraMarcacao = linha.substring(10, 34);
      const cpfEmpregado = linha.substring(34, 45).trim();
      const dataHoraGravacao = linha.substring(46, 70);
      const identificadorColetor = linha.substring(70, 72);
      const onOffLine = linha.charAt(72);
      const codigoHash = linha.substring(73, 137).trim();

      const coletorMap = {
        "01": "Aplicativo mobile",
        "02": "Browser (navegador internet)",
        "03": "Aplicativo desktop",
        "04": "Dispositivo eletrônico",
        "05": "Outro dispositivo eletrônico"
      };
      const coletor = coletorMap[identificadorColetor] || "Coletor desconhecido";
      const onlineOffline = onOffLine === '0' ? "On-line" : (onOffLine === '1' ? "Off-line" : "Desconhecido");

      return `${linha}\n\nNSR: ${nsr} | Tipo: ${tipoRegistro} - Marcação REP-P
Data/Hora da marcação: ${formatarDataHora(dataHoraMarcacao)}
CPF do Colaborador: ${cpfEmpregado}
Data/Hora da gravação: ${formatarDataHora(dataHoraGravacao)}
Identificador do coletor: ${coletor} (${identificadorColetor})
Marcação: ${onlineOffline}
Código Hash (SHA-256): ${codigoHash}
______________________________________________________________________`;
    });

    output.value = resultados.length
      ? resultados.join('\n\n')
      : 'Nenhuma marcação REP-P encontrada para o CPF informado.';

    loader.style.display = 'none';
  }, 100);
}

// Filtro geral por CPF/PIS
function filtrarPorCPF() {
  loader.style.display = 'block';
  setTimeout(() => {
    const busca = cpfInput.value.trim();
    if (!busca || busca.length < 11) {
      alert('Digite um CPF/PIS válido com 11 dígitos.');
      loader.style.display = 'none';
      return;
    }
    let resultados = [];
    if (layoutAFD === '1510') {
      resultados = linhasAFD.filter(linha => {
        const tipo = linha.charAt(9);
        if (tipo === '3') return linha.substring(22, 34).includes(busca);
        if (tipo === '4') return linha.substring(34, 45).includes(busca); 
        if (tipo === '5') return linha.substring(23, 35).includes(busca) || linha.substring(92, 103).includes(busca); 
        return false;
      });
    } else {
      resultados = linhasAFD.filter(linha => {
        const tipo = linha.charAt(9);
        if (tipo === '3') return linha.substring(34, 46).includes(busca);
        if (tipo === '4') return linha.substring(58, 69).includes(busca);
        if (tipo === '5') return linha.substring(103, 114).includes(busca);
        if (tipo === '7') return linha.substring(34, 46).includes(busca);
        return false;
      });
    }
    output.value = resultados.length
      ? resultados.join('\n')
      : 'Nenhuma marcação encontrada para o CPF/PIS informado.';
    loader.style.display = 'none';
  }, 100);
}

// Ajustes de colaborador (tipo 5)
function filtrarAjustesPorCPF() {
  loader.style.display = 'block';
  setTimeout(() => {
    const busca = cpfInput.value.trim();
    if (!busca || busca.length < 11) {
      alert('Digite um CPF/PIS válido com 11 dígitos.');
      loader.style.display = 'none';
      return;
    }

    let resultados = [];
    if (layoutAFD === '1510') {
      resultados = linhasAFD.filter(linha => {
        const tipo = linha.charAt(9);
        const pisColab = linha.substring(23, 35);
        const cpfResponsavel = linha.substring(91, 102);
        return tipo === '5' && (pisColab.includes(busca) || cpfResponsavel.includes(busca));
      }).map(linha => {
        const nsr = linha.substring(0, 9);
        const dataGravacao = linha.substring(10, 18); 
        const horaGravacao = linha.substring(18, 22); 
        const operacao = linha.charAt(22);
        const tipoOperacao = {
          'I': 'Inclusão',
          'A': 'Alteração',
          'E': 'Exclusão'
        }[operacao] || 'Operação desconhecida';
        const pisEmpregado = linha.substring(23, 35);
        const nomeEmpregado = linha.substring(35, 87).trim();
        const demaisDados = linha.substring(87, 91);
        const cpfResponsavel = linha.substring(91, 102);

        return `${linha}\n\nNSR: ${nsr} | Tipo 5 - ${tipoOperacao} de colaborador (1510)
Data/Hora: ${formatarData1510(dataGravacao, horaGravacao)}
PIS do Colaborador: ${pisEmpregado}
Nome: ${nomeEmpregado}
PIS do Responsável pela Alteração: ${cpfResponsavel}
________________________________________________________________________________________________`;
      });
    } else {
      resultados = linhasAFD.filter(linha => {
        const tipo = linha.charAt(9);
        const cpfColab = linha.length === 118
          ? linha.substring(35, 47)
          : linha.substring(34, 46);
        return tipo === '5' && (
          cpfColab.includes(busca) ||
          linha.substring(103, 114).includes(busca)
        );
      }).map(linha => {
        const nsr = linha.substring(0, 9);
        const dataHora = linha.substring(10, 34);
        const operacao = linha.charAt(34);
        const tipoOperacao = {
          'I': 'Inclusão',
          'A': 'Alteração',
          'E': 'Exclusão'
        }[operacao] || 'Operação desconhecida';

        const cpfStart = linha.length === 118 ? 35 : 34;
        const cpfEmpregadoRaw = linha.substring(cpfStart, cpfStart + 12).replace(/\D/g, '');
        const cpfEmpregado = cpfEmpregadoRaw.length > 11
          ? cpfEmpregadoRaw.slice(-11)
          : cpfEmpregadoRaw.padStart(11, '0');
        const nomeEmpregado = linha.substring(cpfStart + 12, linha.length - 19).trim();
        const demaisDados = linha.substring(linha.length - 19, linha.length - 15);
        const cpfResponsavel = linha.substring(linha.length - 15, linha.length - 4);

        return `${linha}\n\nNSR: ${nsr} | Tipo 5 - ${tipoOperacao} de colaborador
Data/Hora: ${formatarDataHora(dataHora)}
CPF do Colaborador: ${cpfEmpregado}
Nome: ${nomeEmpregado}
CPF do Responsável pela Alteração: ${cpfResponsavel}
________________________________________________________________________________________________`;
      });
    }

    output.value = resultados.length
      ? resultados.join('\n\n')
      : 'Nenhum ajuste encontrado para o CPF/PIS informado.';
    loader.style.display = 'none';
  }, 100);
}

// Ajuste do relógio (tipo 4)
function filtrarAlteracoesDataHora() {
  loader.style.display = 'block';
  setTimeout(() => {
    let resultados = [];
    if (layoutAFD === '1510') {
      resultados = linhasAFD.filter(linha => linha.charAt(9) === '4').map(linha => {
        const nsr = linha.substring(0, 9);
        const dataAntes = linha.substring(10, 18); 
        const horaAntes = linha.substring(18, 22); 
        const dataAjustada = linha.substring(22, 30); 
        const horaAjustada = linha.substring(30, 34); 
        const cpfResp = linha.substring(34, 45);

        return `${linha}\n\nNSR: ${nsr} | Tipo 4 - Ajuste do relógio (1510)
Data/Hora antes do ajuste: ${formatarData1510(dataAntes, horaAntes)}
Data/Hora ajustada: ${formatarData1510(dataAjustada, horaAjustada)}
CPF Responsável pela alteração: ${cpfResp}
________________________________________________________________________________________________`;
      });
    } else {
      resultados = linhasAFD.filter(linha => linha.charAt(9) === '4').map(linha => {
        const nsr = linha.substring(0, 9);
        const dataHoraAntes = linha.substring(10, 34);
        const dataHoraAjustada = linha.substring(34, 58);
        const cpfResp = linha.substring(58, 69);

        return `${linha}\n\nNSR: ${nsr} | Tipo 4 - Ajuste do relógio
Data/Hora antes do ajuste: ${formatarDataHora(dataHoraAntes)}
Data/Hora ajustada: ${formatarDataHora(dataHoraAjustada)}
CPF Responsável pela alteração: ${cpfResp}
________________________________________________________________________________________________`;
      });
    }

    output.value = resultados.length
      ? resultados.join('\n\n')
      : 'Nenhuma alteração de data/hora encontrada.';
    loader.style.display = 'none';
  }, 100);
}

// Função para formatar data/hora do layout 1510
function formatarData1510(data, hora) {
  if (!data || !hora || data.length !== 8 || hora.length !== 4) return `${data} ${hora}`;
  return `${data.slice(0,2)}/${data.slice(2,4)}/${data.slice(4,8)} ${hora.slice(0,2)}:${hora.slice(2,4)}`;
}

// Função para formatar data/hora do layout 671 
function formatarDataHora(dataHora) {
  if (!dataHora || dataHora.length < 19) return dataHora;
  try {
    const dataIso = dataHora.substring(0, 19);
    const dt = new Date(dataIso);
    if (isNaN(dt.getTime())) return dataHora;

    const dia = String(dt.getDate()).padStart(2, '0');
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const ano = dt.getFullYear();
    const horas = String(dt.getHours()).padStart(2, '0');
    const minutos = String(dt.getMinutes()).padStart(2, '0');
    const segundos = String(dt.getSeconds()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
  } catch {
    return dataHora;
  }
}

// Baixar resultado
function baixarResultado() {
  const outputText = document.getElementById('output').value.trim();
  if (!outputText) {
    alert('Não há conteúdo para baixar.');
    return;
  }

  const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'resultado.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Limpando os Dados
function limparTudo() {
  document.getElementById('afdFile').value = '';
  document.getElementById('output').value = '';
  linhasAFD = []; 
  cpfInput.value = '';
  alert('Arquivo excluído');
}

// Comprimir o arquivo anexado

afdFileInput.addEventListener('change', (e) => {
  loader.style.display = 'block';
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const originalText = reader.result;
    const compressed = pako.deflate(originalText, { to: 'string' });
    linhasAFD = pako.inflate(compressed, { to: 'string' }).split(/\r?\n/);
    detectarLayoutAFD(linhasAFD);
    output.value = 'Arquivo carregado com ' + linhasAFD.length + ' linhas. \nLayout: ' + layoutAFD;
    loader.style.display = 'none';
  };
  reader.readAsText(file, 'iso-8859-1');
});

document.addEventListener('DOMContentLoaded', () => {
  const link = document.getElementById('github-link');
  if (link) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const url = link.href;

      if (window.shell) {
        window.shell.openExternal(url);
      } else if (typeof require === 'function') {
        // Electron context
        const { shell } = require('electron');
        shell.openExternal(url);
      } else {
        window.open(url, '_blank');
      }
    });
  }
  const helpIcon = document.getElementById('help-icon');
  const helpModal = document.getElementById('help-modal');
  const closeBtn = document.querySelector('.modal .close');
  
  if (helpIcon && helpModal && closeBtn) {
    helpIcon.addEventListener('click', () => {
      helpModal.classList.add('show');
    });
    closeBtn.addEventListener('click', () => {
      helpModal.classList.remove('show');
    });
    window.addEventListener('click', (event) => {
      if (event.target === helpModal) {
        helpModal.classList.remove('show');
      }
    });
  }});
