import { useEffect, useState } from 'react'

const COOKIE_CONSENT_NAME = 'cookieConsent'
const VISIT_COUNT_NAME = 'visitCount'
const ONE_YEAR = 60 * 60 * 24 * 365

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : undefined
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = getCookie(COOKIE_CONSENT_NAME)
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const accept = () => {
    document.cookie = `${COOKIE_CONSENT_NAME}=true; path=/; max-age=${ONE_YEAR}`
    document.cookie = `${VISIT_COUNT_NAME}=1; path=/; max-age=${ONE_YEAR}`
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>We use cookies to improve your experience.</p>
        <button
          onClick={accept}
          className="bg-[#13B87B] hover:bg-[#0FA66A] text-white px-4 py-2 rounded"
        >
          Accept
        </button>
      </div>
    </div>
  )
}

export default CookieConsent
