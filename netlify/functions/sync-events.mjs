3:26:13 AM: Netlify Build                                                 
3:26:13 AM: ────────────────────────────────────────────────────────────────
3:26:13 AM: ​
3:26:13 AM: ❯ Version
3:26:13 AM:   @netlify/build 35.7.1
3:26:13 AM: ​
3:26:13 AM: ❯ Flags
3:26:13 AM:   accountId: 699421d1b5b0eb525c9eb182
3:26:13 AM:   baseRelDir: true
3:26:13 AM:   buildId: 6994342db23e560008d9410a
3:26:13 AM:   deployId: 6994342db23e560008d9410c
3:26:13 AM: ​
3:26:13 AM: ❯ Current directory
3:26:13 AM:   /opt/build/repo
3:26:13 AM: ​
3:26:13 AM: ❯ Config file
3:26:13 AM:   /opt/build/repo/netlify.toml
3:26:13 AM: ​
3:26:13 AM: ❯ Context
3:26:13 AM:   production
3:26:13 AM: ​
3:26:13 AM: Build command from Netlify app                                
3:26:13 AM: ────────────────────────────────────────────────────────────────
3:26:13 AM: ​
3:26:13 AM: $ npm install
3:26:14 AM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)
3:26:14 AM: up to date, audited 24 packages in 387ms
3:26:14 AM: 17 packages are looking for funding
3:26:14 AM:   run `npm fund` for details
3:26:14 AM: found 0 vulnerabilities
3:26:14 AM: ​
3:26:14 AM: (build.command completed in 472ms)
3:26:14 AM: ​
3:26:14 AM: Functions bundling                                            
3:26:14 AM: ────────────────────────────────────────────────────────────────
3:26:14 AM: ​
3:26:14 AM: Packaging Functions from netlify/functions directory:
3:26:14 AM:  - events.mjs
3:26:14 AM:  - sync-events.mjs
3:26:14 AM: ​
3:26:14 AM: ✘ [ERROR] Unexpected end of file
3:26:14 AM:     netlify/functions/sync-events.mjs:53:0:
3:26:14 AM:       53 │
3:26:14 AM:          ╵ ^
3:26:14 AM: ​
3:26:14 AM: Bundling of function "sync-events" failed                     
3:26:14 AM: ────────────────────────────────────────────────────────────────
3:26:14 AM: ​
3:26:14 AM:   Error message
3:26:14 AM:   Build failed with 1 error:
3:26:14 AM:   netlify/functions/sync-events.mjs:53:0: ERROR: Unexpected end of file
3:26:14 AM: ​
3:26:14 AM:   Error location
3:26:14 AM:   While bundling function "sync-events"
3:26:14 AM: ​
3:26:14 AM:   Resolved config
3:26:14 AM:   build:
3:26:14 AM:     command: npm install
3:26:14 AM:     commandOrigin: ui
3:26:14 AM:     publish: /opt/build/repo
3:26:14 AM:     publishOrigin: config
3:26:14 AM:   functionsDirectory: /opt/build/repo/netlify/functions
3:26:14 AM:   redirects:
3:26:14 AM:     - from: /api/*
      status: 200
      to: /.netlify/functions/:splat
  redirectsOrigin: config
3:26:14 AM: Build failed due to a user error: Build script returned non-zero exit code: 2
3:26:14 AM: Failing build: Failed to build site
3:26:14 AM: Finished processing build request in 8.716s
