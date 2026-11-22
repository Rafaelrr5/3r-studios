#!/usr/bin/env python3
"""Generates the home page (index.html) and its section styles (home.css).

Usage: python3 tools/gerar-home.py   (from the repo root; edit the copy here, never index.html)
Shared header/footer come from tools/site_chrome.py; tokens, buttons and Ajustes from site.css/site.js.
Rules of the site: no inline style (CSP), the one inline script is site_chrome.PREFS, pt-BR.
"""
import pathlib, sys, urllib.parse
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import site_chrome as chrome

REPO = pathlib.Path(__file__).resolve().parent.parent
# (marker, title, text, tags, highlight)
TL = [
    ("O começo", "A primeira linha de código",
     "No técnico em Informática do CEFET-MG eu descobri que dava pra criar qualquer coisa com uma tela e uma ideia. Nunca mais parei.",
     "Lógica · Web · Banco de dados", False),
    ("Base", "Ciência pra pensar melhor",
     "Ciências Exatas na UFJF me deu método: entender o problema antes de sair fazendo. É assim que eu começo cada projeto seu.",
     "Matemática · Método", False),
    ("Gente", "Liderar antes de programar",
     "Presidi o Rotaract Juiz de Fora. Aprendi a ouvir, organizar gente e entregar o combinado. Isso vale mais que qualquer linguagem.",
     "Liderança · Projetos", False),
    ("Ensinar", "Ensinar o que eu amo",
     "No Minds of the Future eu ensino programação e robótica pra alunos. Explicar tecnologia simples é parte do meu dia, e do nosso papo também.",
     "Robótica · Educação", False),
    ("2025", "Sistemas de empresa grande",
     "Como consultor técnico, automatizei processos de grandes empresas com certificações oficiais. A mesma régua de qualidade vem pro seu projeto.",
     "Automação · Processos · IA", True),
    ("2026", "Nasce a 3R Studios",
     "Juntei tudo num estúdio: sites, atendimento automático no WhatsApp, agentes de IA e aplicativos. Pra negócios de qualquer tamanho.",
     "Sites · WhatsApp · Agentes de IA", True),
    ("2026", "Um app meu, no ar",
     "Criei o Resenhópolis do zero: web, Android e iPhone. Prova de que eu levo uma ideia até a loja de aplicativos.",
     "App · Android · iOS", True),
]


def wa(msg): return "https://wa.me/5532988767327?text=" + urllib.parse.quote(msg)
WA = wa("Oi Rafael, vim pelo site da 3R Studios!")


ICON = {
 "site": '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M8 21h8"/>',
 "wa": '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 10h6M9 13h4"/>',
 "ia": '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 3v4M9 12h.01M15 12h.01M9.5 15h5"/>',
 "app": '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
 "vid": '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
 "code": '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
 "sci": '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
 "team": '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9.5" r="2.4"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 19a4 4 0 0 1 6.5-3.1"/>',
 "flow": '<rect x="3" y="3.5" width="7" height="5" rx="1.5"/><rect x="14" y="15.5" width="7" height="5" rx="1.5"/><path d="M6.5 8.5v4a3 3 0 0 0 3 3h4.5"/><path d="M12 13l2 2.5-2 2.5"/>',
}
def ico(k, cls=""): return f'<svg{(" class=" + chr(34) + cls + chr(34)) if cls else ""} viewBox="0 0 24 24" aria-hidden="true">{ICON[k]}</svg>'
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
WAI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>'

# Visual for each timeline moment: real photos (uncropped, img/historia/<n>-p.webp + full size <n>.webp),
# a real screenshot, or an illustrated card. Photo sizes (w, h of the -p file) keep every photo whole.
FOTO = {"infancia": (296, 320, "Pequeno, de fone e microfone no computador de casa."),
        "sangue-bom": (711, 320, "Equipe do projeto Sangue Bom na apresentação."),
        "ufjf": (180, 320, "No seminário da FACC, na UFJF."),
        "rotary-tribuna": (180, 320, "Discursando na tribuna do Rotary."),
        "rotary-certificado": (427, 320, "Entrega de certificado no Rotary."),
        "minds-turma": (385, 320, "Turma do Minds of the Future."),
        "experience-2024": (480, 320, "Falando para a plateia no eXperience 2024."),
        "premio-2025": (480, 320, "Recebendo o prêmio de excelência operacional em IA, em 2025.")}
