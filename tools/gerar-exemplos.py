"""Generate the style samples under exemplos/ (fictional Juiz de Fora businesses).

Usage: python3 tools/gerar-exemplos.py
Each business gets two directions from the same text: classico/ and ousado/.
The pages run under the site CSP: no inline style, no inline script, no handlers.
Every name, schedule and contact here is invented; the pages say so and are noindex.
"""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'exemplos'

# Simple shapes drawn with three classes (.a, .b, .c) that each theme colors in CSS.
ART = {
    'restaurante': '''<ellipse class="c" cx="100" cy="176" rx="78" ry="10"/>
<path class="b" d="M58 52c-8-14 8-20 0-34M100 46c-8-14 8-20 0-34M142 52c-8-14 8-20 0-34" fill="none" stroke-width="7" stroke-linecap="round"/>
<rect class="a" x="18" y="92" width="28" height="14" rx="7"/><rect class="a" x="154" y="92" width="28" height="14" rx="7"/>
<path class="a" d="M34 80h132v58a34 34 0 0 1-34 34H68a34 34 0 0 1-34-34z"/>
<rect class="b" x="28" y="68" width="144" height="16" rx="8"/><rect class="b" x="88" y="56" width="24" height="14" rx="6"/>''',
    'dentista': '''<circle class="c" cx="100" cy="100" r="92"/>
<path class="a" d="M62 34c-22 0-34 22-28 48 5 22 16 34 20 66 3 22 20 24 24 2 3-18 9-28 22-28s19 10 22 28c4 22 21 20 24-2 4-32 15-44 20-66 6-26-6-48-28-48-16 0-24 10-38 10S78 34 62 34z"/>
<path class="b" d="M70 60c-8 2-14 10-14 22" fill="none" stroke-width="8" stroke-linecap="round"/>''',
    'barbearia': '''<circle class="c" cx="100" cy="100" r="92"/>
<path class="b" d="M80 138L140 22l-8 52-38 70z"/><path class="b" d="M120 138L60 22l8 52 38 70z"/>
<circle class="a" cx="100" cy="104" r="7"/>
<circle class="a" cx="72" cy="152" r="22"/><circle class="a" cx="128" cy="152" r="22"/>
<circle class="c" cx="72" cy="152" r="10"/><circle class="c" cx="128" cy="152" r="10"/>''',
    'academia': '''<circle class="c" cx="100" cy="100" r="92"/>
<g transform="rotate(-20 100 100)"><rect class="b" x="30" y="92" width="140" height="16" rx="6"/>
<rect class="a" x="26" y="58" width="22" height="84" rx="6"/><rect class="a" x="152" y="58" width="22" height="84" rx="6"/>
<rect class="a" x="8" y="72" width="16" height="56" rx="5"/><rect class="a" x="176" y="72" width="16" height="56" rx="5"/></g>''',
    'floricultura': '''<circle class="c" cx="100" cy="100" r="92"/>
<path class="b" d="M100 104v86" fill="none" stroke-width="8" stroke-linecap="round"/>
<path class="b" d="M100 160c-30-4-44-22-46-40 26 0 42 14 46 40zM100 144c22-2 36-16 40-34-22 0-36 12-40 34z"/>
<circle class="a" cx="100" cy="52" r="24"/><circle class="a" cx="136" cy="78" r="24"/><circle class="a" cx="122" cy="118" r="24"/>
<circle class="a" cx="78" cy="118" r="24"/><circle class="a" cx="64" cy="78" r="24"/><circle class="b" cx="100" cy="88" r="16"/>''',
    'oficina': '''<circle class="c" cx="100" cy="100" r="92"/>
<g transform="rotate(45 100 100)"><rect class="a" x="88" y="62" width="24" height="122" rx="12"/>
<circle class="a" cx="100" cy="52" r="38"/><rect class="c" x="88" y="10" width="24" height="40" rx="3"/></g>
<circle class="b" cx="100" cy="100" r="10"/>''',
}

