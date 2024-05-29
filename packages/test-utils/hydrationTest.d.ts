/** React completeSegment function */
export function $RS(a: any, b: any): void;
/** React completeBoundary function */
export function $RC(b: any, c: any, e?: any): void;
/**
 *
 * @param {Parameters<typeof hydrateRoot>[1]} initialChildren
 * @param {Parameters<typeof hydrateRoot>[2]} [options]
 */
export function hydrateBody(initialChildren: [container: Element | Document, initialChildren: import("react").ReactNode, options?: import("react-dom/client").HydrationOptions][1], options?: [container: Element | Document, initialChildren: import("react").ReactNode, options?: import("react-dom/client").HydrationOptions][2]): import("react-dom/client").Root;
/**
 * @param {TemplateStringsArray} html
 */
export function setBody(html: TemplateStringsArray): void;
/**
 * @param {TemplateStringsArray} html
 */
export function appendToBody(html: TemplateStringsArray): void;
