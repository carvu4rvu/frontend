import { useEffect, useState, useMemo } from "react"
import { Box, Center, Spinner } from "@chakra-ui/react"
import { Link as RouterLink, Navigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  FaUniversity,
  FaGraduationCap,
  FaHandshake,
  FaBuilding,
  FaBriefcase,
  FaSchool,
  FaImage,
  FaLayerGroup,
  FaRocket,
  FaUserPlus,
  FaSignInAlt,
  FaClipboardCheck,
  FaChartLine,
  FaShieldAlt,
  FaLaptop,
} from "react-icons/fa"
import { HiSparkles } from "react-icons/hi2"
import { useAuth } from "../context/AuthContext"
import { fetchLandingCompanies } from "../services/home.service"
import { CompanyLogo } from "../components/CompanyLogo"
import { Testimonials } from "../components/Testimonials"
import {
  fadeUp,
  fadeIn,
  scaleIn,
  slideFromLeft,
  slideFromRight,
  staggerContainer,
  viewportOnce,
} from "../utils/homeMotion"
import "./Home.css"

const MotionSection = motion.section
const MotionDiv = motion.div
const MotionArticle = motion.article

const TOP_COMPANIES_LIMIT = 10

const STATS_CONFIG = [
  { key: "total", label: "Partner Companies", icon: FaBriefcase, suffix: "+" },
  { key: "schools", label: "Schools on Campus", icon: FaSchool },
  { key: "withLogo", label: "Branded Recruiters", icon: FaImage },
  { key: "types", label: "Industry Segments", icon: FaLayerGroup },
]

const TRUST_FEATURES = [
  { icon: FaClipboardCheck, title: "Campus Drives", text: "Register & track placement drives in one portal" },
  { icon: FaChartLine, title: "Offer Management", text: "Accept, decline & monitor offers transparently" },
  { icon: FaShieldAlt, title: "Verified Recruiters", text: "Only onboarded companies from our database" },
  { icon: FaLaptop, title: "Student Dashboard", text: "Profile, applications & status — always updated" },
]

const AboutFeature = ({ icon: Icon, title, text }) => (
  <MotionArticle
    className="home-about-card"
    variants={fadeUp}
    whileHover={{ y: -6, transition: { duration: 0.2 } }}
  >
    <span className="home-about-card__icon-wrap" aria-hidden>
      <Icon />
    </span>
    <h3 className="home-about-card__title">{title}</h3>
    <p className="home-about-card__text">{text}</p>
  </MotionArticle>
)

