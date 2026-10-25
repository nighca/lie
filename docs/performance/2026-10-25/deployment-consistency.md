# Cross-deployment consistency: explicit release limitation

Status: **same-build consistency verified; historical asset retention is not implemented or approved**. No production deployment was changed by this task.

Cloudflare documents that a Worker version captures its code, static assets and configuration. Its version-affinity example explicitly describes old HTML requesting a content-hashed asset from a version which does not contain that file, producing 404. Storage deduplication/reuse during asset upload does not mean the old URL remains in the new version's asset manifest.

- [Versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/)
- [Version affinity and static asset skew](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/version-affinity/)
- [Direct upload manifests](https://developers.cloudflare.com/workers/static-assets/direct-upload/)

Current builds contain only the current content-addressed resources. The real Vite mutation test rebuilds after changing one animation part: its directory hash, immutable manifest URL and entry JS hash change, and the previous part URL no longer exists in the resulting asset directory. The runtime missing-path contract proves a missing hash is a 404/no-store rather than immutable HTML200. This is safe failure, not continuity for an already-open old page.

An old legacy JS bundle can still read the unchanged `/appearances/manifest.json` shape and stable animation path. That compatibility does **not** cover newly introduced hash generations. After a later deployment changes a package, an open page holding the old manifest may still need an uncached old part; that lookup can fail. The optional portrait fallback may render a cached/static image, but is not evidence that an entire old session remains available.

The minimal proposed follow-up, without a new service or provider, is to retain verified immutable output artifacts from previously published releases and merge their `/static/` and `/assets/` trees into each subsequent build before `cf build`. The same URL must have the exact same bytes; reject collisions rather than overwrite. Never retain old entry HTML or mutable manifest as the current entry. Artifact provenance, retention duration, file-budget growth, clean rebuild/CI artifact availability, and cold old-manifest requests against the next build need an agreed release contract and a two-generation acceptance test. Merely keeping Git commits or Cloudflare old versions does not implement this output merge.

This proposal is not implemented. Root must decide the retention/publication policy before claiming cross-deployment session continuity. No storage, CDN product, service worker, version-routing header or account configuration was introduced.

## Narrow Worker routing cost

The actual pure asset-first plus two `_headers` rule experiment failed the missing-hash 404 contract under SPA fallback. The retained implementation therefore adds only `/static/*` and `/assets/*` to `runWorkerFirst` and sets immutable policy only after a successful non-HTML asset response. Requests to those namespaces invoke the existing Worker when they reach the network. Browser warm hits avoid the network; cold asset requests count as Worker requests. This is a material operating tradeoff, not a new provider deployment. [Cloudflare billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) documents this behavior.
