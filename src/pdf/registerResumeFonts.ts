import { Font } from '@react-pdf/renderer'
import { resolveAssetUrl } from '../utils/assetUrl'

let registered = false

/** Roboto (body) + Merriweather (display), served from /public/fonts. */
export function ensureResumePdfFonts() {
  if (registered) return

  Font.register({
    family: 'Roboto',
    fonts: [
      {
        src: resolveAssetUrl('fonts/roboto-latin-300-normal.woff'),
        fontWeight: 300,
      },
      {
        src: resolveAssetUrl('fonts/roboto-latin-400-normal.woff'),
        fontWeight: 400,
      },
      {
        src: resolveAssetUrl('fonts/roboto-latin-500-normal.woff'),
        fontWeight: 500,
      },
    ],
  })

  Font.register({
    family: 'Merriweather',
    fonts: [
      {
        src: resolveAssetUrl('fonts/merriweather-latin-400-normal.woff'),
        fontWeight: 400,
      },
      {
        src: resolveAssetUrl('fonts/merriweather-latin-500-normal.woff'),
        fontWeight: 500,
      },
    ],
  })

  registered = true
}
