import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getServices } from "../utils/api";
import styles from "./BookingPage.module.css";

function BookingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch service data from backend API
    const fetchServices = async () => {
      try {
        console.log('🔄 BookingPage: Starting to fetch services...');
        setLoading(true);
        setError(null);
        const servicesData = await getServices();
        console.log('✅ BookingPage: Services loaded successfully:', servicesData.length);
        setServices(servicesData);
      } catch (err) {
        console.error("❌ BookingPage: Failed to fetch services:", err);
        console.error("❌ Error message:", err.message);
        console.error("❌ Error stack:", err.stack);
        setError(`Unable to load service list, please try again later.\nError: ${err.message}`);
      } finally {
        setLoading(false);
        console.log('🔄 BookingPage: Loading completed');
      }
    };

    fetchServices();
  }, []);

  const handleServiceSelect = (service) => {
    navigate("/booking/time", { state: { service } });
  };

  // Organize services by category
  const servicesByCategory = {
    本甲: services.filter((s) => s.category === "本甲"),
    延长: services.filter((s) => s.category === "延长"),
    卸甲: services.filter((s) => s.category === "卸甲"),
  };

  const categoryNames = {
    本甲: { cn: "本甲", en: "Basic Nails" },
    延长: { cn: "延长", en: "Extension" },
    卸甲: { cn: "卸甲", en: "Removal" },
  };

  if (loading) {
    return (
      <div className={styles.bookingPage}>
        <Header />
        <div className={styles.container}>
          <div className={styles.loadingMessage}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.bookingPage}>
        <Header />
        <div className={styles.container}>
          <div className={styles.errorMessage}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bookingPage}>
      <Header />

      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>
            Hand Manicure Services
          </h1>
        </div>

        {Object.entries(servicesByCategory).map(
          ([category, categoryServices]) => (
            <div key={category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                {categoryNames[category].cn} | {categoryNames[category].en}
              </h2>
              <div className={styles.servicesGrid}>
                {categoryServices.map((service) => (
                  <div key={service.id} className={styles.serviceCard}>
                    <div className={styles.serviceHeader}>
                      <h3 className={styles.serviceName}>
                        {service.nameCn} | {service.nameEn}
                      </h3>
                      <button
                        className={styles.addButton}
                        onClick={() => handleServiceSelect(service)}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 18L15 12L9 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className={styles.serviceInfo}>
                      <div className={styles.serviceMeta}>
                        {service.duration && (
                          <span className={styles.duration}>
                            {service.duration} | {service.durationEn}
                          </span>
                        )}
                        <span
                          className={`${styles.price} ${
                            service.isAddOn ? styles.addOnPrice : ""
                          }`}
                        >
                          {service.price}
                        </span>
                      </div>

                      <p className={styles.serviceDescription}>
                        {service.description}
                        <br />
                        {service.descriptionCn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default BookingPage;
