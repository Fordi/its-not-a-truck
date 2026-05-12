import { invert3, mul3 } from "./matrix.mjs";

// See: http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html, sRGB/D65
const D65 = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
];
D65.NORM = D65.map(row => row.reduce((s, v) => s + v, 0));
D65.INVERSE = invert3(D65);

export class Color {
  #hex = null;  // string #RRGGBB
  #sRGB = null; // [r, g, b] 8 bit
  #rgb = null;  // linear [r, g, b] 0..1
  #XYZ = null;  // [X, Y, Z]
  #xyz = null;  // [fx, fy, fz], normalized from D65
  #Lab = null;  // [L, a, b], unbounded, sRGB space is roughly L=0..100, a=-87..99, b=-108..95
  #hsl = null;  // [h, s, l], h = 0..360, s/l = 0..100;
  #HSV = null;  // [H, S, V], H = 0..360, S/V = 0..100;

  constructor(color) {
    if (typeof color === 'string') {
      this.#hex = color.startsWith('#') ? color : `#${color}`;
    } else if ('L' in color) {
      this.#Lab = Object.freeze([color.L, color.a, color.b]);
    } else if ('r' in color) {
      this.#sRGB = Object.freeze([color.r, color.g, color.b]);
    } else if ('lr' in color) {
      this.#rgb = Object.freeze([color.lr, color.lg, color.lb]);
    } else if ('X' in color) {
      this.#XYZ = Object.freeze([color.X, color.Y, color.Z]);
    } else if ('h' in color) {
      this.#hsl = Object.freeze([color.h, color.s, color.l]);
    } else if ('H' in color) {
      this.#HSV = Object.freeze([color.H, color.S, color.V]);
    } else {
      throw new Error(`Unrecognized color: ${JSON.stringify(color)}`);
    }
  }

