import { Link } from 'react-router-dom';
import styles from './Button.module.css';

function Button({ children, variant = 'primary', onClick, to, className = '', disabled = false }) {
  const baseClass = `${styles.button} ${styles[variant]} ${className}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClass}>
        {children}
      </Link>
    );
  }

  return (
    <button className={baseClass} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default Button;

