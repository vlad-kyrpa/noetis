export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  menu: '/menu',
  tasks: {
    root: '/tasks',
    views: '/tasks/views',
    list: '/tasks/views/:id',
    create: '/tasks/new',
    details: '/tasks/:id',
    update: '/tasks/:id/edit',
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
