import { useState } from "react";
import { formatDateToLocalString } from "../utils/timeSlotUtils";
import styles from "./Calendar.module.css";

function Calendar({
  selectedDate,
  onDateSelect,
  blockedDates = [],
  bookingDates = [],
  minDate = null,
  showBookingCount = false,
}) {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );

  // 获取当前月份的日期
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // 添加前面的空白日期
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 添加月份中的日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
    });
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDateToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isDatePast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateBlocked = (date) => {
    if (!date) return false;
    // 使用本地日期字符串，避免时区问题
    const dateStr = formatDateToLocalString(date);
    return blockedDates.includes(dateStr);
  };

  const getBookingCount = (date) => {
    if (!date || !showBookingCount || !bookingDates) return 0;
    // 使用本地日期字符串，避免时区问题
    const dateStr = formatDateToLocalString(date);
    const matchingBookings = bookingDates.filter((booking) => {
      if (!booking || !booking.date) return false;
      let bookingDate;
      if (booking.date instanceof Date) {
        bookingDate = booking.date;
      } else {
        bookingDate = new Date(booking.date);
      }
      const bookingDateStr = formatDateToLocalString(bookingDate);
      return bookingDateStr === dateStr;
    });
    return matchingBookings.length;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    if (isDatePast(date) && minDate === null) return true;
    if (minDate && date < minDate) return true;
    return isDateBlocked(date);
  };

  return (
    <div className={styles.calendarSection}>
      <div className={styles.calendarHeader}>
        <button className={styles.navButton} onClick={handlePrevMonth}>
          ‹
        </button>
        <h2 className={styles.monthTitle}>{formatMonthYear(currentMonth)}</h2>
        <button className={styles.navButton} onClick={handleNextMonth}>
          ›
        </button>
      </div>

      <div className={styles.weekDays}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {getDaysInMonth(currentMonth).map((date, index) => {
          if (!date) {
            return (
              <div key={`empty-${index}`} className={styles.calendarDay}></div>
            );
          }

          const isSelected = isDateSelected(date);
          const isToday = isDateToday(date);
          const isPast = isDatePast(date);
          const isBlocked = isDateBlocked(date);
          const isDisabled = isDateDisabled(date);
          const bookingCount = getBookingCount(date);

          return (
            <button
              key={date.toISOString()}
              className={`${styles.calendarDay} ${isSelected ? styles.selected : ""} ${
                isToday ? styles.today : ""
              } ${isPast ? styles.past : ""} ${
                isBlocked ? styles.blocked : ""
              } ${bookingCount > 0 ? styles.hasBookings : ""}`}
              onClick={() => !isDisabled && onDateSelect && onDateSelect(date)}
              disabled={isDisabled}
            >
              <span className={styles.dayNumber}>{date.getDate()}</span>
              {showBookingCount && bookingCount > 0 && (
                <span className={styles.bookingBadge}>{bookingCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;

