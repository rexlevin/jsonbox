<template>
    <div id="container">
        <header>
            <div class="tabs header">
                <ul>
                    <li v-for="(item, index) in boxes">{{item.title}}</li>
                </ul>
            </div>
        </header>
        <main>
            <div class="editor" ref="editor">
                <div class="editor-placeholder"># Placeholder Example</div>
            </div>
        </main>
        <footer class="bottom">
            <div></div>
            <div class="btngroup">
                <button type="button" class="" @click="">压缩并复制</button>
            </div>
            <div class="divSettings"><i class="bi bi-sliders icon-sm"></i></div>
        </footer>
    </div>
</template>

<style src="../assets/ui.css" scoped></style>
<script setup>
import * as monaco from 'monaco-editor';
import { onBeforeMount, onMounted, ref } from 'vue';
import "bootstrap-icons/font/bootstrap-icons.css";

//import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

const tmpJ = {
    sId: '',
    type: 0,    // 当前 json 类型，0-会话，1-文件
    title: "",
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
    // 从存储中查询 boxes 数据
    window.api.getBoxes(data => {
        boxes.value = data || [];
        if(data.length == 0) {
            boxes.value = [];
            let j = Object.assign({}, tmpJ);
            boxes.value.push(Object.assign(j, {sId: window.api.sid(), title: "NewTab0"}));
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
.header {
    background-color: rgb(245, 245, 248);
}
.bottom{
    height:35px; width: 100%;
    line-height: 35px;
    display: grid;
    grid-template-columns: auto 300px 50px;
    
}
.btngroup{
    width: 100%; height: 100%;
    background-color: blue;
}
.divSettings{
    width: 100%; height: 100%;
    /* background-color: rgb(160, 147, 147); */
    text-align: center;
    line-height: 30px;
}

.mybtn{ background-color: #008CBA; color: white;
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