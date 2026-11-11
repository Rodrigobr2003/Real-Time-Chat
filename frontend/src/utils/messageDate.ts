const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABEL_MAX_DAYS = 6;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const getDayKey = (date: string) => startOfDay(new Date(date)).getTime();

export const formatDayLabel = (date: string) => {
  const day = startOfDay(new Date(date));
  const daysAgo = Math.round(
    (startOfDay(new Date()).getTime() - day.getTime()) / DAY_MS,
  );

  if (daysAgo === 0) return "Hoje";
  if (daysAgo === 1) return "Ontem";

  if (daysAgo > 1 && daysAgo <= WEEKDAY_LABEL_MAX_DAYS) {
    return capitalize(day.toLocaleDateString("pt-BR", { weekday: "long" }));
  }

  return day.toLocaleDateString("pt-BR");
};
