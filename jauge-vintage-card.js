const DEFAULTS = {
  title: 'TEMP',
  unit: '°C',
  min: 0,
  max: 45,
  decimals: 1,
  height: 350,
  max_width: null,
  colors: {
    background: '#000000',
    needle: ['#990000', '#ff3300', '#ffff66'],
    needle_glow: '#ff3300',
    value: '#ffffff',
    value_glow: '#ffffff',
    title: '#ffd400',
    ticks: '#b4b4b4',
  },
  geometry: {
    radius: 430,
    center_x: -180,
    center_y: null,
    degrees_per_unit: 4,
    major_every: 2,
    major_length: 78,
    minor_length: 18,
    value_font_size: 110,
    title_font_size: 34,
    unit_font_size: 40,
    tick_font_min: 36,
    tick_font_max: 60,
  },
  animation: {
    enabled: true,
    stiffness: 0.01,
    damping: 0.92,
  },
};

export function normalizeConfig(config) {
  if (!config || !config.entity) {
    throw new Error('jauge-vintage-card: "entity" is required');
  }
  return {
    ...DEFAULTS,
    ...config,
    colors: { ...DEFAULTS.colors, ...(config.colors || {}) },
    geometry: { ...DEFAULTS.geometry, ...(config.geometry || {}) },
    animation: { ...DEFAULTS.animation, ...(config.animation || {}) },
    entity: config.entity,
  };
}

const TO_RADIANS = Math.PI / 180;
export const LOGICAL_W = 800;
export const FADE_WINDOW = 120;

