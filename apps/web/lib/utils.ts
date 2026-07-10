export const truncate = (text = "", limit: number) =>
  text.length > limit ? `${text.slice(0, limit)}...` : text;