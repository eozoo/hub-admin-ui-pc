export default {
  commons: {
    button: {
      query: 'Query',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      clean: 'Clear',
      status: 'Change Status',
      preview: 'Preview',
      download: 'Download',
      import: 'Import',
      export: 'Export',
      config: 'Configure',
      test: 'Test',
      exec: 'Run',
      quit: 'Force Sign Out',
      diagram: 'Organization Chart'
    },
    menu: {
      root: 'Cowave',
      cowave: 'Cowave Website',
      dashboard: 'Dashboard',
      home: {
        root: 'Home Portal',
        service: 'Authorization Services',
        user: 'Authorized Users',
        app: 'App Navigation'
      },
      meter: {
        workspace: 'Workspace',
        env: { root: 'Environments', credential: 'Credentials' },
        build: { root: 'Builds' },
        test: { root: 'Testing', ui: 'UI Testing' },
        archive: { root: 'Release Archive' },
        develop: {
          root: 'Development',
          form: 'Form Builder',
          application: 'Applications',
          model: 'Models',
          database: 'Databases',
          table: 'Database Tables'
        }
      },
      flow: {
        root: 'Workflows',
        manage: 'Workflow Configuration',
        model: 'Model Designer',
        deploy: 'Deployments',
        instance: 'Instances',
        owner: {
          task: 'My Workflows',
          leave: 'Leave Request',
          meeting: 'Meeting Booking',
          purchase: 'Purchase Request'
        }
      },
      monitor: {
        root: 'System Monitoring',
        actuator: 'Service Health',
        nacos: 'Service Registry',
        grafana: 'Environment Monitoring',
        prometheus: 'Environment Metrics',
        alert: 'Alerts',
        log: 'Operation Logs',
        online: 'Online Users',
        cache: 'Cache Monitoring'
      },
      sys: {
        root: 'System Management',
        tenant: 'Tenants',
        identity: 'Identity & Access',
        user: 'Users',
        role: 'Roles',
        menu: 'Menu Permissions',
        scope: 'Data Permissions',
        attach: 'Files',
        dept: 'Departments',
        post: 'Positions',
        dict: 'Dictionaries',
        config: 'System Configuration',
        params: 'System Parameters',
        ldap: 'LDAP Authentication',
        auth: 'Authentication',
        doc: {
          api: 'Developer Documentation',
          admin: 'Admin API',
          job: 'Scheduled Job API',
          meter: 'CI API'
        },
        schedule: {
          root: 'Scheduled Jobs',
          refresh: 'Reload',
          logQuery: 'Query Logs',
          logExport: 'Export Logs',
          logDelete: 'Delete Logs'
        },
        oauth2: {
          root: 'OAuth2 Authentication',
          client: 'Authorized Apps',
          gitlab: 'OAuth2 Authentication',
          configQuery: 'Query OAuth2 Configuration',
          configEdit: 'Edit OAuth2 Configuration',
          userQuery: 'Query OAuth2 Users',
          userEdit: 'Edit OAuth2 Users',
          userDelete: 'Delete OAuth2 Users'
        }
      }
    }
  },
  tenant: {
    title: { system: 'Hub Management', cowave: 'Cowave', open: 'Open Hub' },
    button: {
      manager: 'Manage Administrators',
      manager_add: 'Add Administrator',
      manager_remove: 'Remove Administrator'
    }
  },
  user: { button: { grant: 'Assign Roles', passwd: 'Reset Password' } },
  role: {
    button: {
      menus: 'Menu Permissions',
      members: 'Role Members',
      members_grant: 'Add Member',
      members_cancel: 'Remove Member'
    }
  },
  dept: {
    button: {
      members: 'Department Members',
      members_add: 'Add Member',
      members_remove: 'Remove Member',
      positions: 'Department Positions',
      positions_add: 'Add Position',
      positions_remove: 'Remove Position'
    }
  },
  config: { button: { reset: 'Restore Defaults' } }
}
