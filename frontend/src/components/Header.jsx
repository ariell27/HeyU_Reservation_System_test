import { Link } from "react-router-dom";
import styles from "./Header.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          HeyU·禾屿
        </Link>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>
            首页 | Home
          </Link>
          <Link to="/booking" className={styles.bookButton}>
            预约 | Book
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
