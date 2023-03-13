const baseApiUrl = "";

const endpoints = {
  baseApiUrl,
  signUp: `${baseApiUrl}/api/members/signup`,
  signIn: `${baseApiUrl}/api/members/signin`,
  profile: `${baseApiUrl}/api/members/profile`,

  forgotPassword: `${baseApiUrl}/api/members/forgot-password`,
  resetPassword: `${baseApiUrl}/api/members/reset-password`,
  logout: `${baseApiUrl}/api/members/logout`,

  staffSignUp: `${baseApiUrl}/api/staffs/signup`,
  staffSignIn: `${baseApiUrl}/api/staffs/signin`,
  staffProfile: `${baseApiUrl}/api/staffs/profile`,

  staffForgotPassword: `${baseApiUrl}/api/staffs/forgot-password`,
  staffResetPassword: `${baseApiUrl}/api/staffs/reset-password`,
  staffLogout: `${baseApiUrl}/api/staffs/logout`,

  dashboardData: `${baseApiUrl}/api/dashboard-data`,
  deposits: `${baseApiUrl}/api/deposits`,
  expenses: `${baseApiUrl}/api/expenses`,
  withdrawals: `${baseApiUrl}/api/withdrawals`,
  members: `${baseApiUrl}/api/members`,
  roles: `${baseApiUrl}/api/roles`,
  staffs: `${baseApiUrl}/api/staffs`,
  permissions: `${baseApiUrl}/api/permissions`,
};

export default endpoints;
