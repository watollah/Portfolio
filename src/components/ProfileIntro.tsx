import { useTranslation } from 'react-i18next'
import { profile, profilePhoto, profilePhotoCutout } from '../data/profile'
import './ProfileIntro.css'

interface ProfileIntroProps {
  variant?: 'home' | 'resume'
  showDownload?: boolean
}

function ResumePhoto() {
  return (
    <figure className="profile-intro__figure">
      <img
        className="profile-intro__photo profile-intro__photo--cutout"
        src={profilePhotoCutout}
        alt=""
        aria-hidden="true"
      />
    </figure>
  )
}

export function ProfileIntro({
  variant = 'home',
  showDownload = false,
}: ProfileIntroProps) {
  const { t, i18n } = useTranslation()
  const isDe = i18n.language === 'de'
  const isResume = variant === 'resume'

  if (isResume) {
    return (
      <div className="profile-intro profile-intro--resume">
        <div className="profile-intro__content">
          <p className="profile-intro__eyebrow">{t('resume.title')}</p>
          <h1 className="profile-intro__name">{profile.name}</h1>
          <p className="profile-intro__role">{isDe ? profile.roleDe : profile.role}</p>

          <div className="profile-intro__bio-wrap">
            <div className="profile-intro__photo-shape" aria-hidden="true" />
            <p className="profile-intro__bio">{isDe ? profile.bioDe : profile.bio}</p>
            {showDownload && (
              <div className="profile-intro__actions">
                <a
                  href={`${import.meta.env.BASE_URL}resume.pdf`}
                  className="btn btn--secondary profile-intro__download"
                  download
                  aria-label={t('resume.download')}
                >
                  <span className="material-icons profile-intro__download-icon" aria-hidden="true">
                    download
                  </span>
                  <span className="profile-intro__download-full">{t('resume.download')}</span>
                  <span className="profile-intro__download-short" aria-hidden="true">
                    PDF
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="profile-intro__photo-mobile" aria-hidden="true">
          <ResumePhoto />
        </div>

        <div className="profile-intro__photo-desktop" aria-hidden="true">
          <ResumePhoto />
        </div>
      </div>
    )
  }

  return (
    <div className="profile-intro profile-intro--home">
      <img
        className="profile-intro__photo"
        src={profilePhoto}
        alt={profile.name}
        width={160}
        height={160}
      />
      <div className="profile-intro__content">
        <h1 className="profile-intro__name">{profile.name}</h1>
        <p className="profile-intro__role">{isDe ? profile.roleDe : profile.role}</p>
        <p className="profile-intro__bio">{isDe ? profile.bioDe : profile.bio}</p>
      </div>
    </div>
  )
}