VIS = [("f", ["infancia", "sangue-bom"]),
       ("f", ["ufjf"]),
       ("f", ["rotary-tribuna", "rotary-certificado"]),
       ("f", ["minds-turma", "experience-2024"]),
       ("f", ["premio-2025"]),
       ("img", "img/whatsapp-demo.webp", "Atendimento automático no WhatsApp, feito pela 3R."),
       ("img", "img/portfolio/resenhopolis-m.webp", "O Resenhópolis, publicado no Android e no iPhone.")]

def fotos(i, ns):
    links = "".join(f'<a class="ft-{n}" href="img/historia/{n}.webp" target="_blank" rel="noopener" aria-label="Ver foto inteira: {FOTO[n][2]}">'
                    f'<img src="img/historia/{n}-p.webp" alt="{FOTO[n][2]}" width="{FOTO[n][0]}" height="{FOTO[n][1]}" loading="lazy"></a>' for n in ns)
    return f'<figure class="ph fotos fs{i}">{links}</figure>'

def fotos_css():
    r = [f".ft-{n}{{aspect-ratio:{w}/{h};flex:{w} 1 0}}" for n, (w, h, _) in FOTO.items()]
    for i, v in enumerate(VIS):
        if v[0] == "f":
            k = sum(FOTO[n][0] / FOTO[n][1] for n in v[1]) + .06 * (len(v[1]) - 1)
            r.append(f".item .ph.fs{i}{{width:min(100%,calc({k:.3f} * var(--fh)))}}")
    return "\n".join(r) + "\n"

def item(i):
    m, t, x, tags, hi = TL[i]
    lead, _, rest = x.partition(". ")
    v = VIS[i]
    if v[0] == "f":
        vis = fotos(i, v[1])
    else:
        kind, src, cap = v
        vis = (f'<figure class="ph shot{" tall" if "resenhopolis" in src else ""}"><img src="{src}" alt="{cap}" loading="lazy"></figure>' if kind == "img"
               else f'<figure class="ph art art{i % 3}"><span class="ic">{ico(src)}</span><figcaption>{cap}</figcaption></figure>')
    return f'''<article class="item{' hi' if hi else ''} {'l' if i % 2 == 0 else 'r'}" data-focus data-m="{m}">
<div class="dot"></div><div class="txt"><span class="mk">{m}</span><h3>{t}</h3><p><b>{lead}.</b> {rest}</p><span class="tags">{tags}</span></div>
{vis}</article>'''

PRODUCTS = [
    ("site", "Sites", "Seu negócio bonito, rápido e fácil de achar no Google. Feito para transformar visita em cliente.", "sites.html",
     '<img src="img/portfolio/mariamae.webp" alt="" width="960" height="540" loading="lazy">'),
    ("wa", "Atendimento automático", "Responde na hora no WhatsApp, Instagram e Messenger: horários, agendamentos, dúvidas. Você só entra quando precisa.", "whatsapp.html",
     '<img src="img/whatsapp-demo.webp" alt="" width="342" height="641" loading="lazy">'),
    ("ia", "Agentes de IA", "Um assistente que conhece o seu negócio e resolve dúvidas, contratos e triagens no seu lugar.", "agentes-ia.html",
     '<div class="conversa"><p class="eu">Posso levar meu cachorro na área da piscina?</p><p class="ia">Pelo regulamento do condomínio, animais não entram na área da piscina (artigo 22). Quer falar com a administração?</p></div>'),
    ("app", "Aplicativos", "Sua ideia no celular das pessoas, publicada nas lojas, do jeito que você imaginou.", "aplicativos.html",
     '<img class="d" src="img/portfolio/resenhopolis.webp" alt="" width="960" height="540" loading="lazy"><img class="m" src="img/portfolio/resenhopolis-m.webp" alt="" width="390" height="780" loading="lazy">'),
]
# Client testimonials, verbatim from the client (never invented). One card per entry; the arrows appear from 2 on.
TESTIMONIALS = [
    ("3R Studios realizou em nov/26 a repaginação do site da Fundação. Ficou show: muito fluido, fácil de navegar, indo direto ao ponto. Recomendo.",
     "Carlos Henrique", "Fundação Maria Mãe", "https://mariamae.org.br/"),
]
def tcard(q, who, org, url):
    return (f'<figure class="tq"><span class="stars" role="img" aria-label="5 de 5 estrelas">⭐⭐⭐⭐⭐</span>'
            f'<blockquote><p>“{q}”</p></blockquote><figcaption>{who}, <a href="{url}" target="_blank" rel="noopener">{org}'
            f'<span class="sr"> (abre em nova aba)</span></a></figcaption></figure>')
