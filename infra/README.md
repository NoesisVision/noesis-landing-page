# Hosting settings (AWS)

noesis.vision is an S3 bucket with static website hosting, behind a CloudFront distribution that also answers for `www.noesis.vision`. DNS is in Route 53. The deploy workflow (`.github/workflows/deploy-prod.yml`) only uploads files. The two settings below are made once, in the AWS console.

## 1. Redirect www to noesis.vision (301)

`redirect-www.js` is a CloudFront Function that answers `www.noesis.vision/…` with a permanent redirect to `https://noesis.vision/…`, keeping the path and query.

1. CloudFront → **Functions** → **Create function**: name `redirect-www`, runtime **cloudfront-js-2.0**.
2. Paste the contents of `redirect-www.js`, **Save changes**, then **Publish**.
3. Optional: on the **Test** tab, use event type _Viewer request_, URL `/services/`, header `host: www.noesis.vision`. Expect status 301 with `location: https://noesis.vision/services/`.
4. CloudFront → **Distributions** → the noesis.vision distribution → **Behaviors** → the default behavior → **Edit** → **Function associations** → **Viewer request**: _CloudFront Functions_, `redirect-www` → **Save**.
5. After the deploy finishes (a few minutes), check:
   ```sh
   curl -sI https://www.noesis.vision/services/ | grep -iE "^HTTP|location"
   # HTTP/2 301
   # location: https://noesis.vision/services/
   ```

A behavior has only one viewer-request function. If one is already attached, add the `www.` check to that function instead.

Until this is attached, a small script at the top of every page (`src/layouts/Base.astro`) sends `www.` visitors to noesis.vision in the browser. Search engines handle that less well than a 301, so the function is still worth adding.

## 2. Show the 404 page for missing pages

The site has a `404.html` (`src/pages/404.astro`). The old site answered missing pages with the home page instead.

1. S3 → the website bucket → **Properties** → **Static website hosting** → **Edit** → **Error document**: `404.html` → **Save**.
2. CloudFront → the distribution → **Error pages**: if a custom error response sends 403/404 to `/index.html`, change its response page path to `/404.html` and keep the response code **404** (or delete the rule, because S3 handles it now).
3. Check:
   ```sh
   curl -s -o /dev/null -w "%{http_code}\n" https://noesis.vision/no-such-page/   # 404
   curl -s https://noesis.vision/no-such-page/ | grep -o "<title>[^<]*"          # Page not found | Noesis Vision
   ```
