<template>
    <div id="container">
        <header>
            <div class="tabs header">
                <ul>
                    <li v-for="(item, index) in box.data" :class="item.id == box.activeId ? 'tab_selected' : 'tab_default'" @click="switchTab(item.id)">{{item.title}}</li>
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
                <div class="divSettings" title="设置 alt+s">
                    <span class="icon-span" @click="openSettings"><i class="bi bi-sliders icon"></i></span>
                </div>
                <div style="height: 100%;"></div>
                <div class="btngroup">
                    <span class="icon-span" title="格式化 shift+alt+f"><i class="bi bi-braces icon"></i></span>
                    <span class="icon-span" title="复制压缩"><i class="bi bi-chevron-contract icon"></i></span>
                    <span class="icon-span" @click="copy('yaml')" title="复制为yaml"><i class="bi bi-filetype-yml icon"></i></span>
                    <span class="icon-span" title="复制为xml"><i class="bi bi-code-slash icon"></i></span>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import * as monaco from 'monaco-editor';
import { onBeforeMount, onMounted, ref } from 'vue';
import "bootstrap-icons/font/bootstrap-icons.css";
import 'simple-ui/src/ui.css';
// import 'simple-ui/src/ui.js';

import * as YAML from "../lib/json.yaml";

//import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

const tmpJ = {
    id: '',
    type: 0,    // 当前 json 类型，0-会话，1-文件
    title: "",
    path: '',
    content: ''
};
const tmpBox = {
    activeId: '',
    tabTitleIndex: 0,
    data: []
};

const j = Object.assign({}, tmpJ);

const box = ref(null);

self.MonacoEnvironment = {
    getWorker: function(moduleId, label) {
        return new JsonWorker();
    }
};

onBeforeMount(() => {
    // 从存储中查询 boxes 数据
    window.api.getBox(res => {
        box.value = res || null;
        if(null == res) {
            box.value = Object.assign({}, tmpBox);
            let id = window.api.sid();
            let j = Object.assign({}, tmpJ);
            box.value.data.push(Object.assign(j, {id: id, title: "NewTab 0"}));
            box.value.activeId = id;
            return;
        }
        box.value = res;
    });
});

let editorInstance = ref(null);
onMounted(() => {
    editorInstance = monaco.editor.create(document.querySelector('.editor'), {
        value: '',
        language: 'json',
        autoIndent: true,   // 自动缩进
        automaticLayout: true,  // 自适应布局
        overviewRulerBorder: false, // 不要滚动条的边框
        formatOnPaste: true,    // 粘贴即格式化，默认false
        formatOnType: true,     // 按键即格式化，默认false
        contextmenu: true,     // 右键菜单
        fontSize: 15,
        mouseWheelZoom: true
    });
    showPlaceholder('');
    editorInstance.onDidBlurEditorWidget(() => {
        showPlaceholder(editorInstance.getValue());
    });
    editorInstance.onDidFocusEditorWidget(() => {
        hidePlaceholder();
    });
    editorInstance.onDidChangeModelContent(() => {
        // 这是editor的onchange事件
        console.info('当前内容===%s', editorInstance.getValue());
    });

    // switchTab(box.value.activeId);
    init();

    window.api.newTab(e => {
        createTab();
    });
    window.api.closeTab(e => {
        closeTab();
    });
    window.api.closeApp((event, isMax, position) => {
        console.info('editor===%o',editorInstance);
        // console.info(JSON.stringify(event));
        console.info('关闭窗口====isMax：%o, position：%o', isMax, position);
        // 把当前的数据存入box
        for (let j of box.value.data) {
            if(j.id === box.value.activeId) {
                j.content = editorInstance.getValue();
                break;
            }
        }
        console.info('box=====%o', box.value);
        // 把box数据存入store
        window.api.saveBox(JSON.stringify(box.value));
        window.api.savePosition(isMax, position);
        window.api.closeAppReply();
    });

});

function showPlaceholder(value) {
    if (value === '') {
        document.querySelector('.editor-placeholder').style.display = "initial";
    }
}

function hidePlaceholder() {
    document.querySelector('.editor-placeholder').style.display = "none";
}

function createTab() {
    console.info('create new tab');
    if('' == editorInstance.getValue()) {
        console.info('当前页没有内容，不需要创建新tab页');
        return;
    }
    let j = Object.assign({}, tmpJ);
    let id = window.api.sid();
    box.value.tabTitleIndex++;
    box.value.data.push(Object.assign(j, {id: id, title: "NewTab " + box.value.tabTitleIndex}));
    console.info('新建tab后的box==', box);
    switchTab(id);
}

function closeTab() {
    console.info('close current tab');
    if(box.value.data.length === 1
         && box.value.data[0].content === ''
    ) {
        console.info('当前只有一个空白页，无法关闭');
        return;
    }
    if(box.value.data.length === 1) {
        box.value.data[0].title = 'NewTab 0';
        box.value.data[0].content = '';
        editorInstance.setValue('');
        console.info('关闭后只剩下一个空白页了');
        return;
    }
    let currentId = box.value.activeId;
    for(let i = 0; i < box.value.data.length; i++) {
        if(box.value.data[i].id === currentId) {
            let nextId;
            if(i == 0) {
                nextId = 1;
            } else {
                nextId = i - 1;
            }
            box.value.activeId = box.value.data[nextId].id;
            editorInstance.setValue(box.value.data[nextId].content);
            box.value.data.splice(i, 1);
            break;
        }
    }
    console.info('closeTab后的box==', box);
}

function switchTab(id) {
    let currentId = box.value.activeId;
    console.info('currentId==%s\nnewId====%s', currentId, id);
    console.info('box.value.data=====%o', box.value.data);
    for(let t of box.value.data) {
        console.info('tttttt==%o', t);
        if(t.id === currentId) {
            t.content = editorInstance.getValue();
            break;
        }
    }
    console.info('content==%s', editorInstance.getValue());
    for(let t of box.value.data) {
        if(t.id === id) {
            console.info('t=========%o', t);
            box.value.activeId = t.id;
            editorInstance.setValue(t.content);
            if('' != t.content) {
                hidePlaceholder();
            }
            break;
        }
    }
}

function init() {
    // if(null == box.value.activeId) {
    //     let id = window.api.sid();
    //     box.value.activeId = id;
    //     let j = Object.assign({}, tmpJ);
    //     box.value.data.push(Object.assign(j, {id: id, title: "NewTab 0"}));
    //     editorInstance.setValue(box.value.data[0].content);
    //     hidePlaceholder();
    // } else {
        for(let t of box.value.data) {
            if(t.id === box.value.activeId) {
                editorInstance.setValue(t.content);
                if(''!= t.content) {
                    hidePlaceholder();
                }
                break;
            }
        }
    // }
}

function openSettings() {
    window.api.openSettings();
}

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

<style scoped>
#container { display: flex; flex-direction:column; width: 100vw; height: 100vh; margin: 0; padding: 0; }
header { background-color: rgb(245, 245, 248);}
main { flex: 1; background-color: #dee2e6; min-height:0;}
footer { background-color: rgb(245, 245, 248);}


.header {
    height:35px;
}
.bottom{
    height:35px; width: 100%;
    display: grid;
    grid-template-columns: 50px auto 300px;
    
}
.btngroup{
    width: 100%; height: 100%; display: flex;

justify-content: flex-end;
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