BIZ = [
    dict(slug='restaurante', nome='Fogão da Dona Lia', tipo='Restaurante de comida mineira', bairro='São Mateus',
         fontes=('Fraunces:wght@600;700&family=Work+Sans:wght@400;600', 'Anton&family=Archivo:wght@400;600'),
         h1c='Comida mineira feita no fogão a lenha', h1o='Almoço de vó, todo dia.',
         lead='Almoço de segunda a sábado e marmita para levar, com o tempero da comida de casa.',
         cta='Pedir marmita', cta2='Ver o que tem',
         faixa=['Tropeiro', 'Angu', 'Couve', 'Torresmo', 'Vaca atolada', 'Doce de leite'],
         servicos=[('Almoço no fogão a lenha', 'Arroz, feijão, angu, couve refogada e duas carnes do dia, de segunda a sábado.'),
                   ('Feijoada de sábado', 'Feijoada completa com torresmo, laranja e caldinho de feijão na entrada.'),
                   ('Marmita para levar', 'Mande o pedido até as 11h e busque no balcão ou receba em casa, aqui no bairro.'),
                   ('Doces de tacho', 'Doce de leite, goiabada cascão e ambrosia para fechar o almoço.'),
                   ('Encomendas para festa', 'Frango com quiabo, vaca atolada e tropeiro em travessa, por encomenda.')],
         promessa='A panela vai para o fogo às 7 da manhã.',
         passos=[('Veja o cardápio', 'O prato do dia sai no Instagram e no status do WhatsApp logo cedo.'),
                 ('Mande o pedido', 'Pelo WhatsApp, até as 11h, com o endereço se for entrega.'),
                 ('Busque ou receba', 'A marmita sai quente, pronta para o almoço.')],
         horario=[('Segunda a sexta', '11h às 15h'), ('Sábado', '11h às 16h'), ('Domingo', 'Fechado')]),
    dict(slug='dentista', nome='Ipê Odontologia', tipo='Consultório odontológico', bairro='Granbery',
         fontes=('DM+Serif+Display&family=DM+Sans:wght@400;600', 'Syne:wght@700;800&family=DM+Sans:wght@400;600'),
         h1c='Dentista perto de casa, com consulta sem pressa', h1o='Consulta sem pressa.',
         lead='Limpeza, tratamento e aparelho para adultos e crianças. Na primeira consulta você entende o que precisa ser feito e quanto custa.',
         cta='Marcar consulta', cta2='Ver tratamentos',
         faixa=['Limpeza', 'Clareamento', 'Canal', 'Aparelho', 'Restauração', 'Odontopediatria'],
         servicos=[('Limpeza e prevenção', 'Raspagem, polimento e orientação de escovação. O ideal é voltar a cada seis meses.'),
                   ('Restauração', 'Troca de obturação antiga e conserto de dente quebrado, na cor do dente.'),
                   ('Tratamento de canal', 'Para quando a dor vem de dentro do dente. Explicamos cada sessão antes de começar.'),
                   ('Clareamento', 'De consultório ou com moldeira para usar em casa, depois de uma avaliação.'),
                   ('Aparelho ortodôntico', 'Aparelho fixo ou alinhador, com manutenção marcada todo mês.'),
                   ('Dentista para crianças', 'Primeira visita a partir do primeiro dentinho, com tempo para a criança se acostumar.')],
         promessa='Você sai da primeira consulta sabendo o plano e o valor.',
         passos=[('Marque pelo WhatsApp', 'Diga o melhor dia e horário. Respondemos no mesmo dia útil.'),
                 ('Primeira consulta', 'Avaliação completa, com raio-x se precisar, e conversa sobre o que fazer primeiro.'),
                 ('Orçamento por escrito', 'Você recebe o plano e o valor antes de começar qualquer tratamento.')],
         horario=[('Segunda a sexta', '8h às 18h'), ('Sábado', '8h às 12h'), ('Domingo', 'Fechado')],
         rodape_extra='Responsável técnica: nome e CRO-MG entram aqui no site real.'),
    dict(slug='barbearia', nome='Barbearia do Otávio', tipo='Barbearia', bairro='Centro',
         fontes=('Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600', 'Big+Shoulders+Display:wght@800;900&family=Space+Grotesk:wght@400;600'),
         h1c='Corte e barba com hora marcada', h1o='Corte na hora certa.',
         lead='Cadeira antiga, navalha e toalha quente no Centro de Juiz de Fora. Você marca pelo WhatsApp e é atendido no horário.',
         cta='Marcar horário', cta2='Ver serviços',
         faixa=['Corte', 'Barba', 'Navalha', 'Toalha quente', 'Pezinho', 'Sobrancelha'],
         servicos=[('Corte', 'Na tesoura ou na máquina, do social ao degradê.'),
                   ('Barba', 'Desenho na navalha, toalha quente e balm no final.'),
                   ('Corte e barba', 'Os dois no mesmo horário, sem pressa.'),
                   ('Pezinho e sobrancelha', 'Acabamento rápido entre um corte e outro.'),
                   ('Corte infantil', 'Para a criançada, com paciência e cadeira alta.')],
         promessa='Toda barba leva toalha quente.',
         passos=[('Escolha o horário', 'Mande mensagem no WhatsApp com o serviço e o dia.'),
                 ('Chegue na hora', 'O café está passado e a cadeira está esperando.'),
                 ('Pague como preferir', 'Pix, cartão de débito, crédito ou dinheiro.')],
         horario=[('Terça a sexta', '9h às 20h'), ('Sábado', '8h às 18h'), ('Domingo e segunda', 'Fechado')]),
    dict(slug='academia', nome='Galpão 9 Academia', tipo='Academia de musculação', bairro='Benfica',
         fontes=('Barlow+Condensed:wght@700;800&family=Barlow:wght@400;600', 'Unbounded:wght@800&family=Barlow:wght@400;600'),
         h1c='Musculação com professor na sala o dia inteiro', h1o='Abre às 5h30.',
         lead='Treine antes do trabalho ou depois dele, com um professor por perto para corrigir a postura e ajustar a carga.',
         cta='Agendar aula experimental', cta2='Ver modalidades',
         faixa=['Musculação', 'Funcional', 'Avaliação', 'Iniciantes', 'Mobilidade', 'Cardio'],
         servicos=[('Musculação', 'Treino montado para o seu objetivo e revisto a cada dois meses.'),
                   ('Funcional em grupo', 'Aulas de 45 minutos de manhã cedo e no fim da tarde.'),
                   ('Avaliação física', 'Medidas, peso e testes simples para acompanhar a sua evolução.'),
                   ('Começando do zero', 'Nas primeiras semanas o professor acompanha cada exercício com você.'),
                   ('Mobilidade e alongamento', 'Uma aula curta para quem passa o dia sentado.')],
         promessa='Tem professor na sala em todos os horários.',
         passos=[('Agende a aula experimental', 'Escolha um horário pelo WhatsApp e venha de roupa de treino.'),
                 ('Faça a avaliação', 'O professor conversa sobre o seu objetivo e monta o primeiro treino.'),
                 ('Treine acompanhado', 'Sempre tem alguém na sala para tirar dúvida e ajustar a carga.')],
         horario=[('Segunda a sexta', '5h30 às 22h'), ('Sábado', '8h às 13h'), ('Domingo', 'Fechado')]),
    dict(slug='floricultura', nome='Flor de Maio', tipo='Floricultura', bairro='São Pedro',
         fontes=('Cormorant+Garamond:wght@600;700&family=Nunito+Sans:wght@400;700', 'Shrikhand&family=Outfit:wght@400;600'),
         h1c='Flores e plantas com entrega em Juiz de Fora', h1o='Mande flores hoje.',
         lead='Buquês, arranjos e plantas montados na hora. Pedidos feitos até as 14h chegam no mesmo dia.',
         cta='Encomendar flores', cta2='Ver arranjos',
         faixa=['Buquês', 'Arranjos', 'Orquídeas', 'Suculentas', 'Coroas', 'Casamentos'],
         servicos=[('Buquês', 'De rosas, girassóis ou flores da estação, embrulhados na hora.'),
                   ('Arranjos para presente', 'Em caixa ou cesta, com cartão escrito à mão.'),
                   ('Plantas e vasos', 'Orquídeas, suculentas e plantas de casa, com dica de como cuidar.'),
                   ('Coroas de flores', 'Feitas com cuidado e entregues no velório no horário combinado.'),
                   ('Casamentos e eventos', 'Buquê da noiva, mesas e decoração, com visita antes para planejar.')],
         promessa='Pedido feito até as 14h chega no mesmo dia.',
         passos=[('Escolha o arranjo', 'Peça o catálogo no WhatsApp ou mande uma foto de referência.'),
                 ('Escreva o cartão', 'Diga a mensagem, o endereço e o melhor horário para entregar.'),
                 ('Receba a foto', 'Avisamos com uma foto quando as flores forem entregues.')],
         horario=[('Segunda a sábado', '8h às 19h'), ('Domingo', '8h às 12h')]),
    dict(slug='oficina', nome='Oficina Ponto Morto', tipo='Oficina mecânica', bairro='Industrial',
         fontes=('Zilla+Slab:wght@700&family=IBM+Plex+Sans:wght@400;600', 'Saira+Condensed:wght@800&family=IBM+Plex+Mono:wght@400;600'),
         h1c='Mecânica com orçamento antes do serviço', h1o='Barulho estranho? Traz aqui.',
         lead='Revisão, freio, suspensão e injeção eletrônica para carros de passeio. Você aprova o orçamento antes de qualquer peça ser trocada.',
         cta='Agendar revisão', cta2='Ver serviços',
         faixa=['Revisão', 'Freio', 'Suspensão', 'Óleo', 'Injeção', 'Embreagem'],
         servicos=[('Revisão preventiva', 'Conferimos os itens do manual e dizemos o que pode esperar e o que não pode.'),
                   ('Freios', 'Pastilha, disco, fluido e regulagem do freio de mão.'),
                   ('Suspensão', 'Amortecedor, bandeja e barulho em quebra-mola.'),
                   ('Troca de óleo e filtros', 'Com o óleo indicado pelo fabricante do seu carro.'),
                   ('Injeção eletrônica', 'Diagnóstico com scanner quando a luz do painel acende.'),
                   ('Embreagem', 'Troca do kit e regulagem do pedal.')],
         promessa='A peça trocada volta para você ver.',
         passos=[('Agende pelo WhatsApp', 'Conte o que o carro está fazendo e escolha o dia.'),
                 ('Diagnóstico e orçamento', 'Você recebe o orçamento por escrito, com foto das peças gastas.'),
                 ('Serviço aprovado', 'A gente só começa depois do seu OK, e avisa quando ficar pronto.')],
         horario=[('Segunda a sexta', '8h às 18h'), ('Sábado', '8h às 12h'), ('Domingo', 'Fechado')]),
]

