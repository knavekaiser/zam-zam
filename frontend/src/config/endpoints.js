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
  milestones: `${baseApiUrl}/api/milestones`,
  incomes: `${baseApiUrl}/api/incomes`,
  expenses: `${baseApiUrl}/api/expenses`,
  expenseCategories: `${baseApiUrl}/api/expenses/categories`,
  deposits: `${baseApiUrl}/api/deposits`,
  withdrawals: `${baseApiUrl}/api/withdrawals`,
  members: `${baseApiUrl}/api/members`,
  suppliers: `${baseApiUrl}/api/suppliers`,
  bills: `${baseApiUrl}/api/bills`,
  billItems: `${baseApiUrl}/api/bills/items`,
  billCharges: `${baseApiUrl}/api/bills/charges`,
  findMembers: `${baseApiUrl}/api/members/find`,
  sendMessageToMembers: `${baseApiUrl}/api/members/send-sms`,
  roles: `${baseApiUrl}/api/roles`,
  staffs: `${baseApiUrl}/api/staffs`,
  permissions: `${baseApiUrl}/api/permissions`,
  feed: `${baseApiUrl}/api/feed`,
  likePost: `${baseApiUrl}/api/feed/_id/like`,
  unlikePost: `${baseApiUrl}/api/feed/_id/unlike`,
  feedComments: `${baseApiUrl}/api/feed/post_id/comments`,

  devices: `${baseApiUrl}/api/devices`,
};

export default endpoints;
