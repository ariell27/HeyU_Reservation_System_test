/**
 * Time slot utility functions
 * Unified management of time slot generation and validation logic
 */

// Extract hours from service duration string
export const parseDuration = (duration) => {
  if (!duration) return 3; // Default 3 hours
  const match = duration.match(/(\d+)\s*小时/);
  return match ? parseInt(match[1], 10) : 3;
};

// Get business closing hour based on date
export const getEndHour = (date) => {
  if (!date) return 19; // Default 19:00
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  // Tuesday and Thursday: 22:00, other days: 19:00
  return dayOfWeek === 2 || dayOfWeek === 4 ? 22 : 19;
};

// Check if time slot has sufficient duration to complete the service
export const isTimeSlotValid = (time, serviceDuration, endHour) => {
  const [hours] = time.split(":").map(Number);
  // Check if start time plus service duration exceeds business closing time
  return hours + serviceDuration <= endHour;
};

// Check if it's after 18:00 on Tuesday/Thursday
export const isEveningTime = (time, date) => {
  if (!date) return false;
  const dayOfWeek = date.getDay();
  if (dayOfWeek !== 2 && dayOfWeek !== 4) return false; // Not Tuesday or Thursday
  const [hours] = time.split(":").map(Number);
  return hours >= 18; // 18:00 and later
};

// Check if time slot conflicts with existing bookings
export const isTimeSlotBooked = (time, bookings, serviceDuration) => {
  if (!bookings || bookings.length === 0) return false;

  const [timeHours] = time.split(":").map(Number);
  const timeEnd = timeHours + serviceDuration;

  return bookings.some((booking) => {
    // Get time from backend booking data: selectedTime or time or startTime
    const bookingTime =
      booking.selectedTime || booking.time || booking.startTime;
    if (!bookingTime) return false;

    const [bookingStartHours] = bookingTime.split(":").map(Number);
    // Get duration from service object, use default value if not available
    const bookingDuration = booking.service?.duration
      ? parseDuration(booking.service.duration)
      : booking.serviceDuration || parseDuration(booking.duration) || 3;
    const bookingEnd = bookingStartHours + bookingDuration;

    // Conflict condition: time slot start < booking end AND time slot start + service duration > booking start
    return timeHours < bookingEnd && timeEnd > bookingStartHours;
  });
};

/**
 * Convert date object to local date string (YYYY-MM-DD), avoiding timezone issues
 * @param {Date} date - Date object
 * @returns {string} Local date string
 */
export const formatDateToLocalString = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Check if time slot is blocked
export const isTimeSlotBlocked = (time, date, blockedDates) => {
  if (!date || !blockedDates || blockedDates.length === 0) return false;

  // Use local date string to avoid timezone issues
  const dateStr = formatDateToLocalString(date);
  const blockedDate = blockedDates.find((bd) => bd.date === dateStr);

  if (!blockedDate) return false;

  // If times array is empty, the entire date is blocked
  if (!blockedDate.times || blockedDate.times.length === 0) {
    return true;
  }

  // Check if specific time period is blocked
  // For blocked time periods, we need to check if the time slot overlaps with the blocked time period
  // Here we assume blocked time periods are precise time points, if the time slot start time matches, it's blocked
  return blockedDate.times.includes(time);
};

/**
 * Generate default time slots (for booking interface and admin interface)
 * Display different default time slots based on service duration:
 * - 5-hour service: ["09:00", "14:00"]
 * - 3-hour service: ["09:00", "12:00", "15:00"], also includes "18:00" on Tuesday/Thursday
 * @param {Date} date - Date (optional, used to determine if 18:00 should be included)
 * @param {number} serviceDuration - Service duration (hours)
 * @returns {Array<string>} Default time slot array
 */
