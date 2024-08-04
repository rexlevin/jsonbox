import Settings from '@/components/Settings.vue';

const router = createRouter({
    routes: [
        // {
        //     path: '/',
        //     name: 'home',
        //     component: () => import('@/views/Home.vue')
        // },
        // {
        //     path: '/about',
        //     name: 'about',
        //     component: () => import('@/components/About.vue')
        // },
        {
            path: '/settings',
            name: 'settings',
            component: Settings
        }
    ]
});