importScripts(
  "https://www.gstatic.com/firebasejs/9.0.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyB-n2HvEd9v1XakK-9zWbiGVKhS66-qIBA",
  authDomain: "zam-zam-tower.firebaseapp.com",
  projectId: "zam-zam-tower",
  storageBucket: "zam-zam-tower.appspot.com",
  messagingSenderId: "472145187037",
  appId: "1:472145187037:web:e7bcfe0ed4598f798e8b34",
  measurementId: "G-YFTJP7N8VH",
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = payload.notification;
});
