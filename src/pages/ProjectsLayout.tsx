import { Outlet, useMatch } from 'react-router-dom'
import { ProjectsSidebar } from '../components/ProjectsSidebar'
import './Projects.css'

export function ProjectsLayout() {
  const projectMatch = useMatch({ path: '/:lang/projects/:id', end: true })
  const activeProjectId = projectMatch?.params.id

  return (
    <div className="page projects-page">
      <ProjectsSidebar activeProjectId={activeProjectId} />
      <div className="projects-page__content">
        <Outlet key={activeProjectId ?? 'index'} />
      </div>
    </div>
  )
}
