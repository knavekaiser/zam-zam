module.exports = {
  appName: "BIZ APP",

  responseFn: {
    success: (res, data, message = "Success") => {
      return res.status(200).send({
        success: true,
        ...data,
        message,
      });
    },
    error: (
      res,
      errors = {},
      message = "Some error occurred. Please try again later.",
      statusCode = 200
    ) => {
      return res.status(statusCode).send({
        success: false,
        message,
        errors,
      });
    },
  },
  responseStr: {
    login_successful: "Login successful",
    invalid_cred: "Invalid credentials",
    register_successful: "Registeration successful. Please Log in",
    otp_sent: "Otp has been sent successfully.",
    otp_not_found: "Please resend OTP",
    wrong_otp:
      "Incorrect Code. Please enter the correct code. {NUM} attempts left",
    too_many_attempts_to_reset_password:
      "Too many attempts to reset password. Please send the OTP again.",
    otp_sent_already: "OTP has been sent. Please try again after few minutes.",
    password_reset_successful: "Password reset successful. Please Log in",
    otp_sms_failed: "Something went wrong. Please try again later.",
    email_doesnt_exists: "Email doesn't exists",
    registration_successful_pending_activation:
      "Registration successful. Please wait till your account is activated.",
    account_pending_activation: "Please wait till your account is activated.",
    account_deactivated:
      "Your account has been deactivated. Please contact support.",

    record_created: "Record created successfully",
    record_updated: "Record updated successfully",
    record_not_found: "Record not found",
    record_deleted: "Record has been deleted successfully",
    delete_requested: "Record has been requested for deletion",
    records_created: "{num} records created successfully",
    records_updated: "{num} record updated successfully",
    records_deleted: "{num} records has been deleted successfully",

    field_required: "{field} is required",
    fields_required: "{fields} are required",

    domain_not_specified: "Domain not specified",

    file_too_large:
      "File is too large. Please provide files that are less that {maxSize}",
    unsupported_file_type: "Only {fileTypes} are supported",

    success: "Success",
    unauthorized: "Unauthorized",
    forbidden: "Forbidden",
  },

  smsTemplate: {
    account_activated: `আপনার অ্যাকাউন্ট অ্যাক্টিভ করা হয়েছে।
    জম-জম টাওয়ার`,
    money_deposited: `প্রিয় {name}, ৳{amount} জমা হয়েছে।
    জম-জম টাওয়ার`,
    money_withdrawed: `প্রিয় {name}, ৳{amount} তোলা হয়েছে।
    জম-জম টাওয়ার`,
    password_otp: `প্রিয় {name}, আপনার কোড {otp}।
    জম-জম টাওয়ার`,
  },

  uploadDir: "/assets/uploads",
  otpTimeout: 120, //in seconds
  passwordResetOtpAttepts: 5,
  supportedImageSizes: 5, // 5MB
  supportedImageTypes: /jpeg|jpg|png|svg|ico|css|webp/,
  supportedFileSizes: 10, // 10MB
  supportedFileTypes: /jpeg|jpg|png|svg|pdf|ico|css/,
};
