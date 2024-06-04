<template>
    <div id="container">
        <header>
            <ul>
                <li v-for="(item, index) in boxes">asdfsaf</li>
            </ul>
        </header>
        <main>
            <div class="editor" ref="editor">
                <div class="editor-placeholder"># Placeholder Example</div>
            </div>
        </main>
        <footer>
            <div class="bottom">
                <div></div>
                <div class="btngroup">
                    <button class="btn" @click="">压缩并复制</button>
                </div>
                <div class="divSettings"></div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import * as monaco from 'monaco-editor';
import { onBeforeMount, onMounted, ref } from 'vue';

//import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

const tmpJ = {
    sId: '',
    type: 0,
    path: '',
    content: ''
};

// const editor = ref(null);
const boxes = ref(null);

self.MonacoEnvironment = {
    getWorker: function(moduleId, label) {
        return new JsonWorker();
        // if(label == 'json') {
        //     return new JsonWorker();
        // }
        // return new EditorWorker();
    }
};

onBeforeMount(() => {
    // console.info(boxes.value);
    // 从存储中查询 boxes 数据
    window.api.getBoxes(data => {
        if(null == data || undefined == data || data.length == 0) {
            boxes.value = [];
            boxes.value.push(Object.assign([], tmpJ));
        }
    });
});

onMounted(() => {
    const instance = monaco.editor.create(document.querySelector('.editor'), {
        value: '',
        language: 'json',
        autoIndent: true,   // 自动缩进
        automaticLayout: true,  // 自适应布局
        overviewRulerBorder: false, // 不要滚动条的边框
        formatOnPaste: true,    // 粘贴即格式化，默认false
        formatOnType: true,     // 按键即格式化，默认false
        contextmenu: true,     // 右键菜单
        fontSize: 15
    });
    showPlaceholder('');
    instance.onDidBlurEditorWidget(() => {
        showPlaceholder(instance.getValue());
    });

    instance.onDidFocusEditorWidget(() => {
        hidePlaceholder();
    });

    function showPlaceholder(value) {
        if (value === '') {
            document.querySelector('.editor-placeholder').style.display = "initial";
        }
    }

    function hidePlaceholder() {
        document.querySelector('.editor-placeholder').style.display = "none";
    }
});
</script>

<style scoped>
#container { display: flex; flex-direction:column; width: 100vw; height: 100vh; margin: 0; padding: 0; }
header { height:33px; background-color: gray; }
main { flex: 1; background-color: #dee2e6;}
footer { height:40px; background-color: rgb(245, 245, 248);}

.bottom{
    width: 100%; height: 100%;
    display: grid;
    grid-template-columns: auto 300px 50px;
}
.btngroup{
    width: 100%; height: 100%;
    background-color: blue;
}
.divSettings{
    width: 100%; height: 100%;
    background-color: rgb(160, 147, 147);
}

.btn{
    background-color: #008CBA;
    border: none;
    color: white;
    text-align: center;
    font-size: 14px;
}

.editor {
    width: 100%;
    height: 100%;
    /* height: calc(100vh); */
    position: relative;
}
.editor-placeholder {
    display: none;
    position: absolute;
    top: 0;
    left: 65px;
    pointer-events: none;
    z-index: 1;
    opacity: 0.7;
}
</style>