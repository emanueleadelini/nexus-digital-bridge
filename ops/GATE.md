# GATE - Nexus Digital Bridge

## Commands

- install: `npm ci`
- typecheck: `npm run typecheck`
- lint: `npm run lint`
- test: `npm run test` (da introdurre; oggi copertura via smoke E2E)
- build: `npm run build`
- smoke: `curl -fsS http://127.0.0.1:8812/ >/dev/null && curl -fsSI https://nexusdigitalbridge.it >/dev/null`
- health: `curl -fsS http://127.0.0.1:8812/api/health`

No `demo-ready` or `sell-ready` without evidence in `/root/manuali`.
