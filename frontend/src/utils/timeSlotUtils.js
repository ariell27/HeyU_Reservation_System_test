/**
 * 时间槽工具函数
 * 统一管理时间槽生成和验证逻辑
 */

// 从服务时长字符串中提取小时数
export const parseDuration = (duration) => {
  if (!duration) return 3; // 默认3小时
  const match = duration.match(/(\d+)\s*小时/);
  return match ? parseInt(match[1], 10) : 3;
};

// 根据日期获取营业结束时间
export const getEndHour = (date) => {
  if (!date) return 19; // 默认19:00
  const dayOfWeek = date.getDay(); // 0 = 周日, 1 = 周一, 2 = 周二, 3 = 周三, 4 = 周四, 5 = 周五, 6 = 周六
  // 周二和周四：22:00，其他日期：19:00
  return dayOfWeek === 2 || dayOfWeek === 4 ? 22 : 19;
};

// 检查时间段是否有足够的时长完成服务
export const isTimeSlotValid = (time, serviceDuration, endHour) => {
  const [hours] = time.split(":").map(Number);
  // 检查开始时间加上服务时长是否超过营业结束时间
  return hours + serviceDuration <= endHour;
};

// 判断是否为周二/周四18:00之后
export const isEveningTime = (time, date) => {
  if (!date) return false;
  const dayOfWeek = date.getDay();
  if (dayOfWeek !== 2 && dayOfWeek !== 4) return false; // 不是周二或周四
  const [hours] = time.split(":").map(Number);
  return hours >= 18; // 18:00及之后
};

// 检查时间槽是否与已预订冲突
export const isTimeSlotBooked = (time, bookings, serviceDuration) => {
  if (!bookings || bookings.length === 0) return false;

  const [timeHours] = time.split(":").map(Number);
  const timeEnd = timeHours + serviceDuration;

  return bookings.some((booking) => {
    // 从后端返回的预订数据中获取时间：selectedTime 或 time 或 startTime
    const bookingTime =
      booking.selectedTime || booking.time || booking.startTime;
    if (!bookingTime) return false;

    const [bookingStartHours] = bookingTime.split(":").map(Number);
    // 从服务对象中获取时长，如果没有则使用默认值
    const bookingDuration = booking.service?.duration
      ? parseDuration(booking.service.duration)
      : booking.serviceDuration || parseDuration(booking.duration) || 3;
    const bookingEnd = bookingStartHours + bookingDuration;

    // 冲突条件：时间槽开始时间 < 预订结束时间 且 时间槽开始时间 + 服务时长 > 预订开始时间
    return timeHours < bookingEnd && timeEnd > bookingStartHours;
  });
};

/**
 * 将日期对象转换为本地日期字符串 (YYYY-MM-DD)，避免时区问题
 * @param {Date} date - 日期对象
 * @returns {string} 本地日期字符串
 */
export const formatDateToLocalString = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 检查时间槽是否被 block
export const isTimeSlotBlocked = (time, date, blockedDates) => {
  if (!date || !blockedDates || blockedDates.length === 0) return false;

  // 使用本地日期字符串，避免时区问题
  const dateStr = formatDateToLocalString(date);
  const blockedDate = blockedDates.find((bd) => bd.date === dateStr);

  if (!blockedDate) return false;

  // 如果 times 数组为空，表示整个日期被 block
  if (!blockedDate.times || blockedDate.times.length === 0) {
    return true;
  }

  // 检查特定时间段是否被 block
  // 对于 block 的时间段，我们需要检查时间槽是否与 block 的时间段重叠
  // 这里假设 block 的时间段是精确的时间点，如果时间槽的开始时间匹配，则被 block
  return blockedDate.times.includes(time);
};

/**
 * 生成默认时间槽（用于预约界面和管理界面）
 * 根据服务时长显示不同的默认时间槽：
 * - 5小时服务：["09:00", "14:00"]
 * - 3小时服务：["09:00", "12:00", "15:00"]，周二/周四还会包含 "18:00"
 * @param {Date} date - 日期（可选，用于确定是否包含18:00）
 * @param {number} serviceDuration - 服务时长（小时）
 * @returns {Array<string>} 默认时间槽数组
 */
