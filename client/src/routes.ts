export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  menu: '/menu',
  tasks: {
    root: '/tasks',
    views: '/tasks/views',
    // `day`, `week`, `all` and `new` are reserved; custom view ids are UUIDs, so none collide.
    list: '/tasks/views/:viewId',
    createView: '/tasks/views/new',
    search: '/tasks/search',
    create: '/tasks/new',
    // `search` and `new` are static siblings, so they outrank `:taskId`.
    details: '/tasks/:taskId',
  },
  notes: {
    root: '/notes',
    views: '/notes/views',
    list: '/notes/views/:id',
    create: '/notes/new',
    details: '/notes/:id',
    update: '/notes/:id/edit',
  },
  expenses: {
    root: '/expenses',
    views: '/expenses/views',
    list: '/expenses/views/:id',
  },
};

// Path segments of the nested tasks routes, relative to `routes.tasks.root`.
export const TASKS_CHILD_PATHS = {
  createTask: 'new',
  createView: 'views/new',
  search: 'search',
  task: ':taskId',
  view: 'views/:viewId',
};
