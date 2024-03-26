import { hydrateRoot } from "react-dom/client";

// prettier-ignore
/** React completeSegment function */
// @ts-expect-error This is React code.
export function $RS(a, b) { a = document.getElementById(a); b = document.getElementById(b); for (a.parentNode.removeChild(a); a.firstChild;)b.parentNode.insertBefore(a.firstChild, b); b.parentNode.removeChild(b) }
// prettier-ignore
/** React completeBoundary function */
// @ts-expect-error This is React code.
// eslint-disable-next-line no-var
export function $RC(b, c, e = undefined) { c = document.getElementById(c); c.parentNode.removeChild(c); var a = document.getElementById(b); if (a) { b = a.previousSibling; if (e) b.data = "$!", a.setAttribute("data-dgst", e); else { e = b.parentNode; a = b.nextSibling; var f = 0; do { if (a && 8 === a.nodeType) { var d = a.data; if ("/$" === d) if (0 === f) break; else f--; else "$" !== d && "$?" !== d && "$!" !== d || f++ } d = a.nextSibling; e.removeChild(a); a = d } while (a); for (; c.firstChild;)e.insertBefore(c.firstChild, a); b.data = "$" } b._reactRetry && b._reactRetry() } }

export function hydrateBody(
  initialChildren: Parameters<typeof hydrateRoot>[1],
  options?: Parameters<typeof hydrateRoot>[2]
) {
  return hydrateRoot(document.body, initialChildren, options);
}

export function setBody(html: TemplateStringsArray) {
  if (html.length !== 1)
    throw new Error("Expected exactly one template string");
  document.body.innerHTML = html[0];
}

export function appendToBody(html: TemplateStringsArray) {
  if (html.length !== 1)
    throw new Error("Expected exactly one template string");
  document.body.insertAdjacentHTML("beforeend", html[0]);
}
