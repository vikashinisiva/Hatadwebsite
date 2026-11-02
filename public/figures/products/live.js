/*
 * HataD products section: the three live stages and the access forms.
 *
 * mount(root) wires everything under the section it is given and returns a cleanup that stops
 * every timer, frame, observer and listener, so React can mount it twice (StrictMode) or unmount it
 * without leaving anything running. The markup is rendered by Products.tsx; the class names and
 * data attributes there are the contract this file reads.
 *
 * Each stage plays only while it is on screen, and holds still under reduced motion.
 */
export function mount(root) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const ac = new AbortController()
  const signal = ac.signal
  const observers = []
  const stops = []
  const $ = (s) => root.querySelector(s)
  const $$ = (s) => [...root.querySelectorAll(s)]

  // every stage plays only while it is on screen
  const watch = (el, on, off) => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!('live' in el.dataset)) { el.dataset.live = ''; on() } }
      else if ('live' in el.dataset) { delete el.dataset.live; off() }
    }, { threshold: 0.2 })
    io.observe(el)
    observers.push(io)
  }

  // the whole section pauses its CSS motion (status pings, pulses) while it is off screen
  const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) root.dataset.near = ''; else delete root.dataset.near }, { rootMargin: '25% 0px' })
  near.observe(root)
  observers.push(near)

  mountApp()
  mountApi()
  mountEnterprise()
  wireForms()

  return () => {
    ac.abort()
    observers.forEach((io) => io.disconnect())
    stops.forEach((stop) => stop())
  }

  /* ── 01 · the app: its own interface, rebuilt and played through ── */
  function mountApp() {
    const pa = $('.pa')
    if (!pa) return
    const q = pa.querySelector('.pa-q')
    const rail = $$('.pa-rail button')
    const steps = [...pa.querySelectorAll('.pa-steps li')]
    const DUR = [3400, 2200, 2600, 2800, 3600, 2800, 3800]
    const RAIL = [0, 0, 1, 1, 2, 3, 4]
    const QUERY = 'Perunkudi 55/1A'
    let step = -1, timer = 0, sub = []
    const later = (fn, ms) => sub.push(setTimeout(fn, ms))
    const halt = () => { clearTimeout(timer); sub.forEach(clearTimeout); sub = [] }
    function show(s) {
      halt()
      step = s; pa.dataset.step = String(s); delete pa.dataset.typed
      if (s === 0) {
        q.textContent = ''
        ;[...QUERY].forEach((c, i) => later(() => { q.textContent += c; if (i === QUERY.length - 1) pa.dataset.typed = '' }, 500 + i * 85))
      } else q.textContent = s === 1 ? 'Survey 55/1A · Perunkudi' : 'Survey 55/1A'
      // the check advances while it is on screen
      steps.forEach((li) => li.classList.remove('done', 'now'))
      if (s === 4) { later(() => steps[0].classList.add('done'), 500); later(() => steps[1].classList.add('done'), 1300); later(() => steps[2].classList.add('now'), 2000) }
      if (s > 4) { steps[0].classList.add('done'); steps[1].classList.add('done'); steps[2].classList.add('now') }
      const r = RAIL[s]
      rail.forEach((b, i) => {
        b.classList.toggle('past', i < r)
        b.classList.remove('on')
        if (i === r) {
          const left = DUR.reduce((a, d, k) => (RAIL[k] === r && k >= s ? a + d : a), 0)
          b.style.setProperty('--d', left + 'ms')
          void b.offsetWidth
          b.classList.add('on')
        }
      })
      if (!still && 'live' in pa.dataset) timer = setTimeout(() => show((s + 1) % DUR.length), DUR[s])
    }
    rail.forEach((b) => b.addEventListener('click', () => show(+b.dataset.go), { signal }))
    stops.push(halt)
    if (still) show(6)
    else watch(pa, () => show(step < 0 ? 0 : step), halt)
  }

  /* ── 02 · the API: four calls against one parcel, each lighting the layers it returns ── */
  function mountApi() {
    const pi = $('.pi')
    if (!pi) return
    const con = pi.querySelector('.pi-con')
    const tabs = [...pi.querySelectorAll('.pi-tabs button')]
    const reqEl = pi.querySelector('[data-req]'), resEl = pi.querySelector('[data-res]')
    const planes = [...pi.querySelectorAll('.pi-pl')], labs = [...pi.querySelectorAll('.pi-lab')]
    const K = (t) => '<span class="key">"' + t + '"</span>'
    const S = (t) => '<span class="str">"' + t + '"</span>'
    const N = (t) => '<span class="num">' + t + '</span>'
    const D = (t) => '<span class="dim">' + t + '</span>'
    // each call, once; the three clients are written from it
    const CALLS = [
      { m: 'GET', p: '/parcels/lookup', q: [['village', 'perunkudi'], ['survey', '55/1A']] },
      { m: 'GET', p: '/parcels/55-1A/documents', q: [['village', 'perunkudi']] },
      { m: 'GET', p: '/parcels/55-1A/layers', q: [['village', 'perunkudi'], ['include', 'all']] },
      { m: 'POST', p: '/watch', body: [['parcel', '"55/1A"'], ['events', '["deed", "patta", "imagery"]']] },
    ]
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    // strings first, so the markup added after them is never mistaken for a string
    const tint = (s) => esc(s)
      .replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, (m) => '<span class="str">' + m + '</span>')
      .replace(/(\$\{?\w+\}?|\{(?:API|KEY)\})/g, '<span class="var">$1</span>')
      .replace(/^(curl|const|await|r =)/gm, '<span class="fn">$1</span>')
      .replace(/ (-G|-d|-H) /g, ' <span class="fl">$1</span> ')
    const CLIENT = {
      curl: (c) => c.m === 'GET'
        ? 'curl -G $API' + c.p + ' \\\n  ' + c.q.map(([k, v]) => '-d ' + k + '=' + v).join(' ') + ' \\\n  -H "Authorization: Bearer $KEY"'
        : 'curl $API' + c.p + " \\\n  -d '{" + c.body.map(([k, v]) => '"' + k + '":' + v.replace(/ /g, '')).join(',') + "}' \\\n  -H \"Authorization: Bearer $KEY\"",
      js: (c) => c.m === 'GET'
        ? 'const r = await fetch(`${API}' + c.p + '` +\n  "?' + c.q.map(([k, v]) => k + '=' + v).join('&') + '",\n  { headers: { Authorization: `Bearer ${KEY}` } })'
        : 'await fetch(`${API}' + c.p + '`, { method: "POST",\n  headers: { Authorization: `Bearer ${KEY}` },\n  body: JSON.stringify({ ' + c.body[0][0] + ': ' + c.body[0][1] + ',\n    ' + c.body[1][0] + ': ' + c.body[1][1] + ' }) })',
      py: (c) => c.m === 'GET'
        ? 'r = requests.get(f"{API}' + c.p + '",\n    params={' + c.q.map(([k, v]) => '"' + k + '": "' + v + '"').join(', ') + '},\n    headers={"Authorization": f"Bearer {KEY}"})'
        : 'r = requests.post(f"{API}' + c.p + '",\n    headers={"Authorization": f"Bearer {KEY}"},\n    json={"' + c.body[0][0] + '": ' + c.body[0][1] + ',\n          "' + c.body[1][0] + '": ' + c.body[1][1] + '})',
    }
    // every value is the app's own sample parcel, 55/1A Perunkudi
    const EP = [
      { status: '200 OK', note: '1 parcel', lines: [
        [0, '{'],
        [0, '  ' + K('parcel') + ': ' + S('55/1A') + ', ' + K('village') + ': ' + S('Perunkudi') + ','],
        [0, '  ' + K('taluk') + ': ' + S('Sholinganallur') + ', ' + K('district') + ': ' + S('Chennai') + ','],
        ['sv', '  ' + K('extent') + ': { ' + K('value') + ': ' + N(90) + ', ' + K('unit') + ': ' + S('cents') + ' },'],
        ['sv', '  ' + K('land') + ': ' + S('private_dry') + ', ' + K('soil_class') + ': ' + N(3) + ','],
        ['docs', '  ' + K('patta') + ': { ' + K('number') + ': ' + S('1234') + ', ' + K('holders') + ': ' + N(2) + ' },'],
        ['docs', '  ' + K('deeds_on_survey') + ': ' + N(5) + ', ' + K('last_sale') + ': ' + S('2019-03') + ','],
        [0, '  ' + K('guideline_value') + ': { ' + K('inr_per_sqm') + ': ' + N(10226) + ' },'],
        [0, '  ' + K('links') + ': { ' + K('documents') + ': ' + S('…/55-1A/documents') + ','],
        [0, '             ' + K('layers') + ': ' + S('…/55-1A/layers') + ' }'],
        [0, '}'],
      ] },
      { status: '200 OK', note: 'EC, deeds, patta, FMB, A-Register, courts', lines: [
        [0, '{'],
        ['docs', '  ' + K('ec') + ': { ' + K('from') + ': ' + N(1975) + ', ' + K('to') + ': ' + N(2026) + ','],
        ['docs', '          ' + K('on_survey') + ': ' + N(5) + ', ' + K('on_parcel') + ': ' + N(4) + ' },'],
        ['docs', '  ' + K('deeds') + ': ['],
        ['docs', '    { ' + K('date') + ': ' + S('2025-05') + ', ' + K('type') + ': ' + S('power_of_attorney') + ' },'],
        ['docs', '    { ' + K('date') + ': ' + S('2019-03') + ', ' + K('type') + ': ' + S('sale') + ', ' + K('inr') + ': ' + N(4200000) + ' },'],
        ['docs', '    { ' + K('date') + ': ' + S('2016-06') + ', ' + K('type') + ': ' + S('receipt') + ' },'],
        ['docs', '    { ' + K('date') + ': ' + S('2014-01') + ', ' + K('type') + ': ' + S('mortgage') + ', ' + K('inr') + ': ' + N(1500000) + ' }'],
        ['docs', '  ],'],
        ['docs', '  ' + K('patta') + ': { ' + K('number') + ': ' + S('1234') + ','],
        ['docs', '             ' + K('holders') + ': [' + S('Murugan') + ', ' + S('Selvi') + '] },'],
        ['sv', '  ' + K('fmb') + ': { ' + K('available') + ': ' + N('true') + ' },'],
        ['docs', '  ' + K('a_register') + ': { ' + K('available') + ': ' + N('true') + ' },'],
        ['docs', '  ' + K('court_cases') + ': []'],
        [0, '}'],
      ] },
      { status: '200 OK', note: '5 layers', lines: [
        [0, '{'],
        ['sv', '  ' + K('geometry') + ': { ' + K('type') + ': ' + S('Polygon') + ', ' + K('source') + ': ' + S('survey_map') + ' },'],
        ['zone', '  ' + K('planning') + ': { ' + K('zone') + ': ' + S('Primary residential') + ','],
        ['zone', '                ' + K('plan') + ': ' + S('CMDA Second Master Plan') + ' },'],
        ['near', '  ' + K('around') + ': { ' + K('village_road_m') + ': ' + N(40) + ', ' + K('district_road_m') + ': ' + N(650) + ','],
        ['near', '              ' + K('highway_km') + ': ' + N(2.1) + ' },'],
        ['terr', '  ' + K('terrain') + ': { ' + K('soil_class') + ': ' + N(3) + ', ' + K('water_since_1984') + ': ' + N('false') + ' },'],
        ['sat', '  ' + K('imagery') + ': [' + N(2017) + ', ' + N(2019) + ', ' + N(2021) + ', ' + N(2023) + ', ' + N(2026) + '],'],
        ['sat', '  ' + K('first_built') + ': ' + N(2019) + ','],
        [0, '  ' + K('guideline_value') + ': { ' + K('inr_per_sqm') + ': ' + N(10226) + ','],
        [0, '                       ' + K('since') + ': ' + S('2024-07-01') + ' }'],
        [0, '}'],
      ] },
      { status: '201 Created', note: 'checked every week', lines: [
        [0, '{ ' + K('watch') + ': ' + S('active') + ', ' + K('parcel') + ': ' + S('55/1A') + ', ' + K('every') + ': ' + S('week') + ' }'],
        [0, ''],
        [0, '<span class="rule">── webhook · 27 Oct ─────────────────────────</span>'],
        [0, '{'],
        ['docs', '  ' + K('event') + ': ' + S('deed.registered') + ','],
        ['docs', '  ' + K('survey') + ': ' + S('55') + ', ' + K('village') + ': ' + S('Perunkudi') + ','],
        ['docs', '  ' + K('type') + ': ' + S('sale_agreement') + ', ' + K('registered') + ': ' + S('2026-10-27') + ','],
        [0, '  ' + K('action') + ': ' + S('check whether it names 55/1A')],
        [0, '}'],
      ] },
    ]
    const html = (e) => '<div class="ln st"><span class="ok">' + e.status + '</span>' + D('  ·  ' + e.note + '  ·  sample response') + '</div>'
      + e.lines.map(([l, t], i) => '<div class="ln"' + (l ? ' data-layer="' + l + '"' : '') + '>' + (t || ' ') + (i === e.lines.length - 1 ? '<span class="pi-cursor"></span>' : '') + '</div>').join('')
    const focus = (layers) => {
      const set = new Set(layers)
      planes.forEach((p) => p.classList.toggle('on', set.has(p.dataset.layer)))
      labs.forEach((l) => l.classList.toggle('on', set.has(l.dataset.layer)))
      if (set.size) pi.dataset.focus = ''; else delete pi.dataset.focus
    }
    const clientBtns = [...pi.querySelectorAll('.pi-cl button')], CLIENTS = ['curl', 'js', 'py']
    const DWELL = 6200
    let ep = 0, client = 'curl', apiT = [], playing = false
    const writeReq = () => { reqEl.innerHTML = tint(CLIENT[client](CALLS[ep])) }
    const at = (fn, ms) => apiT.push(setTimeout(fn, ms))
    const clear = () => { apiT.forEach(clearTimeout); apiT = [] }
    function show(i, animate) {
      clear(); ep = i
      tabs.forEach((t, k) => { t.classList.remove('on'); t.setAttribute('aria-pressed', String(k === i)) })
      void tabs[i].offsetWidth
      tabs[i].style.setProperty('--d', DWELL + 'ms'); tabs[i].classList.add('on')
      const put = () => {
        writeReq()
        resEl.innerHTML = html(EP[i])
        con.classList.remove('swap')
        const ls = [...resEl.children]
        if (!animate) { ls.forEach((l) => l.classList.add('in')); return ls }
        ls.forEach((l, k) => at(() => l.classList.add('in'), 30 + k * 45))
        return ls
      }
      focus([])
      const go = () => {
        const ls = put()
        // then read down the response: each line that comes from a layer lights that layer
        const tagged = ls.filter((l) => l.dataset.layer)
        const start = animate ? 30 + ls.length * 45 + 250 : 0
        if (!playing) { focus([...new Set(tagged.map((l) => l.dataset.layer))]); return }
        tagged.forEach((l, k) => at(() => { ls.forEach((x) => x.classList.remove('hot')); l.classList.add('hot'); focus([l.dataset.layer]) }, start + k * 380))
        at(() => { ls.forEach((x) => x.classList.remove('hot')); focus([...new Set(tagged.map((l) => l.dataset.layer))]) }, start + tagged.length * 380 + 200)
        at(() => show((ep + 1) % EP.length, true), DWELL)
      }
      if (animate) { con.classList.add('swap'); at(go, 160) } else go()
    }
    tabs.forEach((t, k) => t.addEventListener('click', () => show(k, !still), { signal }))
    clientBtns.forEach((b, k) => b.addEventListener('click', () => {
      client = CLIENTS[k]
      clientBtns.forEach((x, j) => { x.classList.toggle('on', j === k); x.setAttribute('aria-pressed', String(j === k)) })
      writeReq()
    }, { signal }))
    // the labels and the pin go where the planes actually landed: perspective spreads them further
    // than any flat formula, so they are measured (on load, on resize)
    const stageBox = pi.querySelector('.pi-stage'), pin = pi.querySelector('.pi-pin')
    function place() {
      if (signal.aborted) return
      const s = stageBox.getBoundingClientRect()
      const was = pi.dataset.focus
      delete pi.dataset.focus
      planes.forEach((p) => p.style.setProperty('--lift', '0px'))
      const mid = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2 - s.left, r.top + r.height / 2 - s.top] }
      // each label at its plane's middle, but never closer to the one below than its own height: the
      // documents plane carries raised sheets, so its middle measured 20 px above the survey plane's,
      // where the others are 28 px apart, and its two lines ran into the next label's
      const ys = labs.map((l) => { const p = planes.find((q) => q.dataset.layer === l.dataset.layer); return [l, mid(p)[1]] }).sort((a, b) => a[1] - b[1])
      for (let i = ys.length - 2; i >= 0; i--) ys[i][1] = Math.min(ys[i][1], ys[i + 1][1] - ys[i][0].offsetHeight - 4)
      ys.forEach(([l, y]) => l.style.setProperty('--y', y.toFixed(1) + 'px'))
      const top = mid(planes[planes.length - 1]), bottom = mid(planes[0])
      pin.style.setProperty('--x', top[0].toFixed(1) + 'px')
      pin.style.setProperty('--top', top[1].toFixed(1) + 'px')
      pin.style.setProperty('--h', (bottom[1] - top[1]).toFixed(1) + 'px')
      planes.forEach((p) => p.style.removeProperty('--lift'))
      if (was !== undefined) pi.dataset.focus = was
      pi.dataset.placed = ''
    }
    const raf = requestAnimationFrame(place)
    if (document.fonts) document.fonts.ready.then(place)
    addEventListener('resize', place, { signal })
    stops.push(() => { cancelAnimationFrame(raf); clear(); playing = false })
    // never empty: the first call is on screen, answered, before anything moves
    show(0, false)
    if (still) pi.dataset.still = ''
    else watch(pi, () => { playing = true; show(ep, false) }, () => { playing = false; clear() })
  }

  /* ── 03 · enterprise: the console in private preview, quietly at work ── */
  function mountEnterprise() {
    const px = $('.px')
    if (!px) return
    const $x = (s) => px.querySelector(s)
    const fmt = (n) => n.toLocaleString('en-IN')
    const SEV = { h: 'High', m: 'Medium', l: 'Low' }
    const FIRST = [
      ['55/1A', 'Perunkudi · Chennai', 'Patta holder is not the seller in the draft agreement', 'h', 'AK', '2h'],
      ['188/2', 'Sulur · Coimbatore', 'Part of the plot is water-body poromboke', 'h', 'SP', '5h'],
      ['96/1', 'Manapparai · Tiruchirappalli', 'A civil suit is pending on this survey number', 'h', 'RV', '1d'],
      ['12/4', 'Madipakkam · Chennai', 'No EC entries from 1997 to 2003', 'm', 'AK', '1d'],
      ['703/3', 'Pallikaranai · Chengalpattu', "A new structure in this year's satellite image", 'm', 'SP', '2d'],
      ['41/7B', 'Thirumangalam · Madurai', 'Inside a road-widening 3A notification', 'l', 'RV', '3d'],
    ]
    // each run: a district checked in bulk, and the one finding it turned up
    const RUNS = [
      { district: 'Chengalpattu', n: 240, row: ['22/3', 'Guduvanchery · Chengalpattu', "Seller's name differs between patta and the last deed", 'm', 'SP', 'now'] },
      { district: 'Kanchipuram', n: 180, row: ['77/2', 'Sriperumbudur · Kanchipuram', 'Listed as temple land in HR&amp;CE records', 'h', 'AK', 'now'] },
      { district: 'Tiruppur', n: 120, row: ['310/1', 'Avinashi · Tiruppur', 'Under a TANGEDCO transmission corridor', 'l', 'RV', 'now'] },
    ]
    const FEED = [
      ['b', 'New deed registered on 55/1A, Perunkudi', '2h'],
      ['a', 'Patta changed on 19/3, Sulur', '6h'],
      ['', 'Check complete · 412 parcels in Chennai', '1d'],
      ['', 'Report exported for the credit committee', '1d'],
    ]
    // a sample book, weighted to where land changes hands most
    const WEIGHT = { Chennai: 360, Chengalpattu: 260, Coimbatore: 260, Thiruvallur: 210, Kanchipuram: 190, Madurai: 170, Tiruchirappalli: 130, Salem: 120, Tiruppur: 110 }
    const rowsEl = $x('[data-rows]'), feedEl = $x('[data-feed]'), mapEl = $x('[data-map]'), legEl = $x('[data-leg]')
    const kpi = (k) => $x('[data-k="' + k + '"] strong'), queue = $x('[data-q]'), high = $x('[data-high]')
    const runBar = $x('.px-run u'), runN = $x('[data-rn]'), runD = $x('[data-rd]'), runC = $x('[data-rc]')
    const HEAD = '<div class="px-tr px-th"><span>Parcel</span><span>Finding</span><span>Severity</span><span>Owner</span><span></span></div>'
    const rowHtml = (r, fresh) => '<div class="px-tr' + (fresh ? ' px-new' : '') + '"><span class="pc"><b>' + r[0] + '</b><small>' + r[1] + '</small></span><span class="fd">' + r[2] + '</span><span class="px-sev ' + r[3] + '">' + SEV[r[3]] + '</span><span class="px-av">' + r[4] + '</span><span class="tm">' + r[5] + '</span></div>'
    const feedHtml = (f) => '<li class="' + f[0] + '"><i></i><span>' + f[1] + '</span><small>' + f[2] + '</small></li>'
    // sparklines: a quiet line in each tile, seeded, so it is the same drawing every time
    let sd = 5
    const r01 = () => (sd = (sd * 16807) % 2147483647) / 2147483647
    px.querySelectorAll('[data-spark]').forEach((s) => {
      let v = 10 + r01() * 4
      const pts = Array.from({ length: 16 }, (_, i) => { v = Math.max(3, Math.min(23, v + (r01() - 0.42) * 4)); return [(i / 15) * 100, 26 - v] })
      const line = pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')
      s.innerHTML = '<polygon points="0,26 ' + line + ' 100,26"/><polyline points="' + line + '"/>'
    })
    let state = null
    function initial() {
      state = { watch: 2723, checked: 1086, flags: 18, high: 6, run: 0 }
      rowsEl.innerHTML = HEAD + FIRST.map((r) => rowHtml(r)).join('')
      feedEl.innerHTML = FEED.map(feedHtml).join('')
      kpi('watch').textContent = fmt(state.watch); kpi('checked').textContent = fmt(state.checked); kpi('flags').textContent = state.flags
      queue.textContent = state.flags; high.textContent = state.high + ' high'
    }
    initial()
    // the map: Tamil Nadu by district, shaded by how much of the book sits in each
    const paths = {}
    fetch('/figures/products/tn-districts-mini.json', { signal })
      .then((r) => r.json())
      .then((ds) => {
        const max = Math.max(...Object.values(WEIGHT))
        mapEl.innerHTML = ds.map((d) => { const w = (WEIGHT[d.name] || 14) / max; return '<path data-d="' + d.name + '" d="' + d.d + '" fill="rgb(27 79 216/' + (0.08 + w * 0.5).toFixed(2) + ')"/>' }).join('')
        mapEl.querySelectorAll('path').forEach((p) => { paths[p.dataset.d] = p })
        legEl.innerHTML = Object.entries(WEIGHT).slice(0, 4).map(([n, c]) => '<div><span>' + n + '</span><span>' + fmt(c) + '</span></div>').join('')
      })
      .catch(() => { /* the console reads without its map */ })
    // one run: a bulk check moves through a district, then its finding lands everywhere it should
    let timers = [], raf = 0
    const after = (ms, fn) => timers.push(setTimeout(fn, ms))
    function run() {
      const R = RUNS[state.run % RUNS.length]
      runN.textContent = R.n + ' parcels'; runD.textContent = R.district; runC.textContent = '0 / ' + R.n
      runBar.style.transform = 'scaleX(0)'
      px.dataset.running = ''
      const t0 = performance.now(), DUR = 2800
      const tick = (now) => {
        const u = Math.min(1, (now - t0) / DUR)
        runBar.style.transform = 'scaleX(' + u.toFixed(3) + ')'
        runC.textContent = Math.round(R.n * u) + ' / ' + R.n
        if (u < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      after(DUR + 250, () => {
        delete px.dataset.running
        state.checked += R.n; state.flags++; if (R.row[3] === 'h') state.high++
        kpi('checked').textContent = fmt(state.checked); kpi('flags').textContent = state.flags
        queue.textContent = state.flags; high.textContent = state.high + ' high'
        ;['checked', 'flags'].forEach((k) => { const el = $x('[data-k="' + k + '"]'); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash') })
        // the new flag goes to the top of the queue; the oldest row drops off the bottom
        rowsEl.firstElementChild.insertAdjacentHTML('afterend', rowHtml(R.row, true))
        rowsEl.lastElementChild.remove()
        after(60, () => rowsEl.querySelector('.px-new:not(.settled)')?.classList.add('settled'))
        feedEl.insertAdjacentHTML('afterbegin', feedHtml(['b', 'New flag on ' + R.row[0] + ', ' + R.row[1].split(' · ')[0], 'now']) + feedHtml(['', 'Check complete · ' + R.n + ' parcels in ' + R.district, 'now']))
        while (feedEl.children.length > 5) feedEl.lastElementChild.remove()
        const p = paths[R.district]
        if (p) { p.classList.add('pulse'); after(900, () => p.classList.remove('pulse')) }
        state.run++
        after(state.run % RUNS.length === 0 ? 4200 : 3600, () => { if (state.run % RUNS.length === 0) initial(); run() })
      })
    }
    const stop = () => { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); delete px.dataset.running }
    stops.push(stop)
    if (!still) watch(px, () => { stop(); after(900, run) }, stop)
    // the capability miniatures move only while they are on screen
    const caps = $('.px-caps')
    if (caps && !still) watch(caps, () => {}, () => {})
  }

  /* ── the access requests, and the app's way to the waitlist ── */
  function wireForms() {
    const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
    $$('form[data-source]').forEach((form) => {
      const input = form.querySelector('input'), select = form.querySelector('select'), btn = form.querySelector('button')
      const help = form.nextElementSibling
      const original = help ? help.textContent : ''
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const value = input.value.trim()
        if (!value) { input.focus(); return }
        if (select && !select.value) { select.focus(); return }
        const label = btn.textContent
        btn.disabled = true; btn.textContent = 'Sending…'
        try {
          const res = await fetch('/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, source: form.dataset.source + (select ? ':' + slug(select.value) : ''), lang: 'en' }),
            signal,
          })
          const data = await res.json().catch(() => ({}))
          // the route's own words, so a rejected address says why
          if (!res.ok) throw new Error(data.error || 'That did not go through. Try again in a moment.')
          if (help) { help.textContent = data.alreadyJoined ? 'You’re already on our list. We’ll write to you.' : 'Thanks. We’ll write to you from contact@crestintelligence.in.'; delete help.dataset.error }
          form.dataset.done = ''
          input.value = ''
          if (select) select.value = ''
        } catch (err) {
          if (err && err.name === 'AbortError') return
          if (help) { help.textContent = err.message || original; help.dataset.error = '' }
        } finally {
          if (!signal.aborted) { btn.disabled = false; btn.textContent = label }
        }
      }, { signal })
    })
    // "Join the waitlist" goes to the page's own join form, the first one, in the hero
    $$('[data-join]').forEach((a) => a.addEventListener('click', (e) => {
      const form = document.querySelector('.lt-form')
      if (!form) return
      e.preventDefault()
      form.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' })
      const field = form.querySelector('input')
      if (field) setTimeout(() => field.focus({ preventScroll: true }), still ? 0 : 600)
    }, { signal }))
  }
}
