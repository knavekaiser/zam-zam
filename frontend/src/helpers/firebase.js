import { initializeApp } from "firebase/app";
import { getMessaging, onMessage, getToken } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";
import { fingerprint } from "helpers";

const firebaseConfig = {
  apiKey: "AIzaSyB-n2HvEd9v1XakK-9zWbiGVKhS66-qIBA",
  authDomain: "zam-zam-tower.firebaseapp.com",
  projectId: "zam-zam-tower",
  storageBucket: "zam-zam-tower.appspot.com",
  messagingSenderId: "472145187037",
  appId: "1:472145187037:web:e7bcfe0ed4598f798e8b34",
  measurementId: "G-YFTJP7N8VH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  if ("notification" in payload) {
    new Notification(payload.notification.title, payload.notification);
  }
});

export async function requestPermission(updateDevice) {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = await fingerprint();
    localStorage.setItem("deviceId", deviceId);
  }
  const existingToken = localStorage.getItem("fcm-token");
  if (existingToken) {
    updateDevice({
      // add name if possible
      platform: navigator.userAgentData?.platform || "Device",
      deviceId,
      fcmToken: existingToken,
    });
  } else {
    getToken(messaging, {
      vapidKey:
        "BOgIBo10y_CqhgHmn5APMbISxmoayzWMh2uBdjDewwwEEIrAEuBKttg-D4J2XfGomoVyUgJjdnxTveWEaLeKruI",
    })
      .then(async (currentToken) => {
        if (currentToken) {
          localStorage.setItem("fcm-token", currentToken);
          updateDevice({
            // add name if possible
            platform: navigator.userAgentData?.platform || "Device",
            deviceId,
            fcmToken: currentToken,
          });
        } else {
          console.log(
            "No registration token available. Request permission to generate one."
          );
        }
      })
      .catch((err) => {
        console.log("An error occurred while retrieving token. ", err);
        // ...
      });
  }

  // messaging.onTokenRefresh(() => {
  //   messaging
  //     .getToken()
  //     .then(async (token) => {
  //       localStorage.setItem("fcm-token", token);
  //       updateDevice({
  //         // add name if possible
  //         platform: navigator.userAgentData?.platform || "Device",
  //         deviceId,
  //         fcmToken: token,
  //       });
  //     })
  //     .catch((err) => {
  //       console.log("Unable to retrieve new token:", err);
  //     });
  // });
  return Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      // granted
    } else {
      // show some error
    }
  });
}