def testimonials():
    arrows = ('<div class="tnav"><button type="button" data-car="-1" aria-label="Depoimento anterior">‹</button>'
              '<button type="button" data-car="1" aria-label="Próximo depoimento">›</button></div>') if len(TESTIMONIALS) > 1 else ''
    return (f'<section class="tst rv" aria-label="Depoimentos de clientes"><div class="track" tabindex="0">'
            + ''.join(tcard(*t) for t in TESTIMONIALS) + f'</div>{arrows}</section>')

def prod(i, k, n, d, page, vis):
    return (f'<article class="p rv" data-i="{i}"><div class="pv pv-{k}" aria-hidden="true">{vis}</div><div class="pb"><i>{ico(k)}</i><h3>{n}</h3><p>{d}</p>'
            f'<div class="pl"><a class="want" href="{wa("Oi Rafael, quero saber sobre " + n.lower() + ".")}">Quero esse {ARROW}</a>'
            f'<a class="more" href="{page}">Saiba mais<span class="sr"> sobre {n}</span></a></div></div></article>')

# The six that sell first (client work, samples, the bot, apps); the rest opens on request.
WORKS = [
    ("img/portfolio/mariamae.webp", "Fundação Maria Mãe", "Site novo, nota 100 em SEO.", "Cliente", "https://mariamae.org.br/"),
    ("img/sites/restaurante-ousado.webp", "Sites de exemplo", "22 modelos para se inspirar.", "Exemplo", "sites.html#exemplos"),
    ("img/whatsapp-demo.webp", "Atendimento no WhatsApp", "Veja uma conversa de exemplo.", "Exemplo", "whatsapp.html"),
    ("img/portfolio/resenhopolis.webp", "Resenhópolis", "O mapa dos rolês, nas lojas.", "App meu", "https://resenhopolis.3rstudios.com.br/"),
    ("img/portfolio/varal.webp", "Caça-Varal", "Jogo 3D com superpoderes.", "Jogo meu", "jogar/caca-varal/"),
    ("img/portfolio/qualmonmovie.webp", "Qual Mon Movie", "Indica filmes com IA.", "App meu", "https://qualmonmovie.netlify.app/"),
]
MORE_WORKS = [
    ("img/portfolio/do-zero-ao-drop.webp", "Do Zero ao Drop", "Aprenda a ser DJ, em 3D.", "Jogo meu", "jogar/do-zero-ao-drop/"),
    ("img/portfolio/blinkninja.webp", "BlinkNinja", "Desvie, colete, bata recordes.", "Jogo meu", "jogar/blinkninja/"),
    ("img/portfolio/arrumadinho.webp", "Arrumadinho", "Jogo de arrumar a casa.", "Jogo meu", "jogar/arrumadinho/"),
    ("img/portfolio/base-infernal.webp", "Base Infernal", "Tiro em 3D, do zero.", "Jogo meu", "https://rafaelrr5.github.io/TrabalhoCG/T2/"),
    ("img/portfolio/minds-academy.webp", "Minds Academy", "Cursos de robótica.", "UFJF", "https://mindsofthefuture.com.br/"),
]
def work(i, im, n, d, tag, href):
    ext = href.startswith("http")
    return (f'<a class="w rv" data-i="{i}" href="{href}"{" target=" + chr(34) + "_blank" + chr(34) + " rel=" + chr(34) + "noopener" + chr(34) if ext else ""}>'
            f'<div><img src="{im}" alt="" loading="lazy"><s>{tag}</s><u>{"Abrir" if ext else "Ver"} {ARROW}</u></div><b>{n}</b><span>{d}</span>'
            f'{"<span class=" + chr(34) + "sr" + chr(34) + "> (abre em nova aba)</span>" if ext else ""}</a>')

