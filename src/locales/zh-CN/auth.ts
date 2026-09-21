export default {
  login: {
    stateChanged: '登录状态已更新，请重试',
    title: '登录',
    account: '账号',
    password: '密码',
    captcha: '验证码',
    remember: '记住账号',
    forgot: '忘记密码？',
    submit: '登 录',
    submitting: '登 录 中...',
    otherMethods: '其它方式登录',
    registerLink: '注册账号',
    ldapLink: '域账号登录',
    systemLink: '系统账号登录',
    changePasswordTip: '当前密码需要修改，请尽快更新密码',
    forgotTip: '请联系系统管理员重置密码',
    oauthUnavailable: '当前环境未配置该登录方式'
  },
  register: {
    title: '注册账号',
    nickname: '昵称',
    email: '邮箱',
    sendCode: '获取验证码',
    submit: '注 册',
    submitting: '注 册 中...',
    codeSent: '验证码已发送至邮箱',
    success: '注册成功，初始密码为：{password}'
  },
  ldap: {
    title: '域账号登录',
    account: '域账号'
  },
  mfa: {
    title: '二次认证',
    description: '请输入身份验证器中的动态验证码',
    code: '动态验证码',
    submit: '确认登录',
    expired: '二次认证会话已失效，请重新登录'
  },
  oauth: {
    processing: '正在完成第三方登录…',
    invalidState: '授权状态无效或已过期，请重新发起登录',
    unsupported: '该第三方登录方式尚未接入',
    failed: '第三方登录失败，请重试',
    backToLogin: '返回登录'
  },
  bind: {
    title: '完善账号信息', description: '首次使用第三方身份登录，请创建本地账号以继续使用系统。',
    account: '登录账号', name: '姓名', password: '登录密码', submit: '完成并登录',
    hint: '完成后可使用该账号和密码登录系统。', success: '账号创建成功',
    accountRequired: '请输入登录账号', accountInvalid: '账号需以字母开头，长度为 3–20 位，仅支持字母、数字和下划线',
    nameRequired: '请输入姓名', nameInvalid: '姓名不能超过 64 个字符',
    passwordRequired: '请输入登录密码', passwordInvalid: '密码需为 8–72 位，且包含字母和数字'
  },
  validation: {
    accountRequired: '请输入账号',
    accountLength: '账号长度必须介于 3 和 20 之间',
    passwordRequired: '请输入密码',
    captchaRequired: '请输入验证码',
    nicknameRequired: '请输入昵称',
    emailRequired: '请输入邮箱',
    emailInvalid: '邮箱格式不正确',
    ldapAccountRequired: '请输入域账号',
    mfaCodeRequired: '请输入动态验证码'
  }
}
