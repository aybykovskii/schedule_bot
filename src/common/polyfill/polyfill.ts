import { fetch as undiciFetch } from 'undici'

if (!global.fetch) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ;(global.fetch as any) = undiciFetch
}
