'use client'
// import Link from 'next/link'
import { ArrowRight, Brain, Check, ChevronDown, Clock, Menu, Send, Wand2 } from 'lucide-react'
import { useParams, usePathname } from 'next/navigation'

const locales = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' }
]
const validLocales = locales.map(l => l.code)

export default function Page () {
  const pathname = usePathname()
  const params = useParams()
  let locale = typeof params.locale === 'string' ? params.locale : Array.isArray(params.locale) ? params.locale[0] : 'es'
  if (!validLocales.includes(locale)) {
    locale = 'es' // o el idioma por defecto que prefieras
  }
  console.log('🚀 ~ Page ~ locale:', locale)
  // Elimina el locale actual del pathname para construir la nueva ruta
  const pathWithoutLocale = pathname.replace(/^\/(es|en)/, '')
  return (
    <>
      {/* <!-- Top Navigation --> */}
      <header className="w-full backdrop-blur supports-backdrop-blur:bg-neutral-800/60 bg-neutral-900/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href={`/${locale}/dashboard`} className="text-lg font-semibold tracking-tight flex items-center space-x-1">
            <span className="border border-neutral-700 rounded-md px-2 py-0.5">DR</span>
            <span className="sr-only">Dreamscape</span>
          </a>

          <nav className="hidden md:flex items-center space-x-8 text-sm">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#science" className="hover:text-white transition-colors">Science</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-4">
            <a href={`/${locale}/dashboard`} className="hidden sm:inline-block text-xs font-medium px-4 py-2 rounded-md ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">Log in</a>
            <a href={`/${locale}/dashboard`} className="text-xs font-medium px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">Get Started</a>

            {/* <!-- Mobile Menu --> */}
            <button id="menuBtn" className="md:hidden p-2 rounded-md ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">
              <Menu className="w-5 h-5 stroke-neutral-200" />
            </button>
          </div>
        </div>

        {/* <!-- Mobile Menu Panel --> */}
        <div id="mobileMenu" className="hidden md:hidden bg-neutral-900 border-t border-neutral-800">
          <nav className="flex flex-col px-6 py-4 space-y-3 text-sm">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#science" className="hover:text-white transition-colors">Science</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#" className="text-xs font-medium mt-4 px-4 py-2 rounded-md ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all text-center">Log in</a>
          </nav>
        </div>
        {/* ...tu header y contenido... */}
        <div className="absolute top-4 right-4 z-50">
          <select
            className="bg-neutral-800 text-white border border-neutral-700 rounded px-2 py-1"
            onChange={e => {
              window.location.pathname = `/${e.target.value}${pathWithoutLocale}`
            }}
            defaultValue={pathname.split('/')[1]}
          >
            {locales.map(locale => (
              <option key={locale.code} value={locale.code}>
                {locale.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* <!-- Hero --> */}
      <section className="relative overflow-hidden" style={{ backgroundColor: 'rgb(23 23 23 / 95%)' }}>
        {/* <!-- Graphic with fluorescent animated border --> */}
        <video src="./Generated File August 16, 2025 - 2_18AM.mp4" autoPlay loop muted className="absolute inset-0 w-full h-full object-none -z-10"></video>

        <div className="max-w-3xl mx-auto px-6 lg:px-0 py-28 md:py-40 text-center">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">Unlock the Language of Dreams</h1>
          <p className="text-neutral-400 max-w-xl mx-auto mb-10">Explore what your subconscious is trying to tell you. Harness cutting-edge psychology and AI to decode nightly narratives.</p>
          <a href={`/${locale}/dashboard`} className="inline-flex items-center text-sm font-medium px-6 py-3 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">
            Start Interpreting
            <ArrowRight className="w-4 h-4 stroke-2 ml-2" />
          </a>
        </div>
      </section>

      {/* <!-- Chat-like Prompt --> */}
      <section id="chat" className="max-w-3xl mx-auto px-6 lg:px-0 mt-20">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Ask About Your Dream</h2>

        {/* <!-- Chat Container --> */}
        <div className="space-y-4 mb-6"></div>

        {/* <!-- Input --> */}
        <form className="sticky bottom-6">
          <div className="flex items-center bg-neutral-800/60 ring-1 ring-neutral-700 rounded-lg px-4 py-3">
            <input type="text" placeholder="Describe your dream…" className="flex-grow bg-transparent outline-none text-sm placeholder-neutral-500"></input>
            <button type="submit" className="ml-4 p-2 rounded-md hover:bg-neutral-700/60 transition-colors">
              <Send className="w-5 h-5 stroke-neutral-200" />
            </button>
          </div>
        </form>
      </section>

      {/* <!-- Features --> */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 mt-32">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-14">Built for Deeper Insight</h2>
        <div className="grid md:grid-cols-3 gap-10">

          {/* <!-- Feature --> */}
          <div className="bg-neutral-800/60 p-6 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">
            <div className="mb-4 p-2 rounded-md ring-1 ring-neutral-700 inline-block">
              <Brain className="w-5 h-5 stroke-neutral-200" />
            </div>
            <h3 className="font-medium mb-2">Evidence-Based Analysis</h3>
            <p className="text-sm text-neutral-400">Grounded in peer-reviewed research from cognitive psychology and dream studies.</p>
          </div>

          <div className="bg-neutral-800/60 p-6 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">
            <div className="mb-4 p-2 rounded-md ring-1 ring-neutral-700 inline-block">
              <Wand2 className="w-5 h-5 stroke-neutral-200" />
            </div>
            <h3 className="font-medium mb-2">AI-Enhanced Suggestions</h3>
            <p className="text-sm text-neutral-400">Advanced language models surface the most relevant symbols and themes.</p>
          </div>

          <div className="bg-neutral-800/60 p-6 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all">
            <div className="mb-4 p-2 rounded-md ring-1 ring-neutral-700 inline-block">
              <Clock className="w-5 h-5 stroke-neutral-200" />
            </div>
            <h3 className="font-medium mb-2">Instant Insights</h3>
            <p className="text-sm text-neutral-400">Receive interpretations in seconds, anytime you wake up with questions.</p>
          </div>
        </div>
      </section>

      {/* <!-- Science --> */}
      <section id="science" className="max-w-5xl mx-auto px-6 lg:px-0 mt-32">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Why Dreams Matter</h2>
        <p className="text-neutral-400 mb-4">Dreams offer a window into our unconscious motivations, fears, and desires. Modern psychology suggests that nightly narratives help us process emotions, consolidate memories, and simulate future scenarios.</p>
        <p className="text-neutral-400">By understanding the symbols and emotions present, we gain clarity and unlock personal growth—turning rest into revelation.</p>
      </section>

      {/* <!-- Pricing --> */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-8 mt-32">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center mb-14">Simple Pricing</h2>

        <div className="grid md:grid-cols-3 gap-8">

          {/* <!-- Tier --> */}
          <div className="flex flex-col bg-neutral-800/60 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all p-8">
            <h3 className="font-medium mb-1">Free</h3>
            <p className="text-neutral-400 text-sm mb-6">Great for casual explorers</p>
            <p className="text-3xl font-semibold mb-6">0<span className="text-base font-medium">/mo</span></p>
            <ul className="space-y-3 text-sm flex-1">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>3 interpretations / week</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>Basic symbol lookup</span></li>
            </ul>
            <a href={`/${locale}/dashboard`} className="mt-8 text-sm font-medium text-center px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">Get Started</a>
          </div>

          <div className="flex flex-col bg-neutral-800/60 rounded-lg ring-1 ring-indigo-600 hover:ring-indigo-400 transition-all p-8">
            <h3 className="font-medium mb-1">Pro</h3>
            <p className="text-neutral-400 text-sm mb-6">For avid dreamers</p>
            <p className="text-3xl font-semibold mb-6">$9<span className="text-base font-medium">/mo</span></p>
            <ul className="space-y-3 text-sm flex-1">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>Unlimited interpretations</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>Personal insights diary</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>Email summaries</span></li>
            </ul>
            <a href="#" className="mt-8 text-sm font-medium text-center px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">Upgrade</a>
          </div>

          <div className="flex flex-col bg-neutral-800/60 rounded-lg ring-1 ring-neutral-700 hover:ring-neutral-500 transition-all p-8">
            <h3 className="font-medium mb-1">Studio</h3>
            <p className="text-neutral-400 text-sm mb-6">For therapists &amp; researchers</p>
            <p className="text-3xl font-semibold mb-6">$29<span className="text-base font-medium">/mo</span></p>
            <ul className="space-y-3 text-sm flex-1">
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>Session reports</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>Collaboration tools</span></li>
              <li className="flex items-center space-x-2"><Check className="w-4 h-4 stroke-neutral-200" /><span>Early access to beta features</span></li>
            </ul>
            <a href="#" className="mt-8 text-sm font-medium text-center px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* <!-- FAQ --> */}
      <section id="faq" className="max-w-5xl mx-auto px-6 lg:px-0 mt-32 mb-40">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Frequently Asked Questions</h2>
        <div className="space-y-8">

          <details className="group ring-1 ring-neutral-700 rounded-lg p-6 hover:ring-neutral-500 transition-all">
            <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-neutral-200">
              How accurate are the interpretations?
              <ChevronDown className="w-4 h-4 stroke-neutral-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-4 text-sm text-neutral-400">Interpretations are generated using empirical research and machine-learning insights, but personal context always matters. Use results as guidance rather than absolute truths.</p>
          </details>

          <details className="group ring-1 ring-neutral-700 rounded-lg p-6 hover:ring-neutral-500 transition-all">
            <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-neutral-200">
              Can I share my insights with a therapist?
              <ChevronDown className="w-4 h-4 stroke-neutral-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-4 text-sm text-neutral-400">Yes, you can export any dream session as a PDF or secure link to share with your therapist or support group.</p>
          </details>

          <details className="group ring-1 ring-neutral-700 rounded-lg p-6 hover:ring-neutral-500 transition-all">
            <summary className="cursor-pointer flex items-center justify-between text-sm font-medium text-neutral-200">
              Is my data private?
              <ChevronDown className="w-4 h-4 stroke-neutral-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-4 text-sm text-neutral-400">We employ end-to-end encryption and never sell personal data. You control deletion at any time.</p>
          </details>

        </div>
      </section>

      {/* <!-- Footer --> */}
      <footer className="border-t border-neutral-800 py-10 text-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <p className="text-neutral-500">© 2024 Dreamscape. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-neutral-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}
