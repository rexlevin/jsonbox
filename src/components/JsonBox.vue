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
        <footer>
            <div class="bottom">
                <div style="height: 100%;"></div>
                <div class="btngroup">
                    <span class="icon-span" title="格式化 shift+alt+f"><i class="bi bi-braces icon"></i></span>
                    <span class="icon-span" title="复制压缩"><i class="bi bi-chevron-contract icon"></i></span>
                    <span class="icon-span" @click="copy('yaml')" title="复制为yaml"><i class="bi bi-filetype-yml icon"></i></span>
                    <span class="icon-span" title="复制为xml"><i class="bi bi-code-slash icon"></i></span>
                </div>
                <div class="divSettings" title="设置 alt+s">
                    <span class="icon-span"><i class="bi bi-sliders icon"></i></span></div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import * as monaco from 'monaco-editor';
import { onBeforeMount, onMounted, ref } from 'vue';
import "bootstrap-icons/font/bootstrap-icons.css";

import * as YAML from "../lib/json.yaml";

//import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

const tmpJ = {
    sId: '',
    type: 0,    // 当前 json 类型，0-会话，1-文件
    title: "",
    path: '',
    content: ''
};

const j = Object.assign({}, tmpJ);

// const editor = ref(null);
const boxes = ref(null);

self.MonacoEnvironment = {
    getWorker: function(moduleId, label) {
        return new JsonWorker();
    }
};

onBeforeMount(() => {
    // 从存储中查询 boxes 数据
    // window.api.getBoxes(data => {
    //     boxes.value = data || [];
    //     if(data.length == 0) {
    //         boxes.value = [];
    //         let j = Object.assign({}, tmpJ);
    //         boxes.value.push(Object.assign(j, {sId: window.api.sid(), title: "NewTab0"}));
    //     }
    // });
    boxes.value = [];
    boxes.value.push(Object.assign(j, {sId: 'xp983fkls', title: "NewTab0"}));
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

function copy(name) {
    console.info(name);
    let re,
        jsonObject = '';
    const handlers = {
        'xml': function() {},
        'yml': function() {
            re = YAML.j2y(j.content);
        }
    };
    handlers[name](jsonObject);
    navigator.clipboard.writeText(re)
}
</script>

<style src="../assets/ui.css" scoped></style>
<style scoped>
.header {
    height:35px;
}
.bottom{
    height:35px; width: 100%;
    display: grid;
    grid-template-columns: auto 300px 50px;
    
}
.btngroup{
    width: 100%; height: 100%; float: right;
}

.icon-span {display:inline-block; width: 40px; height: 35px; text-align: center;
    border-radius: 20px;
    display: table-cell;
    vertical-align:middle;}
.icon {font-size: 20px; }
.icon-span:hover {background-color: hsl(0, 0%, 90%); cursor: pointer;}
.icon-span:active {background-color: hsl(0, 0%, 80%); cursor: pointer;}

.divSettings{
    width: 100%; height: 100%;
    text-align: center;
}

.editor {
    width: 100%;
    height: 100%;
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