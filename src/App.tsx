import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './components/Header'
import { Footer, SkipLink } from './components/Footer'
import { Home } from './pages/Home'
import { Projects } from './pages/Projects'
import { ProjectsLayout } from './pages/ProjectsLayout'
import { ProjectDetail } from './pages/ProjectDetail'
import { Resume } from './pages/Resume'
import { LanguageRoute, LegacyRedirect, RootRedirect } from './routing/LanguageRoutes'
import './styles/global.css'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" className="main">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/projects/*" element={<LegacyRedirect />} />
          <Route path="/resume" element={<LegacyRedirect />} />
          <Route path="/:lang" element={<LanguageRoute />}>
            <Route index element={<Home />} />
            <Route path="projects" element={<ProjectsLayout />}>
              <Route index element={<Projects />} />
              <Route path=":id" element={<ProjectDetail />} />
            </Route>
            <Route path="resume" element={<Resume />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  )
}
