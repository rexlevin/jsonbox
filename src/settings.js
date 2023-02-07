const c = {
    data() {
        return {
            s: {
                saveSession: false,
                closeAppConfirm: false
            },
            appInfo: '',
            homePage: 'https://docs.r-xnoro.com/jsonbox',
            repository: ''
        }
    },
    created() {
        window.api.getSettings(r => {
            if(undefined == r) return;
            // this.s = r;
            this.s = Object.assign({
                saveSession: false,
                closeAppConfirm: false
            }, r);
        });
        this.appInfo = window.api.getDescription() + ' - v' + window.api.getVersion('jsonbox')
        window.api.getRepository((r) => {
            this.repository = r;
        });
    },
    mounted() {
        document.addEventListener('keyup', (e) => {
            e.preventDefault();
            if(e.key === 'Escape') {
                window.api.exitSettings();
            }
        });
    },
    methods: {
        changeCloseAppConfirm() {
            console.info(this.s.closeAppConfirm);
            this.s.closeAppConfirm = !this.s.closeAppConfirm;
            console.info(this.s.closeAppConfirm);
            window.api.saveSettings(JSON.stringify(this.s));
        },
        changeSaveSession() {
            console.info(this.s.saveSession);
            this.s.saveSession = !this.s.saveSession;
            console.info(this.s.saveSession);
            window.api.saveSettings(JSON.stringify(this.s));
        },
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