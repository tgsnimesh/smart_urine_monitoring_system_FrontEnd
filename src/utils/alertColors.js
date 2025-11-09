export const getAlertColor = (severity) => {
  switch (severity?.toUpperCase()) {
    case "GREEN":
      return "#28a745";
    case "YELLOW":
      return "#ffc107";
    case "RED":
      return "#dc3545";
    default:
      return "#6c757d";
  }
};
