'use client'
// import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { ArrowRight, Brain, Check, ChevronDown, Clock, Menu, Send, Wand2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams, usePathname, useRouter } from 'next/navigation'

const locales = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' }
]
const validLocales = locales.map(l => l.code)

export default function Page () {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  let locale = typeof params.locale === 'string' ? params.locale : Array.isArray(params.locale) ? params.locale[0] : 'es'
  if (!validLocales.includes(locale)) {
    locale = 'es' // o el idioma por defecto que prefieras
  }
  // Elimina el locale actual del pathname para construir la nueva ruta
  const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '')
  const t = useTranslations()
  return (
    <>
      {/* <!-- Top Navigation --> */}
      <header className="w-full backdrop-blur supports-backdrop-blur:bg-primary/80 bg-primary/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href={`/${locale}/dashboard`} className="text-lg font-semibold tracking-tight flex flex-1 items-center space-x-1">
            <span className="border border-neutral-700 rounded-md px-2 py-0.5">DR</span>
            <span className="sr-only">Dreamscape</span>
          </a>

          <nav className="hidden md:flex items-center space-x-8 text-sm">
            <a href="#features" className="hover:text-white transition-colors">{t('features')}</a>
            <a href="#science" className="hover:text-white transition-colors">{t('science')}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t('pricing')}</a>
            <a href="#faq" className="hover:text-white transition-colors">{t('faq')}</a>
          </nav>

          <div className="flex flex-1 justify-end items-center space-x-4">
            {/* ...tu header y contenido... */}
            <div className="">
              <Select value={locale} onValueChange={value => {
                router.push(`/${value}${pathWithoutLocale}`)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SignedIn>
              <a href={`/${locale}/dashboard`} className="hidden sm:inline-block text-xs font-medium px-4 py-2 rounded-md transition-all">Chat</a>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <a href={`/${locale}/dashboard`} className="hidden sm:inline-block text-xs font-medium px-4 py-2 rounded-md ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">{t('login')}</a>
              <a href={`/${locale}/dashboard`} className="text-xs font-medium px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">{t('getStarted')}</a>
            </SignedOut>

            {/* <!-- Mobile Menu --> */}
            <button id="menuBtn" className="md:hidden p-2 rounded-md ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">
              <Menu className="w-5 h-5 stroke-neutral-200" />
            </button>
          </div>
        </div>

        {/* <!-- Mobile Menu Panel --> */}
        <div id="mobileMenu" className="hidden md:hidden bg-neutral-900 border-t border-neutral-800">
          <nav className="flex flex-col px-6 py-4 space-y-3 text-sm">
            <a href="#features" className="hover:text-white transition-colors">{t('features')}</a>
            <a href="#science" className="hover:text-white transition-colors">{t('science')}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t('pricing')}</a>
            <a href="#faq" className="hover:text-white transition-colors">{t('faq')}</a>
            <a href="#" className="text-xs font-medium mt-4 px-4 py-2 rounded-md ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all text-center">{t('login')}</a>
          </nav>
        </div>
      </header>

      {/* <!-- Hero --> */}
      <section className="relative overflow-hidden bg-primary/90">
        {/* <!-- Graphic with fluorescent animated border --> */}
        <video src="/video.mp4" autoPlay loop muted className="absolute inset-0 w-full h-full object-none -z-10"></video>

        <div className="max-w-3xl mx-auto px-6 lg:px-0 py-28 md:py-40 text-center">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">{t('unlockLanguage')}</h1>
          <p className="text-neutral-400 max-w-xl mx-auto mb-10">{t('exploreSubconscious')}</p>
          <a href={`/${locale}/dashboard`} className="inline-flex items-center text-sm font-medium px-6 py-3 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">
            {t('startInterpreting')}
            <ArrowRight className="w-4 h-4 stroke-2 ml-2" />
          </a>
        </div>
      </section>

      {/* <!-- Chat-like Prompt --> */}
      <section id="chat" className="max-w-3xl mx-auto px-6 lg:px-0 mt-20">
        <h2 className="hidden text-2xl md:text-3xl font-semibold tracking-tight mb-6">{t('askAboutDream')}</h2>

        {/* <!-- Chat Container --> */}
        <div className="space-y-4 mb-6"></div>

        {/* <!-- Input --> */}
        <form className="sticky bottom-6">
          <div className="flex items-center bg-secondary ring-1 ring-neutral-700 rounded-lg px-4 py-3">
            <input type="text" placeholder={t('describeDream')} className="flex-grow bg-transparent outline-none text-sm placeholder-neutral-500"></input>
            <button type="submit" className="ml-4 p-2 rounded-md hover:bg-neutral-700/60 transition-colors">
              <Send className="w-5 h-5 stroke-neutral-200" />
            </button>
          </div>
        </form>
      </section>

      {/* <!-- Features --> */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 mt-32">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-14">{t('builtForInsight')}</h2>
        <div className="grid md:grid-cols-3 gap-10">

          {/* <!-- Feature --> */}
          <div className="bg-[#734611] p-6 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">
            <div className="mb-4 p-2 rounded-md ring-neutral-700 inline-block">
              <Brain className="w-5 h-5 stroke-neutral-200" />
            </div>
            <h3 className="font-medium mb-2">{t('evidenceBased')}</h3>
            <p className="text-sm text-neutral-400">{t('evidenceBasedDesc')}</p>
          </div>

          <div className="bg-[#4f46e5] p-6 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">
            <div className="mb-4 p-2 rounded-md ring-neutral-700 inline-block">
              <Wand2 className="w-5 h-5 stroke-neutral-200" />
            </div>
            <h3 className="font-medium mb-2">{t('aiEnhanced')}</h3>
            <p className="text-sm text-neutral-400">{t('aiEnhancedDesc')}</p>
          </div>

          <div className="bg-[#6d132d] p-6 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">
            <div className="mb-4 p-2 rounded-md ring-neutral-700 inline-block">
              <Clock className="w-5 h-5 stroke-neutral-200" />
            </div>
            <h3 className="font-medium mb-2">{t('instantInsights')}</h3>
            <p className="text-sm text-neutral-400">{t('instantInsightsDesc')}</p>
          </div>
        </div>
      </section>

      {/* <!-- Science --> */}
      <section id="science" className="max-w-5xl mx-auto px-6 lg:px-0 mt-32">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">{t('whyDreamsMatter')}</h2>
        <p className="text-neutral-400 mb-4">{t('whyDreamsMatterDesc1')}</p>
        <p className="text-neutral-400">{t('whyDreamsMatterDesc2')}</p>
      </section>

      {/* <!-- Pricing --> */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-8 mt-32">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-14">{t('simplePricing')}</h2>

        <div className="grid md:grid-cols-3 gap-8">

          {/* <!-- Tier --> */}
          <div className="flex flex-col bg-neutral-800/60 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all p-8">
            <h3 className="font-medium mb-1">{t('free')}</h3>
            <p className="text-neutral-400 text-sm mb-6">{t('freeDesc')}</p>
            <p className="text-3xl font-semibold mb-6">0<span className="text-base font-medium">{t('mo')}</span></p>
            <ul className="space-y-3 text-sm flex-1">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>{t('interpretationsPerWeek')}</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>{t('basicSymbolLookup')}</span></li>
            </ul>
            <a href={`/${locale}/dashboard`} className="mt-8 text-sm font-medium text-center px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">{t('getStarted')}</a>
          </div>

          <div className="flex flex-col bg-neutral-800/60 rounded-lg ring-1 ring-indigo-600 hover:ring-indigo-400 transition-all p-8">
            <h3 className="font-medium mb-1">{t('pro')}</h3>
            <p className="text-neutral-400 text-sm mb-6">{t('proDesc')}</p>
            <p className="text-3xl font-semibold mb-6">$9<span className="text-base font-medium">{t('mo')}</span></p>
            <ul className="space-y-3 text-sm flex-1">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>{t('unlimitedInterpretations')}</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>{t('personalDiary')}</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>{t('emailSummaries')}</span></li>
            </ul>
            <a href="#" className="mt-8 text-sm font-medium text-center px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">{t('upgrade')}</a>
          </div>

          <div className="flex flex-col bg-neutral-800/60 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all p-8">
            <h3 className="font-medium mb-1">{t('studio')}</h3>
            <p className="text-neutral-400 text-sm mb-6">{t('studioDesc')}</p>
            <p className="text-3xl font-semibold mb-6">$29<span className="text-base font-medium">{t('mo')}</span></p>
            <ul className="space-y-3 text-sm flex-1">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>{t('sessionReports')}</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>{t('collaborationTools')}</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>{t('earlyAccess')}</span></li>
            </ul>
            <a href="#" className="mt-8 text-sm font-medium text-center px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">{t('contactSales')}</a>
          </div>
        </div>
      </section>

      {/* <!-- FAQ --> */}
      <section id="faq" className="max-w-5xl mx-auto px-6 lg:px-0 mt-32 mb-40">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">{t('frequentlyAsked')}</h2>
        <div className="space-y-8">

          <details className="group ring-1 ring-neutral-700 rounded-lg p-6 hover:ring-neutral-500 transition-all">
            <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-neutral-200">
              {t('howAccurate')}
              <ChevronDown className="w-4 h-4 stroke-neutral-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-4 text-sm text-neutral-400">{t('howAccurateDesc')}</p>
          </details>

          <details className="group ring-1 ring-neutral-700 rounded-lg p-6 hover:ring-neutral-500 transition-all">
            <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-neutral-200">
              {t('shareWithTherapist')}
              <ChevronDown className="w-4 h-4 stroke-neutral-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-4 text-sm text-neutral-400">{t('shareWithTherapistDesc')}</p>
          </details>

          <details className="group ring-1 ring-neutral-700 rounded-lg p-6 hover:ring-neutral-500 transition-all">
            <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-neutral-200">
              {t('isDataPrivate')}
              <ChevronDown className="w-4 h-4 stroke-neutral-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-4 text-sm text-neutral-400">{t('isDataPrivateDesc')}</p>
          </details>

        </div>
      </section>

      {/* <!-- Footer --> */}
      <footer className="border-t border-neutral-800 py-10 text-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <p className="text-neutral-500">© 2024 Dreamscape. {t('allRightsReserved')}</p>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-neutral-300 transition-colors">{t('terms')}</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">{t('privacy')}</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">{t('contact')}</a>
          </div>
        </div>
      </footer>
    </>
  )
}