DIRS = {'classico': 'clássica', 'ousado': 'ousada'}


def e(s):
    return escape(s, quote=True)


def page(b, d):
    other = 'ousado' if d == 'classico' else 'classico'
    h1 = b['h1c'] if d == 'classico' else b['h1o']
    fonts = b['fontes'][0 if d == 'classico' else 1]
    title = f"{b['nome']} ({b['tipo']} em {b['bairro']}, exemplo) · 3R Studios"
    desc = (f"Exemplo de estilo da 3R Studios: site {DIRS[d]} para um negócio fictício, "
            f"{b['tipo'].lower()} no bairro {b['bairro']}, em Juiz de Fora.")
    art = f'<svg class="art" viewBox="0 0 200 200" aria-hidden="true" focusable="false">{ART[b["slug"]]}</svg>'
    servicos = '\n'.join(
        f'<li><span class="n">{i:02d}</span><h3>{e(t)}</h3><p>{e(x)}</p></li>' for i, (t, x) in enumerate(b['servicos'], 1))
    passos = '\n'.join(f'<li><h3>{e(t)}</h3><p>{e(x)}</p></li>' for t, x in b['passos'])
    horario = '\n'.join(f'<div><dt>{e(a)}</dt><dd>{e(h)}</dd></div>' for a, h in b['horario'])
    faixa = ''
    fixa = ''
    if d == 'ousado':
        itens = ''.join(f'<span>{e(w)}</span>' for w in b['faixa'])
        faixa = f'<div class="faixa" aria-hidden="true"><div>{itens}{itens}</div></div>'
        fixa = ('<nav class="fixa" aria-label="Atalhos">'
                f'<a href="#contato">{e(b["cta"])}</a><a href="#servicos">Serviços</a><a href="#onde">Onde fica</a></nav>')
    extra = f'<p>{e(b["rodape_extra"])}</p>' if b.get('rodape_extra') else ''
    return f'''<!doctype html>
<html lang="pt-BR" class="t-{b['slug']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="noindex">
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={fonts}&display=swap">
<link rel="stylesheet" href="../../{d}.css">
</head>
<body>
<aside class="exemplo" aria-label="Sobre este exemplo">
<p><b>Exemplo de estilo.</b> {e(b['nome'])} é um negócio fictício; nome, textos e horários foram inventados.</p>
<p class="links"><a href="../{other}/">Ver a versão {DIRS[other]}</a><a href="../../../sites.html">Todos os exemplos</a></p>
</aside>
<header class="topo">
<a class="marca" href="#inicio">{e(b['nome'])}</a>
<nav aria-label="Seções"><a href="#servicos">Serviços</a><a href="#como">Como funciona</a><a href="#onde">Onde fica</a></nav>
<a class="btn" href="#contato">{e(b['cta'])}</a>
</header>
<main id="inicio">
<section class="hero">
<div class="texto">
<p class="kicker">{e(b['tipo'])} · {e(b['bairro'])} · Juiz de Fora</p>
<h1>{e(h1)}</h1>
<p class="lead">{e(b['lead'])}</p>
<p class="acoes"><a class="btn" href="#contato">{e(b['cta'])} no WhatsApp</a><a class="btn linha" href="#servicos">{e(b['cta2'])}</a></p>
</div>
{art}
</section>
{faixa}
<section id="servicos" class="servicos">
<h2>O que você encontra aqui</h2>
<ul>
{servicos}
</ul>
</section>
<section class="promessa"><p>{e(b['promessa'])}</p></section>
<section id="como" class="como">
<h2>Como funciona</h2>
<ol>
{passos}
</ol>
</section>
<section id="onde" class="onde">
<div>
<h2>Onde fica</h2>
<p class="end">Bairro {e(b['bairro'])}, Juiz de Fora (MG)</p>
<p class="nota">No site de verdade entram o endereço completo, o mapa e o botão de rota.</p>
</div>
<div>
<h2>Horário</h2>
<dl>
{horario}
</dl>
</div>
</section>
<section id="contato" class="contato">
<h2>Fale com a gente</h2>
<p>No site de verdade estes botões abrem o WhatsApp, a ligação e o Instagram do negócio.</p>
<ul class="canais">
<li><span class="btn">WhatsApp</span></li>
<li><span class="btn linha">Ligar</span></li>
<li><span class="btn linha">Instagram</span></li>
</ul>
</section>
</main>
<footer class="rodape">
<p>{e(b['nome'])} · {e(b['bairro'])}, Juiz de Fora</p>
{extra}
<p>Negócio fictício. Site de exemplo feito pela <a href="../../../sites.html">3R Studios</a>.</p>
</footer>
{fixa}
</body>
</html>
'''


def main():
    for b in BIZ:
        for d in DIRS:
            out = OUT / b['slug'] / d / 'index.html'
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(page(b, d), encoding='utf-8')
    print(f'{len(BIZ) * len(DIRS)} sample pages written to {OUT}')


if __name__ == '__main__':
    main()
