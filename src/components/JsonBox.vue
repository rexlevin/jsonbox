<template>
    <!-- <el-container>
        <el-header></el-header>
        <el-main>
            <div class="editor" ref="editor">
                <div class="editor-placeholder"># Placeholder Example</div>
            </div>
        </el-main>
        <el-footer></el-footer>
    </el-container> -->
    <div id="containder">
        <div id="header"></div>
        <div id="main">
            <div class="editor" ref="editor">
                <div class="editor-placeholder"># Placeholder Example</div>
            </div>
        </div>
        <div id="footer"></div>
    </div>
</template>

<script setup>
import * as monaco from 'monaco-editor';
import { onMounted, ref } from 'vue';

// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

// const editor = ref(null);

self.MonacoEnvironment = {
    getWorker: function(moduleId, label) {
        if(label == 'json') {
            return new JsonWorker();
        }
        return new EditorWorker();
    }
};


onMounted(() => {
    const instance = monaco.editor.create(document.querySelector('.editor'), {
        value: '',
        language: 'json',
        autoIndent: true,   // 自动缩进
        automaticLayout: true,  // 自适应布局
        overviewRulerBorder: false, // 不要滚动条的边框
        formatOnPaste: true,    // 粘贴即格式化，默认false
        // formatOnType: true,     // 按键即格式化，默认false
        contextmenu: false,
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
/* .el-container {height:100%;}
.el-header, .el-main, .el-footer{padding:0;} */

#container { display: flex; height:100%; flex-direction:column; margin:0 10; padding:0;}
#header { height:40px; }
#main { flex:1; padding:0; overflow:auto;}
#footer { height:30px; position: sticky!important; margin-top:2px; margin-bottom:2px; }

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