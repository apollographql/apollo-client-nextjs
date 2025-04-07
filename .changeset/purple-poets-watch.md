---
"@apollo/client-react-streaming": patch
"@apollo/client-integration-nextjs": patch
---

Fix dependencies to require React 19 and Next.js 15.
This should already have been part of the 0.12 release, but was forgotten.

- React 19 is required for the new mechanism behind `PreloadQuery`
- Next.js 15 is a consequence for that. As versions prior to `15.2.3` had a security vulnerability, we chose that as the minimal supported version.