export const generateDefaultTimeSlots = (date = null, serviceDuration = 3) => {
  let defaultSlots;
  
  if (serviceDuration === 5) {
    // 5小时服务：显示 9:00 和 14:00
    defaultSlots = ["09:00", "14:00"];
  } else {
    // 3小时服务：显示 9:00、12:00、15:00
    defaultSlots = ["09:00", "12:00", "15:00"];
    
    // 如果是周二或周四，且服务是3小时，添加18:00
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
 * 生成所有可能的时间槽（用于管理界面）
 * @param {Date} date - 日期（可选，用于确定营业时间）
 * @param {Object} options - 配置选项
 * @param {number} options.startHour - 开始小时（默认 9）
 * @param {number} options.endHour - 结束小时（默认根据日期计算，或使用传入值）
 * @param {number} options.interval - 时间间隔（分钟，默认 30）
 * @returns {Array<string>} 时间槽数组，格式为 ["09:00", "09:30", ...]
 */
export const generateAllTimeSlots = (date = null, options = {}) => {
  const { startHour = 9, endHour = null, interval = 30 } = options;

  // 如果没有指定 endHour，根据日期计算
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
 * 生成可用时间槽（用于预约界面，考虑预订和 block）
 * @param {Date} date - 日期
 * @param {Object} service - 服务对象
 * @param {Array} bookings - 预订列表
 * @param {Array} blockedDates - 被屏蔽的日期列表
 * @returns {Array<string>} 可用时间槽数组
 */
export const generateAvailableTimeSlots = (
  date,
  service,
  bookings = [],
  blockedDates = []
) => {
  const slotsSet = new Set(); // 使用Set去重
  const endHour = getEndHour(date); // 根据日期获取结束时间

  if (!service) {
    // 如果没有选择服务，返回空数组
    return [];
  }

  // 检查整个日期是否被 block
  if (isTimeSlotBlocked("00:00", date, blockedDates)) {
    return [];
  }

  const serviceDuration = parseDuration(service.duration);
  // 根据服务时长生成默认时间槽
  const defaultSlots = generateDefaultTimeSlots(date, serviceDuration);

  // 1. 如果没有预订，返回默认时间槽
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

  // 2. 如果有预订，动态计算可用时间槽
  // 2.1 添加默认时间槽（如果有效且不与预订冲突且不被 block）
  defaultSlots.forEach((time) => {
    if (
      isTimeSlotValid(time, serviceDuration, endHour) &&
      !isTimeSlotBooked(time, bookings, serviceDuration) &&
      !isTimeSlotBlocked(time, date, blockedDates)
    ) {
      slotsSet.add(time);
    }
  });

  // 2.2 如果默认时间槽中已经包含18:00（3小时服务在周二/周四），则不需要单独添加
  // 因为 generateDefaultTimeSlots 已经处理了18:00的添加逻辑

  // 2.3 对于每个预订，计算上一个和下一个可用时间
  bookings.forEach((booking) => {
    // 从后端返回的预订数据中获取时间：selectedTime 或 time 或 startTime
    const bookingTime =
      booking.selectedTime || booking.time || booking.startTime;
    if (!bookingTime) return; // 如果没有时间，跳过这个预订

    const [bookingStartHours] = bookingTime.split(":").map(Number);
    // 从服务对象中获取时长，如果没有则使用默认值
    const bookingDuration = booking.service?.duration
      ? parseDuration(booking.service.duration)
      : booking.serviceDuration || parseDuration(booking.duration) || 3;
    const bookingEnd = bookingStartHours + bookingDuration;

    // 计算上一个可用时间：从默认时间槽中找到满足条件的
    defaultSlots.forEach((defaultTime) => {
      const [defaultHours] = defaultTime.split(":").map(Number);
      // 上一个可用时间条件：defaultTime + serviceDuration <= bookingStartHours
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

    // 计算下一个可用时间：预订结束时间
    const nextAvailableTime = `${bookingEnd.toString().padStart(2, "0")}:00`;
    if (
      isTimeSlotValid(nextAvailableTime, serviceDuration, endHour) &&
      !isTimeSlotBooked(nextAvailableTime, bookings, serviceDuration) &&
      !isTimeSlotBlocked(nextAvailableTime, date, blockedDates)
    ) {
      // 检查是否为周二/周四晚上（18:00之后），如果是且服务是5小时，则不添加
      if (!(isEveningTime(nextAvailableTime, date) && serviceDuration === 5)) {
        slotsSet.add(nextAvailableTime);
      }
    }
  });

  // 2.4 过滤冲突：移除与预订冲突或被 block 的时间槽
  // 同时检查时间间隔：如果时间槽与最近的预订结束时间的间隔小于服务时长，则不显示
  const finalSlots = Array.from(slotsSet).filter((time) => {
    // 检查是否被 block
    if (isTimeSlotBlocked(time, date, blockedDates)) {
      return false;
    }

    // 检查是否与预订冲突
    if (isTimeSlotBooked(time, bookings, serviceDuration)) {
      return false;
    }

    // 检查是否为周二/周四晚上（18:00之后），如果是且服务是5小时，则不显示
    if (isEveningTime(time, date) && serviceDuration === 5) {
      return false;
    }

    // 检查是否有足够的时长
    if (!isTimeSlotValid(time, serviceDuration, endHour)) {
      return false;
    }

    const [timeHours] = time.split(":").map(Number);

    // 检查18点之前开始的场次必须在19:00及之前结束
    // 如果时间槽在18:00之前开始，那么它必须在19:00之前结束
    if (timeHours < 18) {
      if (timeHours + serviceDuration > 19) {
        return false; // 18点之前开始的场次不能在19:00之后结束
      }
    }

    // 检查时间间隔：如果时间槽与最近的预订结束时间的间隔小于服务时长，则不显示
    
    // 找到所有预订的结束时间
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

    // 如果时间槽在某个预订结束时间之后，检查间隔
    // 但18:00是周二/周四的特殊时间槽，不受间隔限制
    const is18Slot = timeHours === 18;
    const isTuesdayOrThursday = date && (date.getDay() === 2 || date.getDay() === 4);
    
    if (!(is18Slot && isTuesdayOrThursday)) {
      // 对于非18:00时间槽，或者非周二/周四，检查间隔
      for (const bookingEnd of bookingEndTimes) {
        if (timeHours > bookingEnd) {
          // 计算间隔（小时）
          const interval = timeHours - bookingEnd;
          // 如果间隔小于服务时长，则不显示（除非时间槽就是预订结束时间本身）
          if (interval < serviceDuration) {
            return false;
          }
        }
      }
    }

    return true;
  });

  // 转换为数组并排序
  return finalSlots.sort();
};
