import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeReact from 'rehype-react'
import rehypeStarryNight from 'rehype-starry-night'
import * as jsxRuntime from 'react/jsx-runtime'

// Konstruerer kompilatoren som transformerer mdast -> hast -> jsx
export const contentCompiler = unified()
  .use(remarkParse) // Leser markdown til mdast
  .use(remarkRehype) // Konverterer mdast til hast (HTML AST)
  .use(rehypeStarryNight) // Legger til syntaksutheving for kodeblokker
  .use(rehypeReact, {
    Fragment: jsxRuntime.Fragment,
    jsx: jsxRuntime.jsx,
    jsxs: jsxRuntime.jsxs
  }) // Gjør det om til React-komponenter

// Herfra kan vi prosessere filer, sjekke overskriftshierarki (WCAG), eller generere llms.txt
