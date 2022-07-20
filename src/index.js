const app = {
    data() {},
    created() {
        document.addEventListener('keyup', (e) => {
            if(e.ctrlKey && e.shiftKey && e.key == 'I'|'i') {
                window.api.devTools();
            }
            if(e.ctrlKey && e.key == 'r') {
                window.api.reload();
            }
        });
    },
    mounted() {
        let el = document.getElementById('ta');
        el.focus();
        // el.addEventListener('change', () => {
        //     if(undefined == el.value || '' == el.value.trim()) return;
        //     this.parse();
        // });
        el.addEventListener('keyup', (e) => {
            if(!(e.ctrlKey && e.key == 'v')) {
                return;
            }
            this.parse();
        });
        // el.addEventListener('paste', (e) => {
        //     e.preventDefault(); // 阻止默认的粘贴事件
        //     let data = e.clipboardData || window.clipboardData;
        //     console.info('====paste=====' + data.types + '====' + data.getData('text'));
        //     let tmp;
        //     try {
        //         tmp = JSON.parse(data.getData('text'));
        //     } catch(err) {
        //         alert('please input a valid json string');
        //         return;
        //     }
        //     let after = JSON.stringify(tmp, null, 4);
        //     console.info('========' + after);
        //     el.value = after;
        //     return;
        // });
    },
    methods: {
        parse() {
            let el = document.getElementById('ta');
            let tmp;
            try {
                tmp = JSON.parse(el.innerText);
            } catch(err) {
                console.error(err);
                alert('please input valid json string');
                return;
            }
            let after = JSON.stringify(tmp, null, 4);
            el.innerHTML = '<pre>' + after + '</pre>';
        }
    }
}
Vue.createApp(app).mount('#app');