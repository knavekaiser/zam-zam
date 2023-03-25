const admin = require("firebase-admin");

const { Device, Member, Staff } = require("../models");

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
  databaseURL: "https://zam-zam-tower.firebaseio.com",
});

exports.sendMessage = async ({ _ids, tokens, message }) => {
  if (!tokens) {
    tokens = await Device.find(
      {
        deviceId: {
          $in: await Promise.all([
            Member.find({ _id: { $in: _ids } }, "devices"),
            Staff.find({ _id: { $in: _ids } }, "devices"),
          ]).then(([members, staffs]) => [
            ...new Set(
              [...members, ...staffs].map((item) => item.devices).flat()
            ),
          ]),
        },
      },
      "fcmToken"
    ).then((data) => data.map((item) => item.fcmToken));
  }

  const msg = {
    notification: {
      title: message.title,
      body: message.body,
    },
    webpush: {
      headers: { Urgency: "high" },
      notification: {
        icon: "https://zz.9m.wtf/assets/Zam-Zam-1.png",
        requireInteraction: "true",
        body: message.body,
        ...message,
        // "https://imglarger.com/Images/before-after/ai-image-enlarger-1-after-2.jpg",
        // badge: "https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg",
      },
    },
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    await admin.messaging().send({ ...msg, token });
  }
};

exports.validateToken = async (token) => {
  try {
    // validate somehow
  } catch (error) {
    console.error(error);
    return null;
  }
};