CSS = r"""/* Home sections (index.html). Tokens, header, footer, buttons: site.css. Generated by tools/gerar-home.py. */
.sec{padding:clamp(56px,9vh,104px) 0}
.sec>.in{max-width:var(--max);width:100%;margin:auto;padding:0 var(--pad)}
.hero{min-height:min(100svh,920px);padding-top:calc(var(--hd) + 4vh);display:flex;flex-direction:column;justify-content:center}
.hero>.in{max-width:var(--max);width:100%;margin:auto;padding:0 var(--pad)}
.hero .in{display:grid;grid-template-columns:1.05fr .95fr;gap:4vw;align-items:center}
.k{font-size:calc(14px * var(--s));letter-spacing:.02em;display:flex;align-items:center;gap:30px}
h1{font:400 calc(clamp(38px,4.4vw,66px) * var(--s))/1.04 var(--serif);letter-spacing:-.025em;margin:0 0 22px;max-width:13ch}
.hero .hl,.end .hl{background-size:0% 36%;transition:background-size .7s .4s var(--ease)}
.ready .hero .hl,.end h2.in-view .hl{background-size:100% 36%}
.sub p{font-size:calc(clamp(16px,1.25vw,19px) * var(--s));max-width:42ch;color:var(--mute)}.sub p+p{margin-top:10px;color:var(--fg);font-weight:600}
.show{position:relative;height:min(64vh,580px)}
.show .f{position:absolute;transition:transform .6s var(--ease)}
.show img{width:100%;height:100%;border-radius:12px;box-shadow:0 22px 50px -22px var(--shadow);object-fit:cover;object-position:top;background:var(--soft)}
.show .s1{width:76%;aspect-ratio:16/10;left:0;top:4%}
.show .s2{width:56%;aspect-ratio:16/10;left:10%;bottom:2%}
.show .s3{height:88%;aspect-ratio:1/2;right:0;top:6%}.show .s3 img{border:7px solid var(--art);border-radius:26px}
.show .f>img{animation:bob 7s ease-in-out infinite}.show .s2>img{animation-delay:-2.3s}.show .s3>img{animation-delay:-4.6s}
@keyframes bob{50%{transform:translateY(-5px)}}
.js .hero .e{opacity:0;transform:translateY(8px)}.js .hero .f{opacity:0}
.ready .hero .e{opacity:1;transform:none;transition:opacity .55s var(--ease),transform .55s var(--ease);transition-delay:calc(var(--d)*60ms)}
.ready .hero .f{opacity:1;transition:opacity .7s var(--ease) calc(.15s + var(--d)*90ms),transform .6s var(--ease)}
.head{display:grid;grid-template-columns:1fr 1fr;gap:4vw;align-items:end;margin-bottom:4vh}
h2{font:400 calc(clamp(30px,3.3vw,48px) * var(--s))/1.05 var(--serif);letter-spacing:-.02em;max-width:18ch}
.lead p{max-width:46ch;color:var(--mute)}.lead p+p{margin-top:8px}
.tl{position:relative}
.tl:before,.tl i.ln{content:"";position:absolute;left:50%;top:0;bottom:0;width:2px;background:var(--line);transform:translateX(-50%)}
.tl i.ln{background:var(--fg);transform-origin:top;transform:translateX(-50%) scaleY(var(--p,0))}
.item{display:grid;grid-template-columns:1fr 1fr;gap:7vw;align-items:center;padding:1.2vh 0;position:relative;
 opacity:calc(1 - var(--d,0)*.55);transform:scale(calc(1 - var(--d,0)*.05))}
.item.r .txt{order:2}.item.l .ph{justify-self:start}.item.r .ph{justify-self:end}
.dot{position:absolute;left:50%;top:50%;width:14px;height:14px;border-radius:50%;background:var(--bg);border:2px solid var(--fg);transform:translate(-50%,-50%);transition:transform .35s var(--ease),background .35s,border-color .35s}
.item.on .dot{background:var(--y);border-color:var(--y);transform:translate(-50%,-50%) scale(1.6);box-shadow:0 0 0 6px #ffd21f33}
.mk{font:italic 400 calc(16px * var(--s)) var(--serif);color:var(--mute)}
.item h3{font:400 calc(clamp(21px,1.9vw,28px) * var(--s))/1.1 var(--serif);margin:2px 0 6px}
.item.hi h3{font-style:italic}.item.hi .mk{color:var(--on-y);background:var(--y);padding:0 8px;border-radius:4px}
.item p{max-width:48ch;font-size:calc(15px * var(--s));color:var(--mute)}.item p b{color:var(--fg);font-weight:600}
.tags{display:block;margin-top:6px;font-size:calc(12.5px * var(--s));color:var(--mute)}
.ph{height:clamp(84px,12.5vh,140px);aspect-ratio:16/10;border-radius:12px;overflow:hidden;position:relative;transition:transform .5s var(--ease)}
.item.on .ph{transform:translateY(-3px) rotate(-.6deg)}
.shot{background:var(--soft);box-shadow:0 14px 30px -18px var(--shadow)}.shot img{width:100%;height:100%;object-fit:cover;object-position:top}
.shot.tall img{object-position:center 30%}
.fotos{--fh:clamp(84px,12.5vh,140px);height:auto;aspect-ratio:auto;display:flex;gap:6px;overflow:visible;border-radius:0}
.fotos a{display:block;border-radius:10px;overflow:hidden;background:var(--soft);box-shadow:0 14px 30px -18px var(--shadow);min-width:0}
.fotos img{display:block;width:100%;height:100%}
.fotos a:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
@media(min-width:761px){#sobre .fotos{--fh:clamp(90px,17vh,180px)}}
@media(max-width:760px){.fotos{--fh:150px}}
.art{display:flex;align-items:center;gap:14px;padding:0 20px;border:1px solid var(--line);aspect-ratio:auto;width:min(330px,100%)}
.art0{background:var(--tint0)}.art1{background:var(--tint1)}.art2{background:var(--tint2)}
.art .ic{width:52px;height:52px;border-radius:14px;background:var(--card);display:grid;place-items:center;flex:none;box-shadow:0 6px 14px -8px var(--shadow)}
.art .ic svg{width:28px;height:28px;stroke-width:1.6}.item.on .art .ic svg{animation:wig 1.2s var(--ease)}
.art figcaption{font:italic 400 calc(15px * var(--s))/1.3 var(--serif);color:var(--fg)}
@keyframes wig{30%{transform:rotate(-5deg) scale(1.04)}60%{transform:rotate(3deg)}}
.tst{position:relative;margin:0 0 3vh}
.tst .track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:16px}.tst .track::-webkit-scrollbar{display:none}
.tst .track:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
.tq{flex:0 0 100%;scroll-snap-align:start;margin:0;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:6px 22px;
 padding:16px 22px;border:1px solid var(--line);border-radius:16px;background:var(--card)}
.tq .stars{font-size:calc(18px * var(--s));letter-spacing:2px;white-space:nowrap}
.tq blockquote{margin:0}.tq p{font:italic 400 calc(clamp(15px,1.15vw,18px) * var(--s))/1.4 var(--serif);color:var(--fg)}
.tq figcaption{font-size:calc(13.5px * var(--s));color:var(--mute);white-space:nowrap}.tq figcaption a{color:inherit}
.tnav{position:absolute;right:10px;top:-46px;display:flex;gap:6px}
.tnav button{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--fg);font-size:calc(20px * var(--s));cursor:pointer}
@media(max-width:980px){.tq{grid-template-columns:1fr;padding:16px 18px}.tq figcaption{white-space:normal}}
.prods{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.p{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .25s,box-shadow .25s,transform .25s var(--ease)}
.p.in-view:hover{border-color:var(--fg);transform:translateY(-4px);box-shadow:0 18px 34px -22px var(--shadow)}
.pv{position:relative;height:clamp(190px,22vw,270px);overflow:hidden;border-bottom:1px solid var(--line);display:grid;place-items:center}
.pv-site{background:var(--tint0)}.pv-wa{background:var(--tint1)}.pv-ia{background:var(--tint2)}.pv-app{background:var(--soft)}
.pv img{transition:transform .6s var(--ease)}.p:hover .pv img{transform:translateY(-4px)}
.pv-site img{width:82%;height:auto;align-self:end;border-radius:10px 10px 0 0;box-shadow:0 18px 40px -20px var(--shadow)}
.pv-wa img{width:min(46%,190px);height:auto;align-self:start;margin-top:22px;border-radius:20px;border:6px solid var(--art);box-shadow:0 18px 40px -20px var(--shadow)}
.pv-ia .conversa{display:grid;gap:8px;width:min(86%,440px)}
.pv-ia .conversa p{margin:0;max-width:88%;padding:10px 14px;border-radius:16px;line-height:1.4;font-size:calc(14.5px * var(--s))}
.pv-ia .eu{justify-self:end;background:var(--acc);color:var(--on-acc);border-bottom-right-radius:4px}
.pv-ia .ia{justify-self:start;background:var(--card);border:1px solid var(--line);border-bottom-left-radius:4px}
.pv-app .d{position:absolute;left:7%;bottom:-6%;width:66%;height:auto;border-radius:10px;box-shadow:0 18px 40px -20px var(--shadow)}
.pv-app .m{position:absolute;right:9%;top:12%;width:24%;height:auto;border-radius:18px;border:5px solid var(--art);box-shadow:0 18px 40px -20px var(--shadow)}
.pb{padding:22px 24px 24px;display:grid;grid-template-columns:auto 1fr;gap:4px 16px;align-items:start;flex:1}
.p i{grid-row:span 2;width:44px;height:44px;border-radius:12px;background:var(--y);color:var(--on-y);display:grid;place-items:center;transition:transform .4s var(--ease)}
.p:hover i{transform:rotate(-8deg) scale(1.08)}
.p h3{font:400 calc(26px * var(--s))/1.1 var(--serif)}.p p{font-size:calc(15px * var(--s));color:var(--mute);max-width:48ch}
.pl{grid-column:1/-1;display:flex;align-items:center;gap:18px;margin-top:14px;font-size:calc(14.5px * var(--s));font-weight:600}
.pl .more{color:var(--fg)}
.want{display:inline-flex;white-space:nowrap;align-items:center;gap:6px;text-decoration:none;background:var(--acc);color:var(--on-acc);padding:11px 18px;border-radius:99px}
.want svg{width:15px;height:15px;transition:transform .25s}.want:hover svg{transform:translateX(3px)}
.also{margin-top:22px;text-align:center;color:var(--mute);font-size:calc(15px * var(--s))}.also a{color:var(--fg);font-weight:600}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px 22px}
.grid.sm{grid-template-columns:repeat(6,1fr);gap:18px 16px;margin-top:26px}
.grid:not(.sm) .w b{font-size:calc(22px * var(--s))}.grid:not(.sm) .w span{font-size:calc(15px * var(--s))}
.mw{margin-top:30px}.mw>summary,.story>summary{list-style:none;cursor:pointer;display:flex;width:max-content;margin:0 auto;align-items:center;gap:8px;
 padding:11px 20px;border:1px solid var(--fg);border-radius:99px;font-weight:600;font-size:calc(15px * var(--s))}
.mw>summary::-webkit-details-marker,.story>summary::-webkit-details-marker{display:none}
.mw>summary svg,.story>summary svg{width:16px;height:16px;transform:rotate(90deg);transition:transform .25s var(--ease)}
.mw[open]>summary svg,.story[open]>summary svg{transform:rotate(-90deg)}
.mw>summary:hover,.story>summary:hover{background:var(--fg);color:var(--bg)}
.peek{display:flex;justify-content:center;gap:10px;margin:0 0 26px}.peek img{height:clamp(84px,9vw,128px);width:auto;border-radius:10px;box-shadow:0 14px 30px -18px var(--shadow)}
@media(max-width:600px){.peek img:nth-child(n+3){display:none}}
.story{margin-top:10px}.story[open]>summary{margin-bottom:5vh}
.w{text-decoration:none;display:block}.w div{position:relative;border-radius:10px;overflow:hidden;background:var(--soft);aspect-ratio:16/10}
.w img{width:100%;height:100%;object-fit:cover;object-position:top;transition:transform .6s var(--ease)}.w:hover img{transform:scale(1.03)}
.w s{position:absolute;left:8px;top:8px;text-decoration:none;font-size:calc(11.5px * var(--s));font-weight:600;background:#fff;color:#111;padding:2px 8px;border-radius:99px}
.w u{position:absolute;right:8px;bottom:8px;text-decoration:none;display:flex;align-items:center;gap:4px;font-size:calc(12.5px * var(--s));font-weight:600;background:var(--y);color:var(--on-y);padding:4px 10px;border-radius:99px;
 opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s var(--ease)}
.w u svg{width:14px;height:14px}.w:hover u,.w:focus-visible u{opacity:1;transform:none}
.w b{display:block;font:400 calc(18px * var(--s))/1.15 var(--serif);margin-top:8px}.w span{color:var(--mute);font-size:calc(13.5px * var(--s))}
.w.all div{display:grid;place-items:center;background:var(--y);color:var(--on-y)}.w.all div svg{width:42px;height:42px;transition:transform .3s var(--ease)}.w.all:hover div svg{transform:translateX(6px)}
.end{padding-bottom:0;display:flex;flex-direction:column;min-height:min(100svh,900px)}.end>.in{text-align:center;display:flex;flex-direction:column;align-items:center;flex:1;justify-content:center}
.end h2{font-size:calc(clamp(44px,6vw,92px) * var(--s));max-width:none;line-height:1}
.end h2 .wd{display:inline-block}.js .end h2 .wd{opacity:0;transform:translateY(.2em)}
.end h2.in-view .wd{opacity:1;transform:none;transition:opacity .5s var(--ease),transform .5s var(--ease);transition-delay:calc(var(--i)*50ms)}
.end>.in .sub p{margin:18px auto 0;text-align:center}.end>.in .btns{justify-content:center}
@media(max-width:1100px){.grid.sm{grid-template-columns:repeat(4,1fr)}}
@media(max-width:980px){.hero .in{grid-template-columns:1fr}.show{height:70vw;margin-top:4vh}.head{grid-template-columns:1fr}
 .prods{grid-template-columns:1fr}.grid,.grid.sm{grid-template-columns:1fr 1fr}.w u{opacity:1;transform:none}}
@media(max-width:760px){.tl:before,.tl i.ln,.dot{left:8px}.item{grid-template-columns:1fr;gap:10px;padding:2.4vh 0 2.4vh 34px}
 .item.r .txt{order:0}.item .ph{justify-self:start!important;width:100%;height:auto}.art{padding:16px}.pv{height:200px}.pb{padding:18px 18px 20px}.p h3{font-size:calc(23px * var(--s))}.grid{gap:20px 12px}
 .grid:not(.sm) .w b{font-size:calc(18px * var(--s))}.grid:not(.sm) .w span{font-size:calc(13.5px * var(--s))}}
html[data-motion="reduce"] .item{opacity:1;transform:none}html[data-motion="reduce"] .hero .hl,html[data-motion="reduce"] .end .hl{background-size:100% 36%}
html[data-motion="reduce"] .js .hero .e,html[data-motion="reduce"].js .hero .e,html[data-motion="reduce"].js .hero .f,html[data-motion="reduce"].js .end h2 .wd{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){html[data-motion="auto"] .item{opacity:1;transform:none}html[data-motion="auto"] .hl{background-size:100% 36%}
 html[data-motion="auto"].js .hero .e,html[data-motion="auto"].js .hero .f,html[data-motion="auto"].js .end h2 .wd{opacity:1;transform:none}}
"""

