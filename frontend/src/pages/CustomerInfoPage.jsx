import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import { sendConfirmationEmail } from "../utils/emailService";
import { createBooking } from "../utils/api";
import { formatDateToLocalString } from "../utils/timeSlotUtils";
import styles from "./CustomerInfoPage.module.css";

function CustomerInfoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [name, setName] = useState("");
  const [wechatName, setWechatName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [wechat, setWechat] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get booking data from location state
    if (
      location.state?.service &&
      location.state?.selectedDate &&
      location.state?.selectedTime
    ) {
      setBookingData(location.state);
    } else {
      // If no booking data, redirect to booking page
      navigate("/booking");
    }
  }, [location, navigate]);

  const validatePhone = (phone) => {
    // Simple phone validation: supports multiple formats
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 8;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "请输入姓名 | Please enter your name";
    }

    if (!wechatName.trim()) {
      newErrors.wechatName =
        "请输入微信名（如没有可填写N/A）| Please enter your WeChat name (or N/A if you don't have one)";
    }

    if (!phone.trim()) {
      newErrors.phone = "请输入电话号码 | Please enter your phone number";
    } else if (!validatePhone(phone)) {
      newErrors.phone =
        "请输入有效的电话号码 | Please enter a valid phone number";
    }

    if (!email.trim()) {
      newErrors.email = "请输入邮箱地址 | Please enter your email address";
    } else if (!validateEmail(email)) {
      newErrors.email =
        "请输入有效的邮箱地址 | Please enter a valid email address";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);

      try {
        // Prepare complete booking data
        // Convert Date object to local date string (YYYY-MM-DD) to avoid timezone issues
        const dateStr =
          bookingData.selectedDate instanceof Date
            ? formatDateToLocalString(bookingData.selectedDate)
            : bookingData.selectedDate;

        const completeBookingData = {
          service: bookingData.service,
          selectedDate: dateStr, // Use local date string
          selectedTime: bookingData.selectedTime,
          name: name,
          wechatName: wechatName,
          email: email,
          phone: phone,
          wechat: wechat,
        };

        // Save booking to backend (email will be sent automatically by backend)
        const savedBooking = await createBooking(completeBookingData);
        console.log("✅ Booking saved:", savedBooking);
        console.log("📧 Email is being sent automatically by backend...");

        // Backend automatically sends email when booking is created
        // Optionally send again via email API endpoint as backup (non-blocking)
        sendConfirmationEmail({
          ...completeBookingData,
          bookingId: savedBooking.bookingId,
        })
          .then((result) => {
            if (result) {
              console.log("✅ Backup email sent successfully");
            } else {
              console.log(
                "ℹ️ Backup email not sent (backend email should have been sent)"
              );
            }
          })
          .catch((err) => {
            console.warn("⚠️ Backup email failed (non-critical):", err);
            // Don't block - backend should have sent email already
          });

        // Navigate to success page, passing booking data (including bookingId returned from backend)
        navigate("/booking/success", {
          state: {
            bookingData: {
              ...completeBookingData,
              bookingId: savedBooking.bookingId,
            },
          },
        });
      } catch (error) {
        console.error("Submission failed:", error);
        alert(`Submission failed, please try again later.\n${error.message}`);
        setIsSubmitting(false);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!bookingData) {
    return null;
  }

  const { service, selectedDate, selectedTime } = bookingData;

  return (
    <div className={styles.customerInfoPage}>
      <Header />

      <div className={styles.container}>
        <div className={styles.mainContent}>
          {/* Left: Customer information form */}
          <div className={styles.formPanel}>
            <div className={styles.breadcrumbs}>
              <Link to="/booking" className={styles.breadcrumbLink}>
                服务 | Service
              </Link>
              <span className={styles.separator}>›</span>
              <Link
                to="/booking/time"
                className={styles.breadcrumbLink}
                state={{
                  service: bookingData?.service,
                }}
              >
                时间 | Time
              </Link>
              <span className={styles.separator}>›</span>
              <span className={styles.active}>确认 | Confirm</span>
            </div>

            <h1 className={styles.pageTitle}>确认信息 | Confirm Information</h1>
            <p className={styles.pageSubtitle}>
              请填写您的联系方式，以便我们与您确认预约
              <br />
              Please provide your contact information so we can confirm your
              appointment
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  姓名 | Nickname <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className={`${styles.input} ${
                    errors.name ? styles.inputError : ""
                  }`}
                  placeholder="Please enter your nickname"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors({ ...errors, name: "" });
                    }
                  }}
                />
                {errors.name && (
                  <span className={styles.errorMessage}>{errors.name}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="wechatName" className={styles.label}>
                  微信名 | WeChat Name{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="wechatName"
                  className={`${styles.input} ${
                    errors.wechatName ? styles.inputError : ""
                  }`}
                  placeholder="Please enter your WeChat name (or N/A)"
                  value={wechatName}
                  onChange={(e) => {
                    setWechatName(e.target.value);
                    if (errors.wechatName) {
                      setErrors({ ...errors, wechatName: "" });
                    }
                  }}
                />
                {errors.wechatName && (
                  <span className={styles.errorMessage}>
                    {errors.wechatName}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  电话号码 | Phone Number{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  className={`${styles.input} ${
                    errors.phone ? styles.inputError : ""
                  }`}
                  placeholder="Please enter your phone number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) {
                      setErrors({ ...errors, phone: "" });
                    }
                  }}
                />
                {errors.phone && (
                  <span className={styles.errorMessage}>{errors.phone}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  邮箱地址 | Email Address{" "}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className={`${styles.input} ${
                    errors.email ? styles.inputError : ""
                  }`}
                  placeholder="Please enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: "" });
                    }
                  }}
                />
                {errors.email && (
                  <span className={styles.errorMessage}>{errors.email}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="wechat" className={styles.label}>
                  微信号 | WeChat ID
                </label>
                <input
                  type="text"
                  id="wechat"
                  className={styles.input}
                  placeholder="Please enter your WeChat ID"
                  value={wechat}
                  onChange={(e) => {
                    setWechat(e.target.value);
                  }}
                />
              </div>

              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    navigate("/booking/time", {
                      state: {
                        service: bookingData.service,
                      },
                    })
                  }
                  disabled={isSubmitting}
                >
                  返回 | Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                >
                  {isSubmitting
                    ? "提交中... | Submitting..."
                    : "确认预约 | Confirm Booking"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right: Booking summary */}
          <div className={styles.summaryPanel}>
            <div className={styles.businessInfo}>
              <div className={styles.businessName}>HeyU禾屿</div>
              <div className={styles.businessAddress}>
                专业美甲服务 | Professional Nail Services
              </div>
            </div>

            <div className={styles.bookingSummary}>
              <div className={styles.summaryTitle}>
                预约详情 | Booking Details
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>服务 | Service</div>
                <div className={styles.summaryValue}>
                  {service.nameCn} | {service.nameEn}
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>日期 | Date</div>
                <div className={styles.summaryValue}>
                  {formatDate(selectedDate)}
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>时间 | Time</div>
                <div className={styles.summaryValue}>
                  {formatTime(selectedTime)}
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>时长 | Duration</div>
                <div className={styles.summaryValue}>{service.duration}</div>
              </div>
            </div>

            <div className={styles.totalSection}>
              <div className={styles.totalLabel}>总计 | Total</div>
              <div className={styles.totalPrice}>{service.price}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerInfoPage;
