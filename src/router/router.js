import {createRouter, createWebHashHistory} from 'vue-router';
import Settings from '../components/Settings.vue';

const router = createRouter({
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('../components/JsonBox.vue')
        },
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
    ],
    history: createWebHashHistory()
});

export default router;