export const generateDefaultTimeSlots = (date = null, serviceDuration = 3) => {
  let defaultSlots;
  
  if (serviceDuration === 5) {
    // 5-hour service: display 9:00 and 14:00
    defaultSlots = ["09:00", "14:00"];
  } else {
    // 3-hour service: display 9:00, 12:00, 15:00
    defaultSlots = ["09:00", "12:00", "15:00"];
    
    // If it's Tuesday or Thursday, and service is 3 hours, add 18:00
    if (date) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 2 || dayOfWeek === 4) {
        defaultSlots.push("18:00");
      }
    }
  }

  return defaultSlots;
};

/**
 * Generate all possible time slots (for admin interface)
 * @param {Date} date - Date (optional, used to determine business hours)
 * @param {Object} options - Configuration options
 * @param {number} options.startHour - Start hour (default 9)
 * @param {number} options.endHour - End hour (default calculated based on date, or use provided value)
 * @param {number} options.interval - Time interval (minutes, default 30)
 * @returns {Array<string>} Time slot array, format: ["09:00", "09:30", ...]
 */
export const generateAllTimeSlots = (date = null, options = {}) => {
  const { startHour = 9, endHour = null, interval = 30 } = options;

  // If endHour is not specified, calculate based on date
  const finalEndHour = endHour !== null ? endHour : getEndHour(date);

  const slots = [];

  for (let hour = startHour; hour < finalEndHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(time);
    }
  }

  return slots;
};

/**
 * Generate available time slots (for booking interface, considering bookings and blocks)
 * @param {Date} date - Date
 * @param {Object} service - Service object
 * @param {Array} bookings - Booking list
 * @param {Array} blockedDates - Blocked dates list
 * @returns {Array<string>} Available time slot array
 */
