(() => {
	const $ = (sel, root = document) => root.querySelector(sel);
	const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

	const state = {
		colors: ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"],
		locks: [false, false, false, false, false],
		mode: { mood: "random", harmony: "", seed: null },
		adjust: { temp: 0, sat: 0, light: 0 },
		history: [],
		favorites: [],
		isLight: false
	};

	// Storage
	const storage = {
		load() {
			try {
				const s = JSON.parse(localStorage.getItem("pf_state") || "{}");
				Object.assign(state, s);
			} catch {}
		},
		save() {
			localStorage.setItem("pf_state", JSON.stringify({
				colors: state.colors,
				locks: state.locks,
				mode: state.mode,
				adjust: state.adjust,
				history: state.history,
				favorites: state.favorites,
				isLight: state.isLight
			}));
		}
	};

	storage.load();

	// Utils
	const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
	const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
	const hex = (n) => n.toString(16).padStart(2, "0");
	const toHex = ({ r, g, b }) => `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
	const fromHex = (h) => {
		h = h.replace('#','');
		return {
			r: parseInt(h.slice(0,2),16),
			g: parseInt(h.slice(2,4),16),
			b: parseInt(h.slice(4,6),16)
		};
	};
	const rgbToHsl = ({ r, g, b }) => {
		r/=255; g/=255; b/=255;
		const max = Math.max(r,g,b), min = Math.min(r,g,b);
		let h,s,l=(max+min)/2;
		if(max===min){h=s=0;} else {
			const d = max-min;
			s = l>0.5 ? d/(2-max-min) : d/(max+min);
			switch(max){
				case r: h = (g-b)/d + (g<b?6:0); break;
				case g: h = (b-r)/d + 2; break;
				case b: h = (r-g)/d + 4; break;
			}
			h/=6;
		}
		return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
	};
	const hslToRgb = ({ h, s, l }) => {
		h/=360; s/=100; l/=100;
		const hue2rgb = (p, q, t) => {
			if(t<0) t+=1; if(t>1) t-=1;
			if(t<1/6) return p + (q-p)*6*t;
			if(t<1/2) return q;
			if(t<2/3) return p + (q-p)*(2/3 - t)*6;
			return p;
		};
		let r,g,b;
		if(s===0){ r=g=b=l; }
		else {
			const q = l < .5 ? l*(1+s) : l + s - l*s;
			const p = 2*l - q;
			r = hue2rgb(p,q,h+1/3);
			g = hue2rgb(p,q,h);
			b = hue2rgb(p,q,h-1/3);
		}
		return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
	};
	const adjustHsl = (hexColor, { temp=0, sat=0, light=0 }) => {
		const rgb = fromHex(hexColor);
		const hsl = rgbToHsl(rgb);
		let h = hsl.h + temp * 0.6; // temp mapped to hue shift
		let s = clamp(hsl.s + sat * 0.5, 0, 100);
		let l = clamp(hsl.l + light * 0.5, 0, 100);
		if (h<0) h+=360; if (h>=360) h-=360;
		return toHex(hslToRgb({ h, s, l }));
	};
	const getReadableText = (bgHex) => {
		const { r,g,b } = fromHex(bgHex);
		const yiq = (r*299 + g*587 + b*114) / 1000;
		return yiq >= 140 ? '#0f172a' : '#ffffff';
	};
	const getContrastRatio = (hex1, hex2) => {
		const lum = (hex) => {
			const { r,g,b } = fromHex(hex);
			const srgb = [r,g,b].map(v=>{
				v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
			});
			return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
		};
		const L1 = lum(hex1); const L2 = lum(hex2);
		const [a,b] = L1>L2? [L1,L2] : [L2,L1];
		return (a+0.05)/(b+0.05);
	};

	// Generation
	const randomHex = () => `#${hex(rand(0,255))}${hex(rand(0,255))}${hex(rand(0,255))}`.toUpperCase();
	const generateRandomPalette = (seed) => {
		const colors = [];
		for (let i=0;i<5;i++) colors.push(seed && i===0? seed : randomHex());
		return colors;
	};
	const generatePalette = () => {
		let base = state.colors.slice();
		if (state.mode.seed) base = generateRandomPalette(state.mode.seed);
		else if (state.mode.harmony) base = harmonyGenerate();
		else if (state.mode.mood && state.mode.mood !== 'random') base = moodGenerate();
		else base = generateRandomPalette();
		for (let i=0;i<5;i++) if (!state.locks[i]) state.colors[i] = base[i];
		applyAdjustments();
		render();
		pushHistory();
		storage.save();
	};

	const moodGenerate = () => {
		const mood = state.mode.mood;
		const ranges = {
			calm:   { s:[10,40], l:[60,85] },
			energetic:{ s:[60,95], l:[45,70] },
			professional:{ s:[5,30], l:[30,60] },
			playful:{ s:[55,95], l:[55,80] },
			vintage:{ s:[20,50], l:[45,75] }
		};
		const pick = () => {
			const h = rand(0,359);
			const s = rand(...ranges[mood].s);
			const l = rand(...ranges[mood].l);
			return toHex(hslToRgb({h,s,l}));
		};
		return Array.from({length:5}, pick);
	};

	const harmonyGenerate = () => {
		const kind = state.mode.harmony;
		const baseHue = rand(0,359);
		const s = rand(40,80), l = rand(40,65);
		const hues = {
			complementary: [0, 180, -10, 170, 20],
			analogous: [-30, -10, 0, 10, 30],
			triadic: [0, 120, -120, 10, -110],
			tetradic: [0, 90, 180, -90, 20],
			mono: [0, 0, 0, 0, 0]
		}[kind] || [0,72,144,216,288];
		return hues.map((delta, i) => {
			const h = (baseHue + delta + 360) % 360;
			const ll = kind === 'mono' ? clamp(l + (i-2)*8, 25, 80) : l;
			return toHex(hslToRgb({ h, s, l: ll }));
		});
	};

	const applyAdjustments = () => {
		const { temp, sat, light } = state.adjust;
		state.colors = state.colors.map((c, i) => state.locks[i] ? c : adjustHsl(c, { temp, sat, light }));
	};

	// Rendering
	const paletteEl = $("#palette");
	const render = () => {
		paletteEl.innerHTML = '';
		state.colors.forEach((c, i) => {
			const li = document.createElement('li');
			li.className = 'color-card';
			li.draggable = true;
			li.dataset.index = String(i);
			li.tabIndex = 0;
			li.innerHTML = `
				<div class="color-layer" style="background:${c}"></div>
				<div class="color-info">
					<div class="hex" style="color:${getReadableText(c)}">${c}</div>
					<div class="name" style="color:${getReadableText(c)}">${getColorName(c)}</div>
					<div class="meta">
						<div class="vals" style="color:${getReadableText(c)}">${metaString(c)}</div>
						<div class="tools">
							<button class="lock" data-action="lock" aria-label="Lock color">${state.locks[i] ? '<i class="ti ti-lock"></i>' : '<i class="ti ti-lock-open"></i>'}</button>
							<button class="lock" data-action="shades" aria-label="Show shades"><i class="ti ti-shadow"></i></button>
						</div>
					</div>
				</div>`;
			paletteEl.appendChild(li);
		});
		updatePreviews();
		updateMiniSections();
		updateURL();
	};
	const metaString = (hexColor) => {
		const { r,g,b } = fromHex(hexColor);
		const { h,s,l } = rgbToHsl({r,g,b});
		return `RGB ${r},${g},${b} • HSL ${h},${s}%,${l}%`;
	};

	const updatePreviews = () => {
		const [c0,c1,c2,c3,c4] = state.colors;
		const textOn0 = getReadableText(c0);
		$('.hero-preview').style.background = `linear-gradient(135deg, ${c0}, ${c1})`;
		$('.hero-preview h2').style.color = textOn0;
		$('.hero-preview p').style.color = textOn0;
		$('.hero-preview .btn.primary').style.background = c2;
		$('.hero-preview .btn.primary').style.color = getReadableText(c2);
		$('.hero-preview .btn.outline').style.borderColor = c3;
		$('.hero-preview .btn.outline').style.color = c3;

		const ui = $('.ui-card');
		ui.style.background = c4 + '22';
		ui.style.borderColor = c4 + '55';
		ui.querySelector('h4').style.color = getReadableText(c4);
		ui.querySelector('p').style.color = getReadableText(c0);
		ui.querySelector('.btn.secondary').style.background = c3;
		ui.querySelector('.btn.secondary').style.color = getReadableText(c3);

		const chart = $('#barChart');
		chart.innerHTML = '';
		const vals = [55, 80, 35, 95, 60];
		state.colors.forEach((c,i)=> {
			const bar = document.createElement('div');
			bar.className = 'bar';
			bar.style.background = c;
			bar.style.setProperty('--h', vals[i]+'%');
			chart.appendChild(bar);
		});

		document.documentElement.style.setProperty('--primary', c2);
	};

	// History & Favorites & Trending UI
	const pushHistory = () => {
		state.history.unshift(state.colors.slice());
		state.history = state.history.slice(0,10);
	};
	const updateMiniSections = () => {
		const mount = (el, list, withStar=false) => {
			el.innerHTML = '';
			list.forEach((pal, idx) => {
				const d = document.createElement('div'); d.className = 'mini';
				d.title = withStar ? 'Click to save/rename' : 'Apply palette';
				pal.forEach(c => {
					const s = document.createElement('span'); s.style.background = c; d.appendChild(s);
				});
				d.addEventListener('click', () => {
					state.colors = pal.slice(); state.locks = [false,false,false,false,false]; render(); storage.save();
				});
				el.appendChild(d);
			});
		};
		mount($('#history'), state.history);
		const favs = state.favorites.map(f => f.colors);
		mount($('#favorites'), favs, true);
		const curated = [
			['#1e293b','#0ea5e9','#22d3ee','#a78bfa','#f0abfc'],
			['#0f172a','#14b8a6','#22c55e','#eab308','#f97316'],
			['#0b132b','#1c2541','#3a506b','#5bc0be','#6fffe9'],
			['#2e1065','#7c3aed','#f59e0b','#22c55e','#06b6d4'],
			['#111827','#f472b6','#fb7185','#facc15','#34d399'],
			['#0f172a','#38bdf8','#a3e635','#fde047','#fb7185']
		];
		mount($('#trending'), curated);
	};

	// Export
	const exporters = {
		css: () => `:root {\n${state.colors.map((c,i)=>`  --color-${i+1}: ${c};`).join('\n')}\n}`,
		tailwind: () => `module.exports = { theme: { extend: { colors: {\n${state.colors.map((c,i)=>`  c${i+1}: '${c}',`).join('\n')}\n} } } }` ,
		json: () => JSON.stringify({ colors: state.colors }, null, 2),
		scss: () => state.colors.map((c,i)=>`$color-${i+1}: ${c};`).join('\n')
	};

	const downloadPNG = async () => {
		const w = 1400, h = 500, pad = 16;
		const canvas = document.createElement('canvas');
		canvas.width = w; canvas.height = h;
		const ctx = canvas.getContext('2d');
		for (let i=0;i<5;i++) {
			ctx.fillStyle = state.colors[i];
			ctx.fillRect((w/5)*i, 0, (w/5), h);
			ctx.fillStyle = getReadableText(state.colors[i]);
			ctx.font = 'bold 28px Inter';
			ctx.fillText(state.colors[i], (w/5)*i + pad, h - pad*2);
		}
		const url = canvas.toDataURL('image/png');
		const a = document.createElement('a'); a.href = url; a.download = 'palette.png'; a.click();
	};

	const updateURL = () => {
		const params = new URLSearchParams();
		params.set('c', state.colors.map(c=>c.replace('#','')).join('-'));
		const url = `${location.pathname}?${params.toString()}`;
		history.replaceState(null, '', url);
	};

	const loadFromURL = () => {
		const params = new URLSearchParams(location.search);
		const c = params.get('c');
		if (!c) return;
		const arr = c.split('-').map(x=>`#${x}`.toUpperCase());
		if (arr.length===5) state.colors = arr;
	};

	// Contrast
	const renderContrast = () => {
		const mount = $('#contrastResults');
		mount.innerHTML = '';
		for (let i=0;i<state.colors.length;i++) {
			for (let j=i+1;j<state.colors.length;j++) {
				const a = state.colors[i], b = state.colors[j];
				const ratio = getContrastRatio(a,b);
				const passAA = ratio >= 4.5; const passAAA = ratio >= 7;
				const row = document.createElement('div'); row.className='contrast-item';
				row.innerHTML = `
					<span class="swatch" style="background:${a}"></span>
					<div>${a} vs ${b} — <strong>${ratio.toFixed(2)}:1</strong></div>
					<div>
						<span class="badge" style="background:${passAA?'#16a34a22':'#ef444422'}; border-color:${passAA?'#16a34a55':'#ef444455'}">AA ${passAA?'Pass':'Fail'}</span>
						<span class="badge" style="background:${passAAA?'#16a34a22':'#ef444422'}; border-color:${passAAA?'#16a34a55':'#ef444455'}">AAA ${passAAA?'Pass':'Fail'}</span>
					</div>`;
				mount.appendChild(row);
			}
		}
	};

	// Shades modal
	const openShades = (hexBase) => {
		const shades = [];
		const base = rgbToHsl(fromHex(hexBase));
		for (let i=0;i<9;i++) {
			const l = clamp(10 + i*10, 5, 95);
			shades.push(toHex(hslToRgb({ h: base.h, s: base.s, l })));
		}
		const grid = $('#shadeGrid');
		grid.innerHTML = '';
		shades.forEach(c=>{
			const d = document.createElement('div'); d.className='shade'; d.style.background = c; d.title=c;
			d.addEventListener('click', ()=>{ copy(c); toast(`Copied ${c}`); });
			grid.appendChild(d);
		});
		showModal('#shadeModal');
	};

	// Copy & Toast
	const copy = async (text) => { try { await navigator.clipboard.writeText(text); } catch(e) {} };
	const toast = (msg) => {
		const t = $('#toast');
		t.textContent = msg; t.classList.add('show');
		setTimeout(()=> t.classList.remove('show'), 1600);
	};

	// Modal helpers
	const showModal = (sel) => { const m=$(sel); m.classList.add('show'); m.classList.remove('hidden'); m.setAttribute('aria-hidden','false'); };
	const hideModal = (sel) => { const m=$(sel); m.classList.remove('show'); m.classList.add('hidden'); m.setAttribute('aria-hidden','true'); };

	// Drag & Drop reorder
	let dragIndex = null;
	paletteEl.addEventListener('dragstart', (e)=>{ const li = e.target.closest('.color-card'); dragIndex = Number(li.dataset.index); });
	paletteEl.addEventListener('dragover', (e)=>{ e.preventDefault(); });
	paletteEl.addEventListener('drop', (e)=>{
		e.preventDefault();
		const li = e.target.closest('.color-card'); if (!li) return;
		const dropIndex = Number(li.dataset.index);
		if (dragIndex===null || dragIndex===dropIndex) return;
		const c = state.colors.splice(dragIndex,1)[0];
		const l = state.locks.splice(dragIndex,1)[0];
		state.colors.splice(dropIndex,0,c);
		state.locks.splice(dropIndex,0,l);
		dragIndex = null; render(); storage.save();
	});

	// Event wiring
	$('#btnGenerate').addEventListener('click', ()=>{ generatePalette(); });
	$('#fabGenerate').addEventListener('click', ()=>{ generatePalette(); });
	document.addEventListener('keydown', (e)=>{
		if (e.key === ' ') { e.preventDefault(); generatePalette(); }
		if (e.key === '?') { e.preventDefault(); showModal('#shortcutsModal'); }
	});
	$('#btnShortcuts').addEventListener('click', ()=> showModal('#shortcutsModal'));
	$('#closeShortcuts').addEventListener('click', ()=> hideModal('#shortcutsModal'));
	$('#closeShade').addEventListener('click', ()=> hideModal('#shadeModal'));

	paletteEl.addEventListener('click', (e)=>{
		const card = e.target.closest('.color-card'); if (!card) return;
		const idx = Number(card.dataset.index);
		const actionBtn = e.target.closest('button');
		if (actionBtn && actionBtn.dataset.action === 'lock') { state.locks[idx] = !state.locks[idx]; render(); storage.save(); return; }
		if (actionBtn && actionBtn.dataset.action === 'shades') { openShades(state.colors[idx]); return; }
		copy(state.colors[idx]); toast(`Copied ${state.colors[idx]}`);
	});

	$('#generationModes').addEventListener('click', (e)=>{
		const b = e.target.closest('.chip'); if (!b) return;
		if (b.dataset.mood) { state.mode.mood = b.dataset.mood; state.mode.harmony=''; generatePalette(); }
		if (b.dataset.harmony) { state.mode.harmony = b.dataset.harmony==='mono'?'mono':b.dataset.harmony; generatePalette(); }
	});
	$('#tempSlider').addEventListener('input', (e)=>{ state.adjust.temp = Number(e.target.value); applyAdjustments(); render(); });
	$('#satSlider').addEventListener('input', (e)=>{ state.adjust.sat = Number(e.target.value); applyAdjustments(); render(); });
	$('#lightSlider').addEventListener('input', (e)=>{ state.adjust.light = Number(e.target.value); applyAdjustments(); render(); });
	$('#btnSeed').addEventListener('click', ()=>{
		const v = $('#seedHex').value.trim();
		if (/^#?[0-9a-fA-F]{6}$/.test(v)) { state.mode.seed = v.startsWith('#')? v.toUpperCase() : '#'+v.toUpperCase(); generatePalette(); }
	});

	// Export events
	$('.export-row').addEventListener('click', async (e)=>{
		const b = e.target.closest('.chip'); if (!b) return;
		const type = b.dataset.export;
		if (type === 'png') { await downloadPNG(); return; }
		const out = type && exporters[type] ? exporters[type]() : '';
		$('#exportOutput').value = out; if (out) { copy(out); toast('Copied export to clipboard'); }
	});
	$('#btnShare').addEventListener('click', ()=>{ copy(location.href); toast('Shareable URL copied'); });

	// A11y
	$('#btnContrast').addEventListener('click', ()=> renderContrast());
	$('#colorblindSelect').addEventListener('change', (e)=>{
		const v = e.target.value;
		const root = document.body;
		if (v==='none') { root.removeAttribute('data-cb'); }
		else { root.setAttribute('data-cb', v); }
	});

	// Theme
	const applyTheme = () => { document.body.classList.toggle('light', state.isLight); };
	$('#btnToggleTheme').addEventListener('click', ()=>{ state.isLight = !state.isLight; applyTheme(); storage.save(); });

	// Favorites
	const saveFavorite = () => {
		const name = prompt('Name this palette:', `Palette ${new Date().toLocaleTimeString()}`);
		if (!name) return;
		state.favorites.unshift({ name, colors: state.colors.slice() });
		state.favorites = state.favorites.slice(0, 50);
		storage.save();
		updateMiniSections();
		toast('Saved to favorites');
	};
	$('#btnSaveFavorite').addEventListener('click', saveFavorite);

	// Focus/Lock by keyboard
	let lastFocused = 0;
	paletteEl.addEventListener('focusin', (e)=>{
		const li = e.target.closest('.color-card'); if (!li) return; lastFocused = Number(li.dataset.index);
	});
	document.addEventListener('keydown', (e)=>{
		if (e.key.toLowerCase && e.key.toLowerCase() === 'l') {
			state.locks[lastFocused] = !state.locks[lastFocused]; render(); storage.save();
		}
	});

	// Color names (nearest from a small list)
	const named = [
		['Midnight Blue','#191970'],['Coral Sunset','#FF7F50'],['Teal','#008080'],['Lavender','#B57EDC'],['Crimson','#DC143C'],
		['Goldenrod','#DAA520'],['Slate','#708090'],['Seafoam','#2DD4BF'],['Indigo','#4B0082'],['Emerald','#10B981'],
		['Sky','#38BDF8'],['Amber','#F59E0B'],['Rose','#F43F5E'],['Cobalt','#2563EB'],['Mint','#84CC16'],['Plum','#7C3AED']
	];
	const getColorName = (c) => {
		const {r:rr,g:rg,b:rb} = fromHex(c);
		let best = ['Color', 1e9];
		for (const [name, hexv] of named) {
			const {r,g,b} = fromHex(hexv);
			const d = (rr-r)*(rr-r)+(rg-g)*(rg-g)+(rb-b)*(rb-b);
			if (d < best[1]) best = [name, d];
		}
		return best[0];
	};

	// Init
	loadFromURL();
	applyTheme();
	render();

	// Initial history entry
	if (!state.history.length) pushHistory();
	updateMiniSections();
})();