  get XYZ() {
    if (!this.#XYZ) {
      if (this.#Lab || this.#xyz) {
        this.#XYZ = Object.freeze(this.xyz.map((t, i) => {
          const t3 = t ** 3;
          return D65.NORM[i] * (t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787);
        }));
      } else {
        this.#XYZ = Object.freeze(mul3(this.rgb, D65));
      }

    }
    return this.#XYZ;
  }

  get HSV() {
    if (!this.#HSV) {
      const [h, s, l] = this.hsl;
      const V = l + s * Math.min(l, 1 - l);
      const S = l === 1 ? 0 : s * (1 - l / V);
      this.#HSV = Object.freeze([h, S, V]);
    }
    return this.#HSV;
  }

  get hsl() {
    if (!this.#hsl) {
      const [r, g, b] = this.sRGB.map(v => v / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      const l = (max + min) / 2;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      const h = d === 0 ? 0 : (
        max === r ? ((g - b) / d + 6) % 6 :
          max === g ? ((b - r) / d + 2) :
            ((r - g) / d + 4)
      ) * 60;
      this.#hsl = Object.freeze([h, s, l]);
    }
    return this.#hsl.slice(0, 3);
  }

  get rgb() {
    if (!this.#rgb) {
      if (this.#Lab || this.#xyz || this.#XYZ) {
        this.#rgb = Object.freeze(mul3(this.XYZ, D65.INVERSE));
      } else {
        this.#rgb = Object.freeze(
          this.sRGB
            .map(c => c / 255)
            .map(c =>
              c <= 0.04045
                ? c / 12.92
                : (((c + 0.055) / 1.055) ** 2.4)
            )
        );
      }
    }
    return this.#rgb;
  }

  get sRGB() {
    if (!this.#sRGB) {
      if (this.#hex) {
        const digits = this.hex.slice(1);
        if (digits.length === 3) {
          this.#sRGB = Object.freeze([
            parseInt(digits[0], 16) * 0x11,
            parseInt(digits[1], 16) * 0x11,
            parseInt(digits[2], 16) * 0x11,
          ]);
        } else {
          this.#sRGB = Object.freeze([
            parseInt(digits.slice(0, 2), 16),
            parseInt(digits.slice(2, 4), 16),
            parseInt(digits.slice(4, 6), 16),
          ]);
        }
      } else if (this.#hsl || this.#HSV) {
        const [h, s, l] = this.hsl;
        const C = (1 - Math.abs(2 * l - 1)) * s;
        const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - C / 2;
        const i = Math.floor(h / 60) % 6;
        const [r1, g1, b1] = [
          [C, X, 0], [X, C, 0], [0, C, X],
          [0, X, C], [X, 0, C], [C, 0, X],
        ][i];
        this.#sRGB = Object.freeze([
          Math.round((r1 + m) * 255),
          Math.round((g1 + m) * 255),
          Math.round((b1 + m) * 255),
        ]);
      } else {
        this.#sRGB = Object.freeze(
          this.rgb.map(c =>
            c <= 0.0031308
              ? 12.92 * c
              : (1.055 * c ** (1 / 2.4) - 0.055)
          ).map(c => (c * 255) | 0)
        );
      }
    }
    return this.#sRGB;
  }

  get xyz() {
    if (!this.#xyz) {
      if (this.#Lab) {
        const [L, a, b] = this.#Lab;
        const y = (L + 16) / 116;
        this.#xyz = Object.freeze([a / 500 + y, y, y - b / 200]);
      } else {
        this.#xyz = this.XYZ.map((c, i) => {
          const t = c / D65.NORM[i];
          return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
        });
      }
    }
    return this.#xyz;
  }

  get Lab() {
    if (!this.#Lab) {
      if (this.#XYZ || this.#xyz || this.#rgb || this.#sRGB || this.#hex) {
        const [x, y, z] = this.xyz;
        return Object.freeze([
          116 * y - 16,  // L*: lightness
          500 * (x - y), // a*: red–green axis
          200 * (y - z), // b*: yellow–blue axis
        ]);
      }
    }
    return this.#Lab;
  }

  set Lab([L, a, b]) { this.#unset(); this.#Lab = Object.freeze([L, a, b]); }
  set XYZ([X, Y, Z]) { this.#unset(); this.#XYZ = Object.freeze([X, Y, Z]); }
  set sRGB([r, g, b]) { this.#unset(); this.#sRGB = Object.freeze([r, g, b]); }
  set rgb([r, g, b]) { this.#unset(); this.#rgb = Object.freeze([r, g, b]); }

  get hex() {
    if (!this.#hex) {
      this.#hex = '#' + this.sRGB.map(c => c.toString(16).padStart(2, '0')).join('');
    }
    return this.#hex;
  }

  set hex(v) { this.#unset(); this.#hex = v; }

  toString() { return this.hex; }

  #unset() {
    this.#hex = null;
    this.#Lab = null;
    this.#sRGB = null;
    this.#XYZ = null;
    this.#xyz = null;
    this.#rgb = null;
    this.#hsl = null;
    this.#HSV = null;
  }

  #set(origin, value, index) {
    const ret = [...origin];
    ret[index] = value;
    this.#unset();
    return Object.freeze(ret);
  }

  get R() { return this.sRGB[0]; }
  get G() { return this.sRGB[1]; }
  get B() { return this.sRGB[2]; }

  set R(v) { this.#sRGB = this.#set(this.#sRGB, v, 0); }
  set G(v) { this.#sRGB = this.#set(this.#sRGB, v, 1); }
  set B(v) { this.#sRGB = this.#set(this.#sRGB, v, 2); }

  get X() { return this.XYZ[0]; }
  get Y() { return this.XYZ[1]; }
  get Z() { return this.XYZ[2]; }

  set X(v) { this.#XYZ = this.#set(this.#XYZ, v, 0); }
  set Y(v) { this.#XYZ = this.#set(this.#XYZ, v, 1); }
  set Z(v) { this.#XYZ = this.#set(this.#XYZ, v, 2); }

  get x() { return this.xyz[0]; }
  get y() { return this.xyz[1]; }
  get z() { return this.xyz[2]; }

  set x(v) { this.#xyz = this.#set(this.#xyz, v, 0); }
  set y(v) { this.#xyz = this.#set(this.#xyz, v, 1); }
  set z(v) { this.#xyz = this.#set(this.#xyz, v, 2); }

  get L() { return this.Lab[0]; }
  get a() { return this.Lab[1]; }
  get b() { return this.Lab[2]; }

  set L(v) { this.#Lab = this.#set(this.#Lab, v, 0); }
  set a(v) { this.#Lab = this.#set(this.#Lab, v, 1); }
  set b(v) { this.#Lab = this.#set(this.#Lab, v, 2); }

  get lr() { return this.rgb[0]; }
  get lg() { return this.rgb[1]; }
  get lb() { return this.rgb[2]; }

  set lr(v) { this.#rgb = this.#set(this.#rgb, v, 0); }
  set lg(v) { this.#rgb = this.#set(this.#rgb, v, 1); }
  set lb(v) { this.#rgb = this.#set(this.#rgb, v, 2); }

  get h() { return this.hsl[0]; }
  get s() { return this.hsl[1]; }
  get l() { return this.hsl[2]; }

  set h(v) { this.#hsl = this.#set(this.#hsl, v, 0); }
  set s(v) { this.#hsl = this.#set(this.#hsl, v, 1); }
  set l(v) { this.#hsl = this.#set(this.#hsl, v, 2); }

  get H() { return this.HSV[0]; }
  get S() { return this.HSV[1]; }
  get V() { return this.HSV[2]; }

  set H(v) { this.#HSV = this.#set(this.#HSV, v, 0); }
  set S(v) { this.#HSV = this.#set(this.#HSV, v, 1); }
  set V(v) { this.#HSV = this.#set(this.#HSV, v, 2); }

  static normalize(color) {
    if (color instanceof Color) return color;
    return new Color(color);
  }
  static XYZ(X, Y, Z) { return new Color({ X, Y, Z }); }
  static sRGB(r, g, b) { return new Color({ r, g, b }); }
  static Lab(L, a, b) { return new Color({ L, a, b }); }
  static linearRgb(lr, lg, lb) { return new Color({ lr, lg, lb }); }
  static hex(s) { return new Color(s); }
  static hsl(h, s, l) { return new Color({ h, s, l }); }
  static HSV(H, S, V) { return new Color({ H, S, V }); }
}
