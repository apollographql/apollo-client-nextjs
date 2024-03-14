import { unified } from "unified";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

import { cd, glob, fs } from "zx";

cd(import.meta.dirname);
cd("../docs");
const files = await glob("**/*.md");
for (const file of files) {
  const processed = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(fs.readFileSync(file, "utf-8"));

  const target = file.replace(/\.md$/, ".html");
  await fs.writeFile(target, processed.toString());
  console.log(`
Compiled ${file} 
      -> ${target}`);
}