export const Home = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [landing, setLanding] = useState({ companies: [], schoolsList: [], totalCompanies: 0 })
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchLandingCompanies().then((data) => {
      if (!cancelled) {
        setLanding(data)
        setDataLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const topCompanies = useMemo(() => {
    const list = [...(landing.companies || [])]
    list.sort((a, b) => {
      const aLogo = !!(a.company_logo_link || a.logo)
      const bLogo = !!(b.company_logo_link || b.logo)
      if (aLogo !== bLogo) return bLogo ? 1 : -1
      return (a.company_name || "").localeCompare(b.company_name || "")
    })
    return list.slice(0, TOP_COMPANIES_LIMIT)
  }, [landing.companies])

  const stats = useMemo(() => {
    const total = landing.totalCompanies || landing.companies?.length || 0
    const schools = landing.schoolsList?.length ?? 0
    const withLogo = (landing.companies || []).filter((c) => c.company_logo_link || c.logo).length
    const types = new Set((landing.companies || []).map((c) => c.company_type).filter(Boolean)).size
    return { total, schools, withLogo, types }
  }, [landing])

  if (authLoading) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="#0f2a33" />
      </Center>
    )
  }

  if (isAuthenticated && user) {
    switch (user.role?.toLowerCase()) {
      case "student":
        return <Navigate to="/student-dashboard" replace />
      case "admin":
      case "vc":
        return <Navigate to="/placement/dashboard" replace />
      case "alumni":
        return <Navigate to="/placement/alumni-dashboard" replace />
      case "company":
        return <Navigate to="/company/dashboard" replace />
      default:
        break
    }
  }

  return (
    <Box className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__mesh" aria-hidden />
        <div className="home-hero__inner">
          <MotionDiv
            initial="hidden"
            animate="visible"
            variants={slideFromLeft}
          >
            <span className="home-hero__badge">
              <HiSparkles className="home-hero__badge-icon" aria-hidden />
              RV University Placement
            </span>
            <h1 className="home-hero__title">
              Launch your career with
              <span className="home-hero__title-accent"> trusted recruiters</span>
            </h1>
            <p className="home-hero__lead">
              CarvU connects talented students with verified hiring partners on campus.
              Register once and access drives, offers, and placement support in one place.
            </p>
            <div className="home-hero__actions">
              <RouterLink to="/register" className="home-btn home-btn--primary">
                <FaUserPlus aria-hidden /> Register as Student
              </RouterLink>
              <RouterLink to="/login" className="home-btn home-btn--outline">
                <FaSignInAlt aria-hidden /> Login
              </RouterLink>
            </div>
          </MotionDiv>

          <MotionDiv
            className="home-hero__visual-wrap"
            initial="hidden"
            animate="visible"
            variants={slideFromRight}
          >
            <motion.img
              className="home-hero__img"
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=85"
              alt="Students and professionals collaborating in a modern workspace"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </MotionDiv>
        </div>
      </section>

      {/* Trust band — always visible (no scroll-hide) */}
      <section className="home-stats" aria-label="Placement highlights">
        <div className="home-stats__inner">
          <MotionDiv
            className="home-stats__intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <span className="home-stats__eyebrow">
              <HiSparkles aria-hidden /> Why students choose CarvU
            </span>
            <h2 className="home-stats__title">Your placement journey, simplified</h2>
            <p className="home-stats__subtitle">
              One platform for drives, offers, recruiter verification, and career support — built for RV University.
            </p>
          </MotionDiv>

          <MotionDiv
            className="home-stats__grid"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {STATS_CONFIG.map(({ key, label, icon: Icon, suffix }) => (
              <MotionDiv key={key} className="home-stat" variants={scaleIn}>
                <span className="home-stat__icon-wrap" aria-hidden>
                  <Icon />
                </span>
                <div className="home-stat__body">
                  <span className="home-stat__value">
                    {dataLoading ? (
                      <span className="home-stat__loading" aria-hidden>···</span>
                    ) : (
                      <>
                        {stats[key] ?? "—"}
                        {suffix && stats[key] ? suffix : ""}
                      </>
                    )}
                  </span>
                  <span className="home-stat__label">{label}</span>
                </div>
              </MotionDiv>
            ))}
          </MotionDiv>

          <MotionDiv
            className="home-stats__features"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {TRUST_FEATURES.map(({ icon: Icon, title, text }) => (
              <MotionDiv key={title} className="home-stats__feature" variants={fadeUp}>
                <span className="home-stats__feature-icon" aria-hidden>
                  <Icon />
                </span>
                <div>
                  <p className="home-stats__feature-title">{title}</p>
                  <p className="home-stats__feature-text">{text}</p>
                </div>
              </MotionDiv>
            ))}
          </MotionDiv>
        </div>
      </section>

      {/* About */}
      <MotionSection
        id="about"
        className="home-section home-section--muted"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeIn}
      >
        <div className="home-container">
          <MotionDiv className="home-section__head" variants={fadeUp}>
            <span className="home-section__eyebrow">
              <FaUniversity aria-hidden /> About CarvU
            </span>
            <h2 className="home-section__title">Bridging academics and industry</h2>
            <p className="home-section__lead">
              We partner with leading organizations to deliver structured placement drives,
              transparent processes, and career-ready outcomes for every student.
            </p>
          </MotionDiv>

          <MotionDiv
            className="home-about-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <AboutFeature
              icon={FaUniversity}
              title="Our Legacy"
              text="RV University brings together engineering and management talent with a placement office focused on measurable outcomes."
            />
            <AboutFeature
              icon={FaGraduationCap}
              title="Student Focus"
              text="Holistic support—from profile building and mock interviews to drive registration and offer management."
            />
            <AboutFeature
              icon={FaHandshake}
              title="Industry Relations"
              text="A growing network of recruiters runs campus drives, internships, and full-time roles through our platform."
            />
          </MotionDiv>

          <MotionDiv className="home-vision" variants={fadeUp}>
            <div className="home-vision__block">
              <h3 className="home-vision__title">Vision</h3>
              <p className="home-vision__item">
                To be a globally recognized center of excellence in technical education and research.
              </p>
            </div>
            <div className="home-vision__block">
              <h3 className="home-vision__title">Mission</h3>
              <p className="home-vision__item">
                Provide quality education, foster innovation, and groom ethical leaders who contribute to society.
              </p>
            </div>
          </MotionDiv>
        </div>
      </MotionSection>

      {/* Top 10 recruiters */}
      <MotionSection
        id="recruiters"
        className="home-section home-section--white"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeIn}
      >
        <div className="home-container--full">
          <MotionDiv className="home-section__head" variants={fadeUp}>
            <span className="home-section__eyebrow">
              <FaBriefcase aria-hidden /> Hiring partners
            </span>
            <h2 className="home-section__title">Top 10 recruiting partners</h2>
            <p className="home-section__lead">
              Live from our placement database — verified organizations with brand logos.
            </p>
            {!dataLoading && topCompanies.length > 0 && (
              <span className="home-recruiters__badge">
                <HiSparkles aria-hidden />
                {topCompanies.length} of {stats.total}+ partners
              </span>
            )}
          </MotionDiv>

          {dataLoading ? (
            <Center py={14}>
              <Spinner size="lg" color="#0f2a33" />
            </Center>
          ) : topCompanies.length === 0 ? (
            <div className="home-empty">
              <FaBuilding size={44} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              <p>Partner companies will appear here once added in the placement portal.</p>
            </div>
          ) : (
            <MotionDiv
              className="home-recruiters-grid"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {topCompanies.map((company, index) => (
                <MotionArticle
                  key={company.id ?? company.company_name}
                  className="home-recruiter-card"
                  variants={scaleIn}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <span className="home-recruiter-card__rank">{index + 1}</span>
                  <CompanyLogo
                    src={company.company_logo_link || company.logo}
                    name={company.company_name}
                    boxSize="52px"
                    variant="rounded"
                  />
                  <p className="home-recruiter-card__name" title={company.company_name}>
                    {company.company_name}
                  </p>
                  {company.company_type && (
                    <p className="home-recruiter-card__type">{company.company_type}</p>
                  )}
                </MotionArticle>
              ))}
            </MotionDiv>
          )}
        </div>
      </MotionSection>

      <Testimonials />

      {/* CTA */}
      <MotionSection
        className="home-cta"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
      >
        <div className="home-cta__glow" aria-hidden />
        <div className="home-cta__inner">
          <span className="home-cta__icon" aria-hidden>
            <FaRocket />
          </span>
          <h2 className="home-cta__title">Ready to begin your placement journey?</h2>
          <p className="home-cta__text">
            Create your student account with your USN and college email to access drives, applications, and offers.
          </p>
          <div className="home-cta__actions">
            <RouterLink to="/register" className="home-btn home-btn--gold">
              <FaUserPlus aria-hidden /> Get Started
            </RouterLink>
            <a href="#about" className="home-btn home-btn--ghost-light">
              Learn about CarvU
            </a>
          </div>
        </div>
      </MotionSection>
    </Box>
  )
}
