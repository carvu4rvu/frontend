import { motion } from "framer-motion"
import { FaQuoteLeft, FaStar } from "react-icons/fa"
import { HiSparkles } from "react-icons/hi2"
import { fadeUp, staggerContainer, scaleIn, viewportOnce } from "../utils/homeMotion"
import "../pages/Home.css"

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Software Engineer at Infosys",
    initials: "PS",
    content:
      "The placement cell guided me through every round—from resume reviews to mock interviews. I secured my offer with confidence and clarity.",
  },
  {
    name: "Arjun Reddy",
    role: "Business Analyst at Deloitte",
    initials: "AR",
    content:
      "Workshops on aptitude and HR rounds made a real difference. The team kept us updated on drives and deadlines without any confusion.",
  },
  {
    name: "Ananya Iyer",
    role: "SDE at TCS",
    initials: "AI",
    content:
      "From campus drive registration to offer acceptance, everything was on CarvU. Getting placed at TCS felt structured and stress-free.",
  },
]

export const Testimonials = () => (
  <motion.section
    id="stories"
    className="home-testimonials"
    initial="hidden"
    whileInView="visible"
    viewport={viewportOnce}
    variants={fadeUp}
  >
    <div className="home-container">
      <motion.header className="home-section__head" variants={fadeUp}>
        <span className="home-section__eyebrow">
          <HiSparkles aria-hidden /> Success stories
        </span>
        <h2 className="home-section__title">Voices from our students</h2>
        <p className="home-section__lead">
          Real experiences from RV University graduates who turned preparation into placement offers.
        </p>
      </motion.header>

      <motion.div
        className="home-testimonials__grid"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {TESTIMONIALS.map((t) => (
          <motion.article
            key={t.name}
            className="home-testimonial"
            variants={scaleIn}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="home-testimonial__stars" aria-label="5 star rating">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} />
              ))}
            </div>
            <FaQuoteLeft
              style={{ color: "#e8b84a", opacity: 0.5, marginBottom: "0.5rem", fontSize: "1.25rem" }}
              aria-hidden
            />
            <p className="home-testimonial__quote">{t.content}</p>
            <div className="home-testimonial__author">
              <span className="home-testimonial__avatar" aria-hidden>
                {t.initials}
              </span>
              <div>
                <p className="home-testimonial__name">{t.name}</p>
                <p className="home-testimonial__role">{t.role}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </div>
  </motion.section>
)
