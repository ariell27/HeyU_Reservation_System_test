import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import Calendar from "../components/Calendar";
import { getBookings, getBlockedDates } from "../utils/api";
import {
  parseDuration,
  getEndHour,
  isTimeSlotValid,
  isEveningTime,
  isTimeSlotBooked,
  isTimeSlotBlocked,
  generateAvailableTimeSlots,
  formatDateToLocalString,
} from "../utils/timeSlotUtils";
import styles from "./TimeSelectionPage.module.css";

// 获取指定日期的预订数据
const fetchBookingsForDate = async (date) => {
  if (!date) return [];

  try {
    // 使用本地日期字符串，避免时区问题
    const dateStr = formatDateToLocalString(date);
    // 使用 api.js 中的 getBookings 函数
    const bookings = await getBookings({ date: dateStr });

    // 确保返回的数据格式正确，映射字段以便后续使用
    return bookings.map((booking) => ({
      ...booking,
      // 统一时间字段：使用 selectedTime（后端返回的字段）
      time: booking.selectedTime || booking.time || booking.startTime,
      // 从服务对象中提取时长
      serviceDuration: booking.service?.duration
        ? parseDuration(booking.service.duration)
        : booking.serviceDuration || parseDuration(booking.duration) || 3,
    }));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return []; // 出错时返回空数组
  }
};

function TimeSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedService] = useState(() => location.state?.service || null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);

  useEffect(() => {
    // 如果没有服务信息，返回预约页面
    if (!location.state?.service) {
      navigate("/booking");
    }
  }, [location, navigate]);

  // 获取所有被屏蔽的日期
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const data = await getBlockedDates();
        setBlockedDates(data);
      } catch (error) {
        console.error("Error loading blocked dates:", error);
        setBlockedDates([]);
      }
    };

    fetchBlockedDates();
    // 定期刷新 blocked dates 以确保数据同步（当管理员修改时）
    const interval = setInterval(fetchBlockedDates, 3000); // 每3秒刷新一次

    return () => clearInterval(interval);
  }, []);

  // 当日期变化时，获取该日期的预订数据
  useEffect(() => {
    if (selectedDate) {
      fetchBookingsForDate(selectedDate)
        .then((data) => {
          setBookings(data);
        })
        .catch((error) => {
          console.error("Error loading bookings:", error);
          setBookings([]);
        });
    }
  }, [selectedDate]);

  const handleDateSelect = (date) => {
    if (date && date >= new Date(new Date().setHours(0, 0, 0, 0))) {
      setSelectedDate(date);
      setSelectedTime(null); // 重置时间选择
    }
  };

  const formatTime = (time) => {
    return time; // 24小时制显示，直接返回时间字符串
  };

  // 检查时间段是否有足够的时长完成服务
  const checkTimeSlotValid = (time) => {
    if (!selectedService) return false;
    const serviceDuration = parseDuration(selectedService.duration);
    const endHour = getEndHour(selectedDate); // 根据日期获取营业结束时间

    // 检查是否有足够的时长
    if (!isTimeSlotValid(time, serviceDuration, endHour)) {
      return false;
    }

    // 检查是否为周二/周四晚上（18:00之后），如果是且服务是5小时，则不允许
    if (isEveningTime(time, selectedDate) && serviceDuration === 5) {
      return false;
    }

    // 检查是否被 block
    if (isTimeSlotBlocked(time, selectedDate, blockedDates)) {
      return false;
    }

    // 检查是否与已预订冲突
    if (isTimeSlotBooked(time, bookings, serviceDuration)) {
      return false;
    }

    return true;
  };

  const handleTimeSelect = (time) => {
    // 检查时间段是否有足够的时长
    if (!checkTimeSlotValid(time)) {
      alert(
        `该时间段不足以完成服务（需要${
          selectedService.duration
        }）| This time slot is not long enough for the service (requires ${
          selectedService.durationEn || selectedService.duration
        })`
      );
      return;
    }
    setSelectedTime(time);
  };

  const timeSlots = generateAvailableTimeSlots(
    selectedDate,
    selectedService,
    bookings,
    blockedDates
  );

  if (!selectedService) {
    return null;
  }

  return (
    <div className={styles.timeSelectionPage}>
      <Header />

      <div className={styles.container}>
        <div className={styles.mainContent}>
          {/* 左侧：时间选择 */}
          <div className={styles.selectionPanel}>
            <div className={styles.breadcrumbs}>
              <Link to="/booking" className={styles.breadcrumbLink}>
                服务 | Service
              </Link>
              <span className={styles.separator}>›</span>
              <span className={styles.active}>时间 | Time</span>
              <span className={styles.separator}>›</span>
              <Link
                to="/booking/confirm"
                className={styles.breadcrumbLink}
                onClick={(e) => {
                  if (!selectedTime) {
                    e.preventDefault();
                    alert("请先选择时间 | Please select a time first");
                  }
                }}
                state={
                  selectedTime
                    ? {
                        service: selectedService,
                        selectedDate: selectedDate,
                        selectedTime: selectedTime,
                      }
                    : undefined
                }
              >
                确认 | Confirm
              </Link>
            </div>

            <h1 className={styles.pageTitle}>选择时间 | Select Time</h1>

            {/* 日历 */}
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              blockedDates={blockedDates
                .filter((bd) => !bd.times || bd.times.length === 0)
                .map((bd) => bd.date)}
            />

            {/* 时间选择 */}
            {selectedDate && (
              <div className={styles.timeSection}>
                <label className={styles.label}>
                  可用时间 | Available Times
                </label>
                {(() => {
                  // 检查是否有有效的时间槽
                  const validSlots = timeSlots.filter((time) =>
                    checkTimeSlotValid(time)
                  );
                  return validSlots.length === 0 ? (
                    <div className={styles.noSlotsMessage}>
                      该日期暂无可用时间
                      <br />
                      No available time slots for this date
                    </div>
                  ) : (
                    <div className={styles.timeSlots}>
                      {timeSlots.map((time) => {
                        const isValid = checkTimeSlotValid(time);
                        return (
                          <button
                            key={time}
                            className={`${styles.timeSlot} ${
                              selectedTime === time ? styles.selected : ""
                            } ${!isValid ? styles.disabled : ""}`}
                            onClick={() => handleTimeSelect(time)}
                            disabled={!isValid}
                          >
                            {formatTime(time)}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* <div className={styles.waitlistLink}>
              <a href="#">找不到合适的时间？加入候补名单</a>
            </div> */}
          </div>

          {/* 右侧：预约摘要 */}
          <div className={styles.summaryPanel}>
            <div className={styles.businessInfo}>
              <div className={styles.businessName}>HeyU禾屿</div>
              <div className={styles.businessAddress}>
                专业美甲服务 | Professional Nail Services
              </div>
            </div>

            <div className={styles.serviceSummary}>
              <div className={styles.summaryTitle}>
                服务详情 | Service Details
              </div>
              <div className={styles.serviceItem}>
                <div className={styles.serviceName}>
                  {selectedService.nameCn} | {selectedService.nameEn}
                </div>
                <div className={styles.servicePrice}>
                  {selectedService.price}
                </div>
              </div>
            </div>

            <div className={styles.totalSection}>
              <div className={styles.totalLabel}>总计 | Total</div>
              <div className={styles.totalPrice}>{selectedService.price}</div>
            </div>

            <Button
              variant="primary"
              className={styles.continueButton}
              onClick={() => {
                navigate("/booking/confirm", {
                  state: {
                    service: selectedService,
                    selectedDate: selectedDate,
                    selectedTime: selectedTime,
                  },
                });
              }}
              disabled={!selectedTime}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeSelectionPage;