export const generateAvailableTimeSlots = (
  date,
  service,
  bookings = [],
  blockedDates = []
) => {
  const slotsSet = new Set(); // Use Set to remove duplicates
  const endHour = getEndHour(date); // Get end time based on date

  if (!service) {
    // If no service is selected, return empty array
    return [];
  }

  // Check if the entire date is blocked
  if (isTimeSlotBlocked("00:00", date, blockedDates)) {
    return [];
  }

  const serviceDuration = parseDuration(service.duration);
  // Generate default time slots based on service duration
  const defaultSlots = generateDefaultTimeSlots(date, serviceDuration);

  // 1. If there are no bookings, return default time slots
  if (!bookings || bookings.length === 0) {
    defaultSlots.forEach((time) => {
      if (
        isTimeSlotValid(time, serviceDuration, endHour) &&
        !isTimeSlotBlocked(time, date, blockedDates)
      ) {
        slotsSet.add(time);
      }
    });

    const slots = Array.from(slotsSet).sort();
    return slots;
  }

  // 2. If there are bookings, dynamically calculate available time slots
  // 2.1 Add default time slots (if valid, not conflicting with bookings, and not blocked)
  defaultSlots.forEach((time) => {
    if (
      isTimeSlotValid(time, serviceDuration, endHour) &&
      !isTimeSlotBooked(time, bookings, serviceDuration) &&
      !isTimeSlotBlocked(time, date, blockedDates)
    ) {
      slotsSet.add(time);
    }
  });

  // 2.2 If default time slots already include 18:00 (3-hour service on Tuesday/Thursday), no need to add separately
  // because generateDefaultTimeSlots already handles the 18:00 addition logic

  // 2.3 For each booking, calculate previous and next available times
  bookings.forEach((booking) => {
    // Get time from backend booking data: selectedTime or time or startTime
    const bookingTime =
      booking.selectedTime || booking.time || booking.startTime;
    if (!bookingTime) return; // If no time, skip this booking

    const [bookingStartHours] = bookingTime.split(":").map(Number);
    // Get duration from service object, use default value if not available
    const bookingDuration = booking.service?.duration
      ? parseDuration(booking.service.duration)
      : booking.serviceDuration || parseDuration(booking.duration) || 3;
    const bookingEnd = bookingStartHours + bookingDuration;

    // Calculate previous available time: find from default time slots that meet the condition
    defaultSlots.forEach((defaultTime) => {
      const [defaultHours] = defaultTime.split(":").map(Number);
      // Previous available time condition: defaultTime + serviceDuration <= bookingStartHours
      if (defaultHours + serviceDuration <= bookingStartHours) {
        if (
          isTimeSlotValid(defaultTime, serviceDuration, endHour) &&
          !isTimeSlotBooked(defaultTime, bookings, serviceDuration) &&
          !isTimeSlotBlocked(defaultTime, date, blockedDates)
        ) {
          slotsSet.add(defaultTime);
        }
      }
    });

    // Calculate next available time: booking end time
    const nextAvailableTime = `${bookingEnd.toString().padStart(2, "0")}:00`;
    if (
      isTimeSlotValid(nextAvailableTime, serviceDuration, endHour) &&
      !isTimeSlotBooked(nextAvailableTime, bookings, serviceDuration) &&
      !isTimeSlotBlocked(nextAvailableTime, date, blockedDates)
    ) {
      // Check if it's Tuesday/Thursday evening (after 18:00), if yes and service is 5 hours, don't add
      if (!(isEveningTime(nextAvailableTime, date) && serviceDuration === 5)) {
        slotsSet.add(nextAvailableTime);
      }
    }
  });

  // 2.4 Filter conflicts: remove time slots that conflict with bookings or are blocked
  // Also check time intervals: if the interval between time slot and nearest booking end time is less than service duration, don't display
  const finalSlots = Array.from(slotsSet).filter((time) => {
    // Check if blocked
    if (isTimeSlotBlocked(time, date, blockedDates)) {
      return false;
    }

    // Check if conflicts with bookings
    if (isTimeSlotBooked(time, bookings, serviceDuration)) {
      return false;
    }

    // Check if it's Tuesday/Thursday evening (after 18:00), if yes and service is 5 hours, don't display
    if (isEveningTime(time, date) && serviceDuration === 5) {
      return false;
    }

    // Check if there's sufficient duration
    if (!isTimeSlotValid(time, serviceDuration, endHour)) {
      return false;
    }

    const [timeHours] = time.split(":").map(Number);

    // Check that sessions starting before 18:00 must end by 19:00
    // If time slot starts before 18:00, it must end before 19:00
    if (timeHours < 18) {
      if (timeHours + serviceDuration > 19) {
        return false; // Sessions starting before 18:00 cannot end after 19:00
      }
    }

    // Check time interval: if the interval between time slot and nearest booking end time is less than service duration, don't display
    
    // Find all booking end times
    const bookingEndTimes = [];
    bookings.forEach((booking) => {
      const bookingTime =
        booking.selectedTime || booking.time || booking.startTime;
      if (!bookingTime) return;
      const [bookingStartHours] = bookingTime.split(":").map(Number);
      const bookingDuration = booking.service?.duration
        ? parseDuration(booking.service.duration)
        : booking.serviceDuration || parseDuration(booking.duration) || 3;
      const bookingEnd = bookingStartHours + bookingDuration;
      bookingEndTimes.push(bookingEnd);
    });

    // If time slot is after a booking end time, check interval
    // But 18:00 is a special time slot on Tuesday/Thursday, not subject to interval restrictions
    const is18Slot = timeHours === 18;
    const isTuesdayOrThursday = date && (date.getDay() === 2 || date.getDay() === 4);
    
    if (!(is18Slot && isTuesdayOrThursday)) {
      // For non-18:00 time slots, or non-Tuesday/Thursday, check interval
      for (const bookingEnd of bookingEndTimes) {
        if (timeHours > bookingEnd) {
          // Calculate interval (hours)
          const interval = timeHours - bookingEnd;
          // If interval is less than service duration, don't display (unless the time slot is the booking end time itself)
          if (interval < serviceDuration) {
            return false;
          }
        }
      }
    }

    return true;
  });

  // Convert to array and sort
  return finalSlots.sort();
};
