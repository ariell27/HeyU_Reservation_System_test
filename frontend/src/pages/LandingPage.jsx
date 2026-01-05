import { Link } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import styles from "./LandingPage.module.css";

function LandingPage() {
  return (
    <div className={styles.landingPage}>
      <Header />
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>HeyU·禾屿</h1>
          <p className={styles.address}>
            U1602/ 63 Shoreline Drive, Rhodes, NSW, 2138
            <br />
            Phone: 048 9196 388 | WeChat: HeyUbeauty27
          </p>
          <p className={styles.heroSubtitle}>
            Elevate your beauty with precision and style
            <br />
            以精湛技艺，点亮您的美丽
          </p>
        </div>
      </section>
      <section className={styles.welcomeSection}>
        <div className={styles.ctaContainer}>
          <Button variant="primary" to="/booking">
            立即预约 | Book Now
          </Button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
