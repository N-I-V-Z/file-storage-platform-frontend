# Search and sharing metadata

The public landing page (`/`) is the only URL in `sitemap.xml`. It has a canonical URL, Vietnamese title and description, Open Graph/Twitter metadata, and a generated 1200×630 preview at `/og`. The brand SVG replaces the starter favicon.

Login, registration, dashboard, and admin pages declare `noindex, nofollow`. `robots.txt` allows crawlers to fetch these pages so they can read their `noindex` tags; it lists the sitemap. This does not make private data public: authorization remains the API's responsibility.

Before production deployment, set `NEXT_PUBLIC_APP_URL` to the exact public HTTPS origin (for example `https://storage.example.com`) and rebuild. The canonical URL, `og:url`, social image URL, `robots.txt`, and sitemap are generated from that value. For staging, protect the environment or add a deployment-level `noindex` policy so the public landing page is not indexed there.

After deployment, check the real page source for a single title, description, canonical, and matching `og:url`. Fetch `/robots.txt`, `/sitemap.xml`, `/og`, and `/icon.svg` from the public domain, then inspect the deployed URL with a search engine URL inspection tool and a social preview debugger. A local build cannot validate external crawler access.
