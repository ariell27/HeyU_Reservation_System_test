import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import styles from "./SuccessPage.module.css";

function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // 从location state获取预约数据
    if (location.state?.bookingData) {
      setBookingData(location.state.bookingData);
      // 邮件已在CustomerInfoPage中发送，这里只显示状态
      setEmailSent(true);
    } else {
      // 如果没有预约数据，返回首页
      navigate("/");
    }
  }, [location, navigate]);

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

  const { service, selectedDate, selectedTime, selectedStaff, email } =
    bookingData;

  return (
    <div className={styles.successPage}>
      <Header />

      <div className={styles.container}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M8 12l2 2 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className={styles.successTitle}>
            预约成功！| Booking Successful!
          </h1>
          <p className={styles.successMessage}>
            您的预约已成功提交，我们已向您的邮箱发送确认信息。
            <br />
            Your booking has been successfully submitted. We have sent a
            confirmation email to your inbox.
          </p>

          {emailSent && (
            <div className={styles.emailStatus}>
              <span className={styles.emailIcon}>
                ✉️ 确认邮件已发送至：{email}
                <br />
                Confirmation email sent to: {email}
              </span>
            </div>
          )}

          <div className={styles.bookingDetails}>
            <h2 className={styles.detailsTitle}>预约详情 | Booking Details</h2>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>服务 | Service</span>
              <span className={styles.detailValue}>
                {service.nameCn} | {service.nameEn}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>日期 | Date</span>
              <span className={styles.detailValue}>
                {formatDate(selectedDate)}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>时间 | Time</span>
              <span className={styles.detailValue}>
                {formatTime(selectedTime)}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>时长 | Duration</span>
              <span className={styles.detailValue}>{service.duration}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>价格 | Price</span>
              <span className={styles.detailValue}>{service.price}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" to="/">
              返回首页 | Back to Home
            </Button>
            <Button variant="secondary" to="/booking">
              再次预约 | Book Again
            </Button>
          </div>

          <div className={styles.note}>
            <p>
              我们会在预约前24小时通过电话或邮件与您确认。
              <br />
              you via phone or email 24 hours before your appointment.
            </p>
            <p>
              如有任何问题，请随时联系我们。
              <br />
              If you have any questions, please feel free to contact us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuccessPage;