BTNS = f'''<div class="btns e" data-d="4"><a class="btn b1" href="#produtos">Ver o que eu faço {ARROW}</a>
<a class="btn b2" href="#trabalhos">Ver meu trabalho {ARROW}</a></div>
<a class="talk e" data-d="5" href="{WA}">{WAI} Ou fale comigo agora no WhatsApp</a>'''
FAV = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E%3Crect%20width='64'%20height='64'%20rx='14'%20fill='%23FFD21F'/%3E%3Ctext%20x='32'%20y='45'%20text-anchor='middle'%20font-family='Fraunces%2CGeorgia%2Cserif'%20font-style='italic'%20font-size='36'%20fill='%23111'%3E3R%3C/text%3E%3C/svg%3E"
DESC = "Rafael Rocha, da 3R Studios: sites, atendimento automático, agentes de IA, aplicativos e vídeos. Conheça a história e os trabalhos no ar."
END_WORDS = 'Sua ideia é <span class="wd hl">a próxima</span>.'
end_h2 = " ".join(f'<span class="wd">{w}</span>' for w in "Sua ideia é".split()) + ' <span class="wd"><span class="hl">a próxima</span>.</span>'

tl = "".join(item(i) for i in range(len(TL)))
prods = "".join(prod(i, *p) for i, p in enumerate(PRODUCTS))
works = "".join(work(i, *w) for i, w in enumerate(WORKS))
more_works = "".join(work(0, *w) for w in MORE_WORKS) + (f'<a class="w all" href="apps.html"><div>{ARROW}</div>'
    '<b>Todos os apps e jogos</b><span>O catálogo completo do estúdio.</span></a>')
