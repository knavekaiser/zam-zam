const fetch = require("node-fetch");

exports.sendSms = ({ to, message }) => {
  if (process.env.MODE === "development") {
    console.log(to, message);
    return {
      response_code: 202,
      message_id: 707443,
      success_message: `SMS Submitted Successfully ${
        typeof to === "string" ? 1 : to.length
      }`,
      error_message: "",
      success: true,
    };
  }
  return fetch(
    `https://bulksmsbd.net/api/smsapi?${new URLSearchParams({
      api_key: process.env.SMS_API_KEY,
      type: "text",
      number: to,
      senderid: "8809617611020",
      message,
    })}`,
    { method: "POST" }
  )
    .then((res) => res.json())
    .then((data) => ({ ...data, success: data.response_code === 202 }));
};
