const c = {
    data() {
        return {
            appInfo: '',
            homePage: 'https://docs.r-xnoro.com/jsonbox',
            repository: ''
        }
    },
    created() {
        this.appInfo = window.api.getDescription() + ' - v' + window.api.getVersion('jsonbox')
        window.api.getRepository((r) => {
            this.repository = r;
        });
    },
    methods: {
        openUrl(e, name) {
            e.preventDefault();
            if('homePage' == name) {
                window.api.openUrl(this.homePage);
            } else {
                window.api.openUrl(this.repository);
            }
        }
    }
};
Vue.createApp(c).mount('#app');