import { useState, useEffect } from "react";
import Header from "../components/Header";
import Calendar from "../components/Calendar";
import {
  getServices,
  saveService,
  getBookings,
  getBlockedDates,
  saveBlockedDate,
  deleteBlockedDate,
  deleteBlockedTime,
} from "../utils/api";
import {
  generateDefaultTimeSlots,
  isTimeSlotBooked,
  parseDuration,
  formatDateToLocalString as formatDateToLocalStringUtil,
} from "../utils/timeSlotUtils";
import styles from "./AdminPage.module.css";

function AdminPage() {
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  // blockedDates now stores { date: "2024-12-20", times: ["10:00", "14:30"] } format
  // If times is an empty array, it means the entire date is blocked
  const [blockedDates, setBlockedDates] = useState([]);
  const [_showAddService, setShowAddService] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings"); // services, dates, bookings
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBlockDate, setSelectedBlockDate] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);

  // Load service data from backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getServices();
        setServices(servicesData);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setError("Unable to load service list");
      }
    };
    fetchServices();
  }, []);

  // Load booking data from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const bookingsData = await getBookings();
        // Convert backend data format to frontend format
        const formattedBookings = bookingsData.map((booking, index) => {
          // Extract numeric part from bookingId as display ID
          // bookingId format: BK{timestamp}{random}, extract all numbers and take last 6-8 digits as short ID
          const allNumbers = booking.bookingId.replace(/\D/g, "");
          // Use last 6 digits of timestamp, if not enough use last 6 digits of all numbers
          const numericId =
            allNumbers.length > 6
              ? allNumbers.slice(-6)
              : allNumbers || (index + 1).toString();
          // Process date: if string (YYYY-MM-DD), convert to Date object
          let bookingDate;
          if (typeof booking.selectedDate === "string") {
            // If YYYY-MM-DD format, create local date directly
            if (booking.selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = booking.selectedDate
                .split("-")
                .map(Number);
              bookingDate = new Date(year, month - 1, day);
            } else {
              // If ISO string, parse as local date
              bookingDate = new Date(booking.selectedDate);
            }
          } else {
            bookingDate = new Date(booking.selectedDate);
          }

          return {
            id: booking.bookingId, // Keep full ID for key
            displayId: numericId, // Simplified numeric ID for display
            customerName: booking.name,
            name: booking.name, // Also keep name field for display
            phone: booking.phone,
            email: booking.email,
            service: booking.service,
            date: bookingDate,
            time: booking.selectedTime,
            selectedTime: booking.selectedTime, // Ensure selectedTime is included
            startTime: booking.selectedTime, // Also as alias for startTime
            status: booking.status,
            createdAt: new Date(booking.createdAt),
          };
        });
        setBookings(formattedBookings);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        setError("Unable to load booking list");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Load blocked dates data from backend
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const blockedDatesData = await getBlockedDates();
        setBlockedDates(blockedDatesData);
      } catch (err) {
        console.error("Failed to fetch blocked dates:", err);
        // Don't show error, as this is an optional feature
      }
    };
    fetchBlockedDates();
  }, []);

  const handleEditService = (service) => {
    setEditingService({ ...service });
  };

  const handleSaveService = async () => {
    try {
      // Save to backend
      const savedService = await saveService(editingService);

      // Update local state
      if (editingService.id) {
        // Update existing service
        setServices(
          services.map((s) => (s.id === savedService.id ? savedService : s))
        );
      } else {
        // Add new service
        setServices([...services, savedService]);
        setShowAddService(false);
      }
      setEditingService(null);
    } catch (err) {
      console.error("Failed to save service:", err);
      alert("Failed to save service, please try again.");
    }
  };

  const handleDeleteService = (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const handleAddService = () => {
    setEditingService({
      id: null,
      nameCn: "",
      nameEn: "",
      duration: "",
      durationEn: "",
      price: "",
      category: "本甲",
      description: "",
      descriptionCn: "",
      isAddOn: false,
    });
    setShowAddService(true);
  };

  const handleUnblockDate = async (dateStr) => {
    try {
      await deleteBlockedDate(dateStr);
      // Update local state
      const updatedBlockedDates = blockedDates.filter(
        (d) => d.date !== dateStr
      );
      setBlockedDates(updatedBlockedDates);
      // Re-fetch from backend to ensure sync
      const freshData = await getBlockedDates();
      setBlockedDates(freshData);
    } catch (err) {
      console.error("Failed to delete blocked date:", err);
      alert("Failed to unblock date, please try again.");
    }
  };

  const handleUnblockTime = async (dateStr, time, allSlots = []) => {
    try {
      // Ensure time format is "HH:MM"
      const normalizedTime = time.includes(":")
        ? time
        : `${time.padStart(2, "0")}:00`;

      const existingBlock = blockedDates.find((b) => b.date === dateStr);

      // If entire date is blocked (times is empty array), need to convert to partial block
      if (existingBlock && existingBlock.times.length === 0) {
        // Generate all time slots, then remove cancelled time slot
        if (allSlots.length === 0) {
          // If allSlots not provided, try to create Date object from date string
          const blockedDate = new Date(dateStr + "T00:00:00");
          if (!isNaN(blockedDate.getTime())) {
            const slots3h = generateDefaultTimeSlots(blockedDate, 3);
            const slots5h = generateDefaultTimeSlots(blockedDate, 5);
            allSlots = [...new Set([...slots3h, ...slots5h])].sort();
          }
        }
        // Remove cancelled time slot
        const remainingTimes = allSlots.filter(
          (slot) => slot !== normalizedTime
        );
        // Update to partial block
        await saveBlockedDate({ date: dateStr, times: remainingTimes });
      } else {
        // Normal case: delete single time slot
        await deleteBlockedTime(dateStr, normalizedTime);
      }

      // Re-fetch from backend to ensure sync
      const freshData = await getBlockedDates();
      setBlockedDates(freshData);
    } catch (err) {
      console.error("Failed to delete blocked time slot:", err);
      alert("Failed to unblock time, please try again.");
    }
  };

  const handleBlockTime = async (dateStr, time, allSlots = []) => {
    try {
      // Ensure time format is "HH:MM"
      const normalizedTime = time.includes(":")
        ? time
        : `${time.padStart(2, "0")}:00`;

      const existingBlock = blockedDates.find((b) => b.date === dateStr);
      let updatedBlockedDate;
      let newTimes;

      if (existingBlock) {
        // If entire date is already blocked (times is empty array), first unblock full day, add single time slot
        if (existingBlock.times.length === 0) {
          newTimes = [normalizedTime];
        } else {
          // If date exists, add time slot
          if (!existingBlock.times.includes(normalizedTime)) {
            newTimes = [...existingBlock.times, normalizedTime];
          } else {
            // If time slot already exists, return directly
            return;
          }
        }
      } else {
        // If date doesn't exist, create new record
        newTimes = [normalizedTime];
      }

      // Check if all time slots are blocked
      const allSlotsSet = new Set(allSlots);
      const blockedTimesSet = new Set(newTimes);
      const allBlocked = allSlots.every((slot) => blockedTimesSet.has(slot));

      // If all time slots are blocked, convert to blocking entire day (times is empty array)
      if (allBlocked && allSlots.length > 0) {
        updatedBlockedDate = { date: dateStr, times: [] };
      } else {
        updatedBlockedDate = { date: dateStr, times: newTimes };
      }

      await saveBlockedDate(updatedBlockedDate);

      // Re-fetch from backend to ensure sync
      const freshData = await getBlockedDates();
      setBlockedDates(freshData);
    } catch (err) {
      console.error("Failed to save blocked time slot:", err);
      alert("Failed to block time, please try again.");
    }
  };

  // Convert date object to local date string (YYYY-MM-DD) to avoid timezone issues
  const formatDateToLocalString = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    // Use 24-hour format, consistent with TimeSelectionPage
    return time;
  };

  const getBlockedTimesForDate = (dateStr, allSlots = []) => {
    const blocked = blockedDates.find((b) => b.date === dateStr);
    if (!blocked) return [];

    // If entire date is blocked (times is empty array), return all time slots
    if (blocked.times.length === 0) {
      return allSlots;
    }

    // Ensure returned time format is "HH:MM"
    return blocked.times.map((time) => {
      if (time.includes(":")) {
        return time;
      }
      // If not "HH:MM" format, try to convert
      return `${time.padStart(2, "0")}:00`;
    });
  };

  const isDateFullyBlocked = (dateStr) => {
    const blocked = blockedDates.find((b) => b.date === dateStr);
    return blocked && blocked.times.length === 0;
  };

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const dateStr = formatDateToLocalString(date);
    return bookings.filter((booking) => {
      const bookingDateStr = formatDateToLocalString(booking.date);
      return bookingDateStr === dateStr;
    });
  };

  const handleBlockDateSelect = (date) => {
    if (date) {
      setSelectedBlockDate(date);
    }
  };

  const handleBlockFullDate = async (date) => {
    try {
      // Use local date string to avoid timezone issues
      const dateStr = formatDateToLocalString(date);
      // Block entire date (times as empty array means entire date is blocked)
      const existingBlock = blockedDates.find((b) => b.date === dateStr);
      if (!existingBlock) {
        const newBlockedDate = { date: dateStr, times: [] };
        await saveBlockedDate(newBlockedDate);
        // Re-fetch from backend to ensure sync
        const freshData = await getBlockedDates();
        setBlockedDates(freshData);
      }
    } catch (err) {
      console.error("Failed to save blocked date:", err);
      alert("Failed to block date, please try again.");
    }
  };

  const handleBookingDateSelect = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className={styles.adminPage}>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>管理面板 | Admin Panel</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "bookings" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("bookings")}
          >
            预约管理 | Booking Management
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "dates" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("dates")}
          >
            日期管理 | Date Management
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "services" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("services")}
          >
            服务管理 | Service Management
          </button>
        </div>

        {activeTab === "services" && (
          <div className={styles.servicesSection}>
            <div className={styles.sectionHeader}>
              <h2>服务列表 | Service List</h2>
              <button
                className={styles.addServiceButton}
                onClick={handleAddService}
              >
                + 添加服务 | Add Service
              </button>
            </div>

            {/* Organize services by category */}
            {(() => {
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

              return Object.entries(servicesByCategory).map(
                ([category, categoryServices]) => (
                  <div key={category} className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      {categoryNames[category].cn} |{" "}
                      {categoryNames[category].en}
                    </h3>
                    <div className={styles.servicesGrid}>
                      {categoryServices.map((service) => (
                        <div key={service.id} className={styles.serviceCard}>
                          <div className={styles.serviceHeader}>
                            <h3 className={styles.serviceName}>
                              {service.nameCn} | {service.nameEn}
                            </h3>
                            <div className={styles.serviceActions}>
                              <button
                                className={styles.editButton}
                                onClick={() => handleEditService(service)}
                                title="编辑 | Edit"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteService(service.id)}
                                title="删除 | Delete"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className={styles.serviceInfo}>
                            <div className={styles.serviceMeta}>
                              <span className={styles.duration}>
                                {service.duration} | {service.durationEn}
                              </span>
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
              );
            })()}
          </div>
        )}

        {activeTab === "dates" && (
          <div className={styles.datesSection}>
            <div className={styles.sectionHeader}>
              <h2>屏蔽日期和时间 | Block Dates & Times</h2>
            </div>

            <Calendar
              selectedDate={selectedBlockDate}
              onDateSelect={handleBlockDateSelect}
              blockedDates={blockedDates
                .filter((b) => !b.times || b.times.length === 0)
                .map((b) => b.date)}
            />

            {/* Time slot management for selected date */}
            {selectedBlockDate && (
              <div className={styles.timeBlockSection}>
                <h3 className={styles.timeBlockTitle}>
                  {formatDate(formatDateToLocalString(selectedBlockDate))}{" "}
                  的时间段 | Time Slots
                </h3>

                <div className={styles.timeBlockActions}>
                  <button
                    className={styles.blockFullDateButton}
                    onClick={() => handleBlockFullDate(selectedBlockDate)}
                  >
                    屏蔽整个日期 | Block Full Date
                  </button>
                </div>

                <div className={styles.timeSlotsGrid}>
                  {(() => {
                    // 生成所有可能的默认时间槽（合并3小时和5小时服务的默认时间槽）
                    const slots3h = generateDefaultTimeSlots(
                      selectedBlockDate,
                      3
                    );
                    const slots5h = generateDefaultTimeSlots(
                      selectedBlockDate,
                      5
                    );
                    // 合并并去重
                    const allSlots = [
                      ...new Set([...slots3h, ...slots5h]),
                    ].sort();

                    const dateStr = formatDateToLocalString(selectedBlockDate);
                    const blockedTimes = getBlockedTimesForDate(
                      dateStr,
                      allSlots
                    );
                    const isFullyBlocked = isDateFullyBlocked(dateStr);

                    return allSlots.map((time) => {
                      // 确保时间格式一致：使用 "HH:MM" 格式进行比较
                      const normalizedTime = time; // generateDefaultTimeSlots 已经返回 "HH:MM" 格式
                      // 如果整个日期被屏蔽，所有时间槽都显示为已屏蔽
                      const isBlocked =
                        isFullyBlocked ||
                        blockedTimes.some(
                          (blockedTime) => blockedTime === normalizedTime
                        );

                      // 获取该日期的预订数据
                      const dateBookings =
                        getBookingsForDate(selectedBlockDate);
                      // 检查时间槽是否已被预订（检查3小时和5小时两种情况）
                      const isBooked3h = isTimeSlotBooked(
                        time,
                        dateBookings,
                        3
                      );
                      const isBooked5h = isTimeSlotBooked(
                        time,
                        dateBookings,
                        5
                      );
                      const isBooked = isBooked3h || isBooked5h;

                      // Find booking info for this time slot (for display)
                      const bookingAtTime = dateBookings.find((booking) => {
                        const bookingTime =
                          booking.selectedTime ||
                          booking.time ||
                          booking.startTime;
                        if (!bookingTime) return false;
                        const [bookingStartHours] = bookingTime
                          .split(":")
                          .map(Number);
                        const [timeHours] = time.split(":").map(Number);
                        return bookingStartHours === timeHours;
                      });

                      return (
                        <button
                          key={time}
                          className={`${styles.timeSlotButton} ${
                            isBlocked || isFullyBlocked ? styles.blocked : ""
                          } ${isBooked ? styles.booked : ""}`}
                          onClick={() => {
                            if (isBooked) return;
                            // Ensure stored time format is "HH:MM"
                            const timeToStore = normalizedTime;
                            if (isBlocked) {
                              // When unblocking time slot from full-day block, need to pass allSlots
                              handleUnblockTime(
                                dateStr,
                                timeToStore,
                                isFullyBlocked ? allSlots : undefined
                              );
                            } else {
                              // 使用外层已生成的所有时间槽列表
                              handleBlockTime(dateStr, timeToStore, allSlots);
                            }
                          }}
                          disabled={isBooked}
                          title={
                            isBooked
                              ? bookingAtTime
                                ? `已被预约 | Booked by ${
                                    bookingAtTime.customerName ||
                                    bookingAtTime.name
                                  }`
                                : "已被预约 | Booked"
                              : isBlocked
                              ? isFullyBlocked
                                ? "点击取消此时间槽的屏蔽 | Click to unblock this time slot"
                                : "点击取消屏蔽 | Click to unblock"
                              : "点击屏蔽此时间段 | Click to block"
                          }
                        >
                          {formatTime(time)}
                          {isBlocked && !isBooked && (
                            <span className={styles.blockedIcon}>✕</span>
                          )}
                          {isBooked && !isBlocked && (
                            <span className={styles.bookedIcon}>✓</span>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            <div className={styles.blockedDatesList}>
              <h3 className={styles.listTitle}>
                已屏蔽日期和时间列表 | Blocked Dates & Times List
              </h3>
              {blockedDates.length === 0 ? (
                <p className={styles.emptyMessage}>
                  暂无屏蔽日期 | No blocked dates
                </p>
              ) : (
                blockedDates.map((blocked) => {
                  const isFull = blocked.times.length === 0;
                  // 如果整个日期被屏蔽，生成所有时间槽用于显示
                  let timesToShow = blocked.times;
                  if (isFull) {
                    // 尝试从日期字符串创建 Date 对象
                    const blockedDate = new Date(blocked.date + "T00:00:00");
                    if (!isNaN(blockedDate.getTime())) {
                      const slots3h = generateDefaultTimeSlots(blockedDate, 3);
                      const slots5h = generateDefaultTimeSlots(blockedDate, 5);
                      timesToShow = [
                        ...new Set([...slots3h, ...slots5h]),
                      ].sort();
                    }
                  }
                  return (
                    <div key={blocked.date} className={styles.blockedDateItem}>
                      <div className={styles.blockedDateInfo}>
                        <span className={styles.blockedDateText}>
                          {formatDate(blocked.date)}
                          {isFull && (
                            <span className={styles.fullBlockLabel}>
                              {" "}
                              (全天 | Full Day)
                            </span>
                          )}
                        </span>
                        <div className={styles.blockedTimesList}>
                          {timesToShow.map((time) => (
                            <span key={time} className={styles.blockedTimeTag}>
                              {formatTime(time)}
                              <button
                                className={styles.removeTimeButton}
                                onClick={() => {
                                  // 如果是全天屏蔽，需要传入所有时间槽
                                  if (isFull) {
                                    const blockedDate = new Date(
                                      blocked.date + "T00:00:00"
                                    );
                                    if (!isNaN(blockedDate.getTime())) {
                                      const slots3h = generateDefaultTimeSlots(
                                        blockedDate,
                                        3
                                      );
                                      const slots5h = generateDefaultTimeSlots(
                                        blockedDate,
                                        5
                                      );
                                      const allSlotsForUnblock = [
                                        ...new Set([...slots3h, ...slots5h]),
                                      ].sort();
                                      handleUnblockTime(
                                        blocked.date,
                                        time,
                                        allSlotsForUnblock
                                      );
                                    }
                                  } else {
                                    handleUnblockTime(blocked.date, time);
                                  }
                                }}
                                title="取消屏蔽 | Unblock"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        className={styles.unblockButton}
                        onClick={() => handleUnblockDate(blocked.date)}
                      >
                        取消屏蔽 | Unblock
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className={styles.bookingsSection}>
            <div className={styles.sectionHeader}>
              <h2>预约日历 | Booking Calendar</h2>
            </div>

            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleBookingDateSelect}
              bookingDates={bookings.map((booking) => ({
                date: booking.date,
              }))}
              showBookingCount={true}
            />

            {/* 选中日期的预约列表 */}
            {selectedDate && (
              <div className={styles.selectedDateBookings}>
                <h3 className={styles.selectedDateTitle}>
                  {formatDate(formatDateToLocalString(selectedDate))} 的预约 |
                  Bookings
                </h3>
                {getBookingsForDate(selectedDate).length === 0 ? (
                  <p className={styles.emptyMessage}>
                    该日期暂无预约 | No bookings for this date
                  </p>
                ) : (
                  <div className={styles.bookingsList}>
                    {getBookingsForDate(selectedDate).map((booking) => (
                      <div key={booking.id} className={styles.bookingCard}>
                        <div className={styles.bookingHeader}>
                          <div className={styles.bookingId}>
                            # {booking.displayId || booking.id}
                          </div>
                          {/* <span
                            className={`${styles.statusBadge} ${
                              styles[booking.status]
                            }`}
                          >
                            {booking.status === "confirmed"
                              ? "已确认 | Confirmed"
                              : booking.status === "pending"
                              ? "待确认 | Pending"
                              : "已取消 | Cancelled"}
                          </span> */}
                        </div>

                        <div className={styles.bookingContent}>
                          <div className={styles.bookingRow}>
                            <div className={styles.bookingLabel}>
                              时间 | Time:
                            </div>
                            <div className={styles.bookingValue}>
                              {booking.time}
                            </div>
                          </div>
                          <div className={styles.bookingRow}>
                            <div className={styles.bookingLabel}>
                              客户信息 | Customer:
                            </div>
                            <div className={styles.bookingValue}>
                              {booking.customerName}
                            </div>
                          </div>
                          <div className={styles.bookingRow}>
                            <div className={styles.bookingLabel}>
                              电话 | Phone:
                            </div>
                            <div className={styles.bookingValue}>
                              {booking.phone}
                            </div>
                          </div>
                          <div className={styles.bookingRow}>
                            <div className={styles.bookingLabel}>
                              邮箱 | Email:
                            </div>
                            <div className={styles.bookingValue}>
                              {booking.email}
                            </div>
                          </div>
                          <div className={styles.bookingRow}>
                            <div className={styles.bookingLabel}>
                              服务 | Service:
                            </div>
                            <div className={styles.bookingValue}>
                              {booking.service.nameCn} |{" "}
                              {booking.service.nameEn}
                            </div>
                          </div>
                          <div className={styles.bookingRow}>
                            <div className={styles.bookingLabel}>
                              价格 | Price:
                            </div>
                            <div className={styles.bookingValue}>
                              {booking.service.price}
                            </div>
                          </div>
                        </div>

                        {/* <div className={styles.bookingActions}>
                          <button
                            className={styles.actionButton}
                            onClick={() => {
                              alert(
                                "编辑功能开发中 | Edit feature coming soon"
                              );
                            }}
                          >
                            编辑 | Edit
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.cancelButton}`}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "确定要取消这个预约吗？| Are you sure you want to cancel this booking?"
                                )
                              ) {
                                setBookings(
                                  bookings.map((b) =>
                                    b.id === booking.id
                                      ? { ...b, status: "cancelled" }
                                      : b
                                  )
                                );
                              }
                            }}
                          >
                            取消 | Cancel
                          </button>
                        </div> */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 编辑/添加服务模态框 */}
        {editingService && (
          <div
            className={styles.modalOverlay}
            onClick={() => setEditingService(null)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2>
                {editingService.id
                  ? "编辑服务 | Edit Service"
                  : "添加服务 | Add Service"}
              </h2>
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label>中文名称 | Chinese Name *</label>
                  <input
                    type="text"
                    value={editingService.nameCn}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        nameCn: e.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>英文名称 | English Name *</label>
                  <input
                    type="text"
                    value={editingService.nameEn}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        nameEn: e.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>分类 | Category *</label>
                  <select
                    value={editingService.category}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        category: e.target.value,
                      })
                    }
                  >
                    <option value="本甲">本甲 | Basic Nails</option>
                    <option value="延长">延长 | Extension</option>
                    <option value="卸甲">卸甲 | Removal</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>价格 | Price *</label>
                  <input
                    type="text"
                    value={editingService.price}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: e.target.value,
                      })
                    }
                    placeholder="$55 or +$40"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>时长（中文）| Duration (CN) *</label>
                  <input
                    type="text"
                    value={editingService.duration}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        duration: e.target.value,
                      })
                    }
                    placeholder="1.5小时"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>时长（英文）| Duration (EN) *</label>
                  <input
                    type="text"
                    value={editingService.durationEn}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        durationEn: e.target.value,
                      })
                    }
                    placeholder="1.5 hrs"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>描述（中文）| Description (CN)</label>
                  <textarea
                    value={editingService.descriptionCn}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        descriptionCn: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>描述（英文）| Description (EN)</label>
                  <textarea
                    value={editingService.description}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        description: e.target.value,
                      })
                    }
                    rows="3"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={editingService.isAddOn || false}
                      onChange={(e) =>
                        setEditingService({
                          ...editingService,
                          isAddOn: e.target.checked,
                        })
                      }
                    />
                    附加服务 | Add-on Service
                  </label>
                </div>
                <div className={styles.modalActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setEditingService(null);
                      setShowAddService(false);
                    }}
                  >
                    取消 | Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveService}
                  >
                    保存 | Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
