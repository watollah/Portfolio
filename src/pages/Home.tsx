import { useTranslation } from 'react-i18next'

function isMobileHomeLayout() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 640px)').matches
}
import { Link } from 'react-router-dom'
import { ProfileIntro } from '../components/ProfileIntro'
import { ProjectCard } from '../components/ProjectCard'
import { SectionHeader } from '../components/SectionHeader'
import { featuredProjects } from '../data/projects'
import { useLocalizedPath } from '../hooks/useLocalizedPath'
import './Home.css'

export function Home() {
  const { t } = useTranslation()
  const localize = useLocalizedPath()

  return (
    <div className="page home-page">
      <section className="home-about" aria-labelledby="about-heading">
        <SectionHeader
          id="about-heading"
          title={t('home.aboutTitle')}
          action={
            <Link to={localize('/resume')} className="text-link">
              {t('home.viewResume')}
              <span className="material-icons" aria-hidden="true">
                chevron_right
              </span>
            </Link>
          }
        />
        <ProfileIntro />
      </section>

      <section className="home-projects" aria-labelledby="featured-heading">
        <SectionHeader
          id="featured-heading"
          title={t('home.featuredProjects')}
          action={
            <Link to={localize('/projects')} className="text-link">
              {t('home.showAll')}
              <span className="material-icons" aria-hidden="true">
                chevron_right
              </span>
            </Link>
          }
        />

        <div className="home-projects__grid">
          {featuredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              priority={index === 0 && isMobileHomeLayout()}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
