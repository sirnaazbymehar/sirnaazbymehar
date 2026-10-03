import { useEffect } from 'react'

/** Sets the page title and meta description (SEO). In the Next.js version this becomes `generateMetadata`. */
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title
    if (description) {
      let m = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m) }
      m.content = description
      document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', title)
      document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description)
    }
  }, [title, description])
}
