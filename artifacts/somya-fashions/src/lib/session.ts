export const getSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("somya_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("somya_session_id", sessionId);
  }
  return sessionId;
};
