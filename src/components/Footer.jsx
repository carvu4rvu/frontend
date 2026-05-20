import { Box } from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"
import { CarvuBrand } from "./CarvuBrand"
import "./Footer.css"

const EXPLORE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/#about", label: "About" },
  { to: "/#recruiters", label: "Top Recruiters" },
  { to: "/#stories", label: "Success Stories" },
]

const STUDENT_LINKS = [
  { to: "/register", label: "Register" },
  { to: "/login", label: "Login" },
]

export const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <Box as="footer" className="site-footer" w="100%">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand-block">
            <CarvuBrand fontSize="xl" />
            <p className="site-footer__tagline">
              RV University&apos;s placement platform — connecting students with verified recruiters,
              drives, and career support in one place.
            </p>
          </div>

          <div>
            <h3 className="site-footer__col-title">Explore</h3>
            <ul className="site-footer__links">
              {EXPLORE_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <RouterLink to={to} className="site-footer__link">
                    {label}
                  </RouterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="site-footer__col-title">Students</h3>
            <ul className="site-footer__links">
              {STUDENT_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <RouterLink to={to} className="site-footer__link">
                    {label}
                  </RouterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="site-footer__col-title">Contact</h3>
            <p className="site-footer__contact-item">
              <span className="site-footer__contact-icon" aria-hidden>
                ✉
              </span>
              <span>placements@rvu.edu.in</span>
            </p>
            <p className="site-footer__contact-item">
              <span className="site-footer__contact-icon" aria-hidden>
                ☎
              </span>
              <span>+91 80 1234 5678</span>
            </p>
            <p className="site-footer__contact-item">
              <span className="site-footer__contact-icon" aria-hidden>
                ⌖
              </span>
              <span>RV University, Bengaluru, Karnataka</span>
            </p>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copy">&copy; {year} CarvU — RV University Placement Cell</p>
          <p className="site-footer__meta">Placement &amp; Career Services</p>
        </div>
      </div>
    </Box>
  )
}