PEEK = ["premio-2025", "minds-turma", "experience-2024", "rotary-certificado"]
peek = "".join(f'<img src="img/historia/{n}-p.webp" alt="{FOTO[n][2]}" width="{FOTO[n][0]}" height="{FOTO[n][1]}" loading="lazy">' for n in PEEK)
VIDEO = wa("Oi Rafael, quero saber sobre vídeos e anúncios.")

LD = (REPO / "tools" / "home-ld.html").read_text(encoding="utf-8").strip()
HTML = f'''<!doctype html>
<html lang="pt-BR" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>3R Studios · Sites, atendimento automático e apps, por Rafael Rocha</title>
<meta name="description" content="{DESC}">
<link rel="canonical" href="https://3rstudios.com.br/">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FBFAF6">
<meta property="og:title" content="3R Studios · Sites, atendimento automático e apps, por Rafael Rocha">
<meta property="og:description" content="{DESC}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://3rstudios.com.br/">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="3R Studios">
<meta property="og:image" content="https://3rstudios.com.br/img/og-2.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://3rstudios.com.br/img/og-2.png">
<link rel="icon" href="{FAV}">
{chrome.PREFS}
<link rel="preload" href="fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="site.css">
<link rel="stylesheet" href="home.css">
<script src="site.js" defer></script>
{LD}
</head>
<body id="topo">
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
{chrome.header('', home=True)}

<main id="conteudo">
<section class="hero" aria-label="Apresentação"><div class="in"><div>
<h1 class="e" data-d="1">Eu faço a tecnologia trabalhar <span class="hl">para o seu negócio</span>.</h1>
<div class="sub e" data-d="2"><p>Sites que encantam, atendimento automático que não dorme e apps feitos com o cuidado de quem programa por paixão.</p>
<p>Do primeiro rascunho ao ar, você fala direto comigo.</p></div>{BTNS}</div>
<div class="show" aria-hidden="true"><span class="f s1" data-d="0"><img src="img/hero/caixinha-da-lia.webp" alt=""></span><span class="f s2" data-d="1"><img src="img/hero/quintal-das-dalias.webp" alt=""></span><span class="f s3" data-d="2"><img src="img/hero/trequim-m.webp" alt=""></span></div>
</div></section>

<section class="sec" id="produtos"><div class="in"><div class="head"><h2 class="rv">O que eu posso fazer por você.</h2>
<div class="lead rv" data-i="1"><p>Escolha por onde começar.</p><p>Se não souber qual, me conte o problema que eu indico.</p></div></div>
{testimonials()}
<div class="prods">{prods}</div>
<p class="also rv">Também faço vídeos de produto e anúncios curtos. <a href="{VIDEO}">Pedir um vídeo</a></p></div></section>

<section class="sec" id="trabalhos"><div class="in"><div class="head"><h2 class="rv">Coisas que já estão no ar.</h2>
<div class="lead rv" data-i="1"><p>Apps, jogos e sites que eu criei, meus e de clientes.</p><p>Tudo funcionando hoje, é só abrir.</p></div></div>
<div class="grid">{works}</div>
<details class="mw"><summary>Ver mais trabalhos {ARROW}</summary><div class="grid sm">{more_works}</div></details></div></section>

<section class="sec" id="sobre"><div class="in"><div class="head"><h2 class="rv">Prazer, eu sou o Rafael.</h2>
<div class="lead rv" data-i="1"><p>Programar é o que eu faria mesmo se ninguém pagasse.</p><p>Essa é a história de como virou o meu trabalho, e o seu atalho.</p></div></div>
<div class="peek rv" data-i="2">{peek}</div>
<details class="story"><summary>Ver minha história {ARROW}</summary><div class="tl"><i class="ln"></i>{tl}</div></details></div></section>

<section class="sec end" id="contato"><div class="in"><h2>{end_h2}</h2>
<div class="sub rv" data-i="3"><p>Me conte o que você precisa. Eu respondo pessoalmente.</p></div>
<div class="btns rv" data-i="4"><a class="btn b1" href="{WA}">{WAI} Chamar no WhatsApp</a><a class="btn b2" href="mailto:faelrribeiro3@gmail.com?subject=Vim%20pelo%20site%20da%203R">Mandar um e-mail {ARROW}</a></div></div>
{chrome.footer('', 'index.html')}
</section>
</main>
{chrome.JUMP.replace('#rodape', '#contato')}
</body>
</html>
'''
(REPO / "index.html").write_text(HTML, encoding="utf-8")
(REPO / "home.css").write_text(CSS + fotos_css(), encoding="utf-8")
print("home written")
