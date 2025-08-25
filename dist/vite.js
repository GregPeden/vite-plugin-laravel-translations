import { resolve as v, join as O, extname as b, sep as h } from "node:path";
import { readFileSync as A } from "node:fs";
import { globSync as V } from "glob";
import E from "php-parser";
const D = (t = "composer.json") => {
  try {
    const n = A(t, { encoding: "utf8" }), r = JSON.parse(n), [s] = r.require["laravel/framework"].split(".");
    return parseInt(s.replace(/\D/g, ""));
  } catch (n) {
    throw n;
  }
}, N = (t = 9) => t >= 9 ? v("lang/") : v("resources/lang");
var m, w;
function T() {
  if (w) return m;
  w = 1;
  const t = E;
  function n(e) {
    const i = new t({
      parser: {
        extractDoc: !1,
        suppressErrors: !0
      },
      ast: {
        withPositions: !0,
        withSource: !0
      }
    });
    e = e.trim(), e.substring(0, 5) !== "<?php" && (e = `<?php 
` + e);
    const l = i.parseCode(e);
    let a = {};
    return l.kind === "program" && l.children.forEach((o) => {
      o.kind === "expressionstatement" && o.expression.operator === "=" && o.expression.left.kind === "variable" && o.expression.right.kind === "array" ? a[o.expression.left.name] = r(o.expression.right) : o.kind === "expressionstatement" && o.expression.kind === "array" ? a = r(o.expression) : o.kind === "return" && o.expr.kind === "array" && (a = r(o.expr));
    }), a;
  }
  function r(e) {
    if (e !== null) {
      if (e.kind === "array") {
        if (e.items.length === 0)
          return [];
        const i = e.items.every(
          (a) => a === null || a.value === void 0 || a.key !== void 0 && a.key !== null
        );
        let l = e.items.map(r).filter((a) => a !== void 0);
        return i && (l = l.reduce((a, o) => Object.assign({}, a, o), {})), l;
      }
      if (e.kind === "entry")
        return e.key ? {
          [s(e.key)]: r(e.value)
        } : r(e.value);
      if (e.kind === "string") return e.value;
      if (e.kind === "number") return parseFloat(e.value);
      if (e.kind === "boolean") return e.value;
      if (e.kind === "nullkeyword" || e.kind === "identifier" && e.name.name === "null") return null;
      if (e.kind === "call") return e.loc?.source;
    }
  }
  function s(e) {
    switch (e.kind) {
      case "string":
        return e.value;
      case "number":
        return parseFloat(e.value);
      case "boolean":
        return e.value ? 1 : 0;
      default:
        return null;
    }
  }
  return m = { fromString: n }, m;
}
var $ = T();
const j = (t, n) => {
  const r = (s) => s && typeof s == "object";
  return !r(t) || !r(n) ? n : (Object.keys(n).forEach((s) => {
    const e = t[s], i = n[s];
    Array.isArray(e) && Array.isArray(i) ? t[s] = e.concat(i) : r(e) && r(i) ? t[s] = j(Object.assign({}, e), i) : t[s] = i;
  }), t);
}, k = (t) => t ? (Array.isArray(t) ? t : t.split(",")).map((r) => r.trim()).filter(Boolean).map((r) => r.replace(/\.(php|json)$/i, "")).map((r) => new RegExp(r)) : [], I = (t) => t ? "**/*.{json,php}" : "**/*.php", g = (t, n) => (n && n.length > 0 && t.splice(1, 0, n), t), x = async (t, n, r) => {
  if (t === ".php")
    return $.fromString(A(n, "utf8"));
  const s = `${process.cwd()}/${n}`, { default: e } = await import(s, { ...r && { with: { type: "json" } } });
  return e;
}, J = (t, n) => t.reverse().reduce((r, s) => ({ [s]: r }), n), F = (t, n) => {
  const r = `${n.prefix}$1${n.suffix}`, s = JSON.stringify(t).replace(/:(\w+)/g, r);
  return JSON.parse(s);
}, q = async (t, n) => {
  const r = n.absoluteLanguageDirectory || t, s = I(n.includeJson || !1);
  let e = V(O(r, s));
  const i = k(n.include), l = k(n.exclude);
  e = e.filter((p) => {
    const u = h, f = p.replace(r + u, ""), d = f.replace(b(f), "").split(u).join("/");
    return i.length ? i.some((c) => c.test(d)) : l.length ? !l.some((c) => c.test(d)) : !0;
  });
  const a = Promise.resolve({});
  return await e.reduce(async (p, u) => {
    const f = h, d = await p, c = u.replace(r + f, ""), y = b(c), R = c.replace(y, "").split(f), P = await _({
      file: u,
      fileExtension: y,
      pluginConfiguration: n
    }), S = g(R, n.namespace), L = J(S, P);
    return j(d, L);
  }, a);
}, _ = async ({ file: t, fileExtension: n, pluginConfiguration: r }) => {
  const s = await x(n, t, r.assertJsonImport);
  return r.interpolation?.prefix && r.interpolation?.suffix ? F(s, r.interpolation) : s;
};
async function H(t = {}) {
  const n = {
    namespace: !1,
    includeJson: !1,
    assertJsonImport: !1,
    absoluteLanguageDirectory: null,
    useGlobalVar: !1,
    include: void 0,
    exclude: void 0
  }, r = t.absoluteLanguageDirectory || N(D());
  return {
    // # Define: Plugin Name for Vite
    name: "laravelTranslations",
    // # Plugin: Configuration Hook (like construct)
    async config() {
      if (t = Object.assign({}, n, t), t.include && t.exclude)
        throw new Error('"include" and "exclude" options are mutually exclusive');
      return {
        define: {
          [t.useGlobalVar ? "LARAVEL_TRANSLATIONS" : "import.meta.env.VITE_LARAVEL_TRANSLATIONS"]: await q(r, t)
        }
      };
    },
    handleHotUpdate(s) {
      (t.includeJson ? /lang\/.*\.(?:php|json)$/ : /lang\/.*\.php$/).test(s.file) && s.server.restart();
    }
  };
}
export {
  H as default
};
