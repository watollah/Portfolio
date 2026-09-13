import { useTranslation } from 'react-i18next'
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
              {t('home.viewResume')} →
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
              {t('home.showAll')} →
            </Link>
          }
        />

        <div className="home-projects__grid">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </div>
  )
}
