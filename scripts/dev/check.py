"""Visual checks for Learn pages (needs Python Playwright + Pillow).

Serve the site first:   python3 -m http.server 8200      (from the repo root)

  python3 scripts/dev/check.py explainer models/transformer_networks [--width 900]
      every walkthrough step at its final frame, tiled 8 per contact sheet
  python3 scripts/dev/check.py arch models/transformer_networks attn,mask
      the architecture diagram at 1280 and 390 px, plus one shot per card key clicked
  python3 scripts/dev/check.py lab concepts/embeddings [--width 390]
      the live lab
  python3 scripts/dev/check.py overflow concepts/tokenization models/cnn ...
      page width at 390 px (must equal 390) and any page errors

Images go to /tmp/learn-shots. Console and page errors are printed; an empty list means clean.
"""
import sys, asyncio, io, os, argparse
from playwright.async_api import async_playwright

BASE = os.environ.get('LEARN_URL', 'http://localhost:8200')
OUT = os.environ.get('LEARN_SHOTS', '/tmp/learn-shots')
BLOCK = ('googleapis', 'gstatic', 'jsdelivr')   # fonts/KaTeX CDNs are unreachable in sandboxes


async def open_page(b, path, width, touch=False):
    pg = await b.new_page(viewport={'width': width, 'height': 1000}, has_touch=touch)
    msgs = []
    pg.on('pageerror', lambda e: msgs.append('PAGEERR: ' + str(e)))
    pg.on('console', lambda m: msgs.append(m.text) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load' not in m.text else None)
    await pg.route('**/*', lambda r: r.abort() if any(k in r.request.url for k in BLOCK) else r.continue_())
    await pg.goto(f'{BASE}/{path.strip("/")}/' if path else f'{BASE}/', wait_until='load')
    await pg.evaluate("document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'))")
    return pg, msgs


async def explainer(b, path, width):
    from PIL import Image
    pg, msgs = await open_page(b, path, width)
    await pg.evaluate("document.querySelector('#watch').scrollIntoView()")
    await pg.wait_for_timeout(700)
    await pg.evaluate("document.querySelector('.ex-play').click()")      # pause: steps then render at p = 1
    n = await pg.evaluate("document.querySelectorAll('.ex-dots button').length")
    shots = []
    for i in range(n):
        await pg.evaluate(f"document.querySelectorAll('.ex-dots button')[{i}].click()")
        await pg.wait_for_timeout(250)
        el = await pg.query_selector('div[data-explainer] canvas')
        shots.append(Image.open(io.BytesIO(await el.screenshot())))
    name = path.strip('/').split('/')[-1]
    for start in range(0, n, 8):
        part = shots[start:start + 8]
        w, h = part[0].size
        sheet = Image.new('RGB', (2 * w + 10, ((len(part) + 1) // 2) * (h + 10)), (40, 40, 40))
        for k, im in enumerate(part):
            sheet.paste(im, ((k % 2) * (w + 10), (k // 2) * (h + 10)))
        f = f'{OUT}/{name}_ex_{width}_steps{start + 1}-{start + len(part)}.png'
        sheet.save(f); print(f)
    print(name, n, 'steps', msgs[:5])


async def arch(b, path, keys):
    name = path.strip('/').split('/')[-1]
    for width in (1280, 390):
        pg, msgs = await open_page(b, path, width, touch=width < 500)
        await pg.evaluate("document.querySelector('#arch').scrollIntoView()")
        await pg.wait_for_timeout(700)
        el = await pg.query_selector('div[data-architecture]')
        for k in [''] + keys:
            if k:
                await pg.evaluate(f"document.querySelector('[data-k={k}]').dispatchEvent(new MouseEvent('click', {{bubbles: true}}))")
                await pg.wait_for_timeout(250)
            f = f'{OUT}/{name}_arch_{width}_{k or "default"}.png'
            await el.screenshot(path=f); print(f)
        print(name, width, msgs[:5])


async def lab(b, path, width):
    pg, msgs = await open_page(b, path, width)
    await pg.evaluate("document.querySelector('#lab').scrollIntoView()")
    await pg.wait_for_timeout(1800)
    name = path.strip('/').split('/')[-1]
    f = f'{OUT}/{name}_lab_{width}.png'
    await (await pg.query_selector('div[data-lab]')).screenshot(path=f)
    print(f, msgs[:5])


async def overflow(b, paths):
    for path in paths or ['']:
        pg, msgs = await open_page(b, path, 390)
        await pg.wait_for_timeout(1500)
        w = await pg.evaluate('document.documentElement.scrollWidth')
        print(path or 'hub', 'width', w, 'OK' if w <= 390 else 'OVERFLOW', msgs[:3])


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['explainer', 'arch', 'lab', 'overflow'])
    ap.add_argument('paths', nargs='*')
    ap.add_argument('--width', type=int, default=None)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        if a.mode == 'explainer':
            for path in a.paths: await explainer(b, path, a.width or 900)
        elif a.mode == 'arch':
            await arch(b, a.paths[0], a.paths[1].split(',') if len(a.paths) > 1 else [])
        elif a.mode == 'lab':
            for path in a.paths: await lab(b, path, a.width or 1280)
        else:
            await overflow(b, a.paths)
        await b.close()

asyncio.run(main())
