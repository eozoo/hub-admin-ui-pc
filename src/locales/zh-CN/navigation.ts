export default {
  commons: {
    button: {
      query: '查询',
      create: '新增',
      edit: '修改',
      delete: '删除',
      clean: '清除',
      status: '修改状态',
      preview: '预览',
      download: '下载',
      import: '导入',
      export: '导出',
      config: '配置',
      test: '测试',
      exec: '执行',
      quit: '强退',
      diagram: '组织架构'
    },
    menu: {
      root: '控维通信',
      cowave: '控维官网',
      dashboard: '首页',
      home: {
        root: 'Home 门户',
        service: '授权服务',
        user: '授权用户',
        app: '应用导航'
      },
      meter: {
        workspace: '工作台',
        env: { root: '环境资源', credential: '凭据管理' },
        build: { root: '构建管理' },
        test: { root: '测试管理', ui: 'UI 测试' },
        archive: { root: '版本归档' },
        develop: {
          root: '开发设计',
          form: '表单构建',
          application: '应用管理',
          model: '模型管理',
          database: '数据库',
          table: '数据库表'
        }
      },
      flow: {
        root: '流程管理',
        manage: '流程配置',
        model: '模型设计',
        deploy: '流程部署',
        instance: '流程实例',
        owner: {
          task: '我的流程',
          leave: '请假申请',
          meeting: '会议预约',
          purchase: '采购申请'
        }
      },
      monitor: {
        root: '系统监控',
        actuator: '服务健康',
        nacos: '服务注册',
        grafana: '环境监控',
        prometheus: '环境指标',
        alert: '故障告警',
        log: '操作日志',
        online: '在线用户',
        cache: '缓存监控'
      },
      sys: {
        root: '系统管理',
        tenant: '租户管理',
        identity: '身份权限',
        user: '用户管理',
        role: '角色管理',
        menu: '菜单权限',
        scope: '数据权限',
        attach: '文件管理',
        dept: '部门管理',
        post: '岗位管理',
        dict: '字典管理',
        config: '系统配置',
        params: '系统参数',
        ldap: 'LDAP 认证',
        auth: '认证授权',
        doc: {
          api: '开发者文档',
          admin: '系统管理接口',
          job: '定时任务接口',
          meter: '持续集成接口'
        },
        schedule: {
          root: '定时任务',
          refresh: '重新加载',
          logQuery: '日志查询',
          logExport: '日志导出',
          logDelete: '日志删除'
        },
        oauth2: {
          root: 'OAuth2 认证',
          client: '授权应用',
          gitlab: 'OAuth2 认证',
          configQuery: 'OAuth2 配置查询',
          configEdit: 'OAuth2 配置修改',
          userQuery: 'OAuth2 用户查询',
          userEdit: 'OAuth2 用户修改',
          userDelete: 'OAuth2 用户删除'
        }
      }
    }
  },
  tenant: {
    title: { system: 'Hub 管理系统', cowave: '控维通信', open: 'Open Hub' },
    button: { manager: '管理员设置', manager_add: '新增管理员', manager_remove: '移除管理员' }
  },
  user: { button: { grant: '分配角色', passwd: '重置密码' } },
  role: {
    button: {
      menus: '菜单权限',
      members: '角色成员',
      members_grant: '添加成员',
      members_cancel: '移除成员'
    }
  },
  dept: {
    button: {
      members: '部门成员',
      members_add: '添加成员',
      members_remove: '移除成员',
      positions: '部门岗位',
      positions_add: '添加岗位',
      positions_remove: '移除岗位'
    }
  },
  config: { button: { reset: '恢复默认' } }
}
