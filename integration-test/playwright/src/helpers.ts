export function matchesTag(tag: string) {
  const grep = JSON.parse(process.env.GREP || "null");
  return grep && new RegExp(grep).test(tag);
}
