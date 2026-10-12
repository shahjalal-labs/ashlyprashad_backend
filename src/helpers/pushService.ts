import webpush from "web-push";

const publicVapidKey =
  process.env.VAPID_PUBLIC_KEY || "YOUR_VAPID_PUBLIC_KEY";
const privateVapidKey =
  process.env.VAPID_PRIVATE_KEY || "YOUR_VAPID_PRIVATE_KEY";

webpush.setVapidDetails(
  process.env.VAPID_MAILTO || "mailto:admin@example.com",
  publicVapidKey,
  privateVapidKey
);

export { webpush, publicVapidKey };