export function scaleColor(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r},${g},${b})`;
}

export function isMajorTick(value, majorEvery) {
  return (((value % majorEvery) + majorEvery) % majorEvery) === 0;
}

export function computeTicks(cfg, temp) {
  const g = cfg.geometry;
  const centerX = g.center_x;
  const centerY = g.center_y == null ? cfg.height / 2 : g.center_y;
  const radius = g.radius;
  const ticks = [];

  for (let v = cfg.min; v <= cfg.max; v++) {
    const angle = (v - temp) * g.degrees_per_unit * TO_RADIANS;
    const major = isMajorTick(Math.round(v), g.major_every);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const x1 = centerX + radius * cos;
    const y1 = centerY + radius * sin;
    const innerRadius = radius - (major ? g.major_length : g.minor_length);
    const x2 = centerX + innerRadius * cos;
    const y2 = centerY + innerRadius * sin;

    const fade = Math.max(0.15, 1 - Math.abs(y1 - centerY) / FADE_WINDOW);
    const color = scaleColor(cfg.colors.ticks, fade);

    let label = null;
    let labelX = 0;
    let labelY = 0;
    let fontSize = 0;
    if (major) {
      const textRadius = radius + 35;
      labelX = centerX + textRadius * cos;
      labelY = centerY + textRadius * sin;
      fontSize = Math.round(
        g.tick_font_min + fade * (g.tick_font_max - g.tick_font_min)
      );
      label = v.toString();
    }

    ticks.push({
      value: v, x1, y1, x2, y2, major, color,
      lineWidth: major ? 5 : 2, label, labelX, labelY, fontSize,
    });
  }
  return ticks;
}

export function physicsStep(displayTemp, targetTemp, velocity, stiffness, damping) {
  const diff = targetTemp - displayTemp;
  velocity += diff * stiffness;
  velocity *= damping;
  let next = displayTemp + velocity;

  if (Math.abs(diff) <= 0.005 && Math.abs(velocity) <= 0.005) {
    return { displayTemp: targetTemp, velocity: 0, settled: true };
  }
  return { displayTemp: next, velocity, settled: false };
}

export function readEntityValue(hass, entityId) {
  const raw = hass?.states?.[entityId]?.state;
  const value = parseFloat(raw);
  return Number.isNaN(value) ? null : value;
}

if (typeof window !== 'undefined' && window.customElements) {
  class JaugeVintageCard extends HTMLElement {
    setConfig(config) {
      this._config = normalizeConfig(config);
      this._targetTemp = this._config.min;
      this._displayTemp = this._config.min;
      this._velocity = 0;
      this._needsDraw = true;
      this._cachedValStr = '';
      this._buildDom();
      this._initStaticLayer();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._config) return;
      const v = readEntityValue(hass, this._config.entity);
      if (v != null && v !== this._targetTemp) {
        this._targetTemp = v;
        this._needsDraw = true;
      }
    }

    getCardSize() {
      return Math.max(1, Math.round((this._config?.height || 350) / 50));
    }

    getGridOptions() {
      const rows = Math.max(1, Math.round((this._config?.height || 350) / 56));
      return {
        columns: 12,
        rows,
        min_columns: 4,
        max_columns: 12,
        min_rows: 1,
      };
    }

    connectedCallback() {
      if (this._config && !this._rafId) this._loop();
    }

    disconnectedCallback() {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    _buildDom() {
      if (this._root) return;
      this._root = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      const maxWidthRule = this._config.max_width
        ? `max-width:${this._config.max_width}px;margin:0 auto;`
        : '';
      style.textContent =
        `:host{display:block;${maxWidthRule}}ha-card{overflow:hidden;background:` +
        this._config.colors.background +
        '}canvas{width:100%;display:block}';
      const card = document.createElement('ha-card');
      this._canvas = document.createElement('canvas');
      const H = this._config.height;
      const dpr = window.devicePixelRatio || 1;
      this._canvas.width = LOGICAL_W * dpr;
      this._canvas.height = H * dpr;
      this._ctx = this._canvas.getContext('2d');
      this._ctx.scale(dpr, dpr);
      this._ctx.textAlign = 'center';
      this._ctx.textBaseline = 'middle';
      card.appendChild(this._canvas);
      this._root.appendChild(style);
      this._root.appendChild(card);
    }

    _initStaticLayer() {
      const cfg = this._config;
      const W = LOGICAL_W;
      const H = cfg.height;
      const centerX = cfg.geometry.center_x;
      const centerY = cfg.geometry.center_y == null ? H / 2 : cfg.geometry.center_y;

      this._oCanvas = document.createElement('canvas');
      this._oCanvas.width = W;
      this._oCanvas.height = H;
      const o = this._oCanvas.getContext('2d');
      o.textAlign = 'center';
      o.textBaseline = 'middle';

      o.shadowBlur = 20;
      o.shadowColor = cfg.colors.needle_glow;
      const grad = o.createLinearGradient(95, 0, 190, 0);
      const stops = cfg.colors.needle;
      stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
      o.fillStyle = grad;
      o.beginPath();
      o.moveTo(190, centerY);
      o.lineTo(125, centerY - 4);
      o.lineTo(105, centerY - 10);
      o.lineTo(95, centerY);
      o.lineTo(105, centerY + 10);
      o.lineTo(125, centerY + 4);
      o.closePath();
      o.fill();

      o.shadowBlur = 0;
      o.beginPath();
      o.arc(centerX, centerY, 12, 0, Math.PI * 2);
      o.fillStyle = '#222';
      o.fill();
      o.beginPath();
      o.arc(centerX, centerY, 6, 0, Math.PI * 2);
      o.fillStyle = '#666';
      o.fill();

      o.fillStyle = cfg.colors.title;
      o.font = `bold ${cfg.geometry.title_font_size}px Arial`;
      o.fillText(cfg.title, W * 0.55 + 110, 60);

      o.fillStyle = cfg.colors.value;
      o.font = `bold ${cfg.geometry.unit_font_size}px Arial`;
      o.fillText(cfg.unit, W * 0.55 + 250, 190);

      this._vCanvas = document.createElement('canvas');
      this._vCanvas.width = W;
      this._vCanvas.height = H;
      this._vCtx = this._vCanvas.getContext('2d');
      this._vCtx.textAlign = 'center';
      this._vCtx.textBaseline = 'middle';
    }

    _updateValueLayer(valStr) {
      if (this._cachedValStr === valStr) return;
      this._cachedValStr = valStr;
      const cfg = this._config;
      this._vCtx.clearRect(0, 0, LOGICAL_W, cfg.height);
      this._vCtx.shadowBlur = 20;
      this._vCtx.shadowColor = cfg.colors.value_glow;
      this._vCtx.fillStyle = cfg.colors.value;
      this._vCtx.font = `bold ${cfg.geometry.value_font_size}px Arial`;
      this._vCtx.fillText(valStr, LOGICAL_W * 0.55 + 110, 190);
    }

    _draw(temp) {
      const ctx = this._ctx;
      const cfg = this._config;
      ctx.clearRect(0, 0, LOGICAL_W, cfg.height);
      ctx.fillStyle = cfg.colors.background;
      ctx.fillRect(0, 0, LOGICAL_W, cfg.height);

      let curStroke = '';
      let curFill = '';
      let curFont = '';
      const ticks = computeTicks(cfg, temp);
      for (const t of ticks) {
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        if (curStroke !== t.color) { ctx.strokeStyle = t.color; curStroke = t.color; }
        ctx.lineWidth = t.lineWidth;
        ctx.stroke();
        if (t.label != null) {
          const fontStr = `bold ${t.fontSize}px Arial`;
          if (curFill !== t.color) { ctx.fillStyle = t.color; curFill = t.color; }
          if (curFont !== fontStr) { ctx.font = fontStr; curFont = fontStr; }
          ctx.fillText(t.label, t.labelX, t.labelY);
        }
      }

      ctx.drawImage(this._oCanvas, 0, 0);
      this._updateValueLayer(Number(temp).toFixed(cfg.decimals));
      ctx.drawImage(this._vCanvas, 0, 0);
    }

    _loop() {
      const cfg = this._config;
      const diff = this._targetTemp - this._displayTemp;
      const moving = Math.abs(diff) > 0.005 || Math.abs(this._velocity) > 0.005;

      if (!cfg.animation.enabled) {
        if (this._displayTemp !== this._targetTemp || this._needsDraw) {
          this._displayTemp = this._targetTemp;
          this._draw(this._displayTemp);
          this._needsDraw = false;
        }
      } else if (moving || this._needsDraw) {
        const s = physicsStep(
          this._displayTemp, this._targetTemp, this._velocity,
          cfg.animation.stiffness, cfg.animation.damping
        );
        this._displayTemp = s.displayTemp;
        this._velocity = s.velocity;
        this._draw(this._displayTemp);
        this._needsDraw = false;
      }
      this._rafId = requestAnimationFrame(() => this._loop());
    }
  }

  customElements.define('jauge-vintage-card', JaugeVintageCard);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'jauge-vintage-card',
    name: 'Jauge Vintage',
    description: 'Animated TFT-style temperature gauge.',
  });
  console.info('%c JAUGE-VINTAGE-CARD %c v1.0.0 ',
    'color:white;background:#ff3300;font-weight:700',
    'color:#ff3300;background:#222');
}
