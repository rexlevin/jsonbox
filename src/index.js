const jsonbox = {
    data() {
        return {
            message: 'hello world'
        }
    },
    computed:  {
    },
    created() {
        const monacoEditor = monaco.editor.create(document.querySelector('#container'), {
            readOnly: false,
            language: 'json',
            theme: 'vs-dark',
            selectOnLineNumber: true,
            readerSideBySide: false
        });
        // 监听值变化
        monacoEditor.onDidChangeModelContent(() => {
            const currenValue = monacoEditor?.getValue();
            emit('update:value', currenValue);
        });
    },
    destroyed() {
    },
    mounted() {
    },
    methods: {
    }
}
Vue.createApp(jsonbox).mount('#app');