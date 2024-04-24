<template>
    <div id="containder">
        <div class="editor" ref="editor"></div>
    </div>
</template>

<script setup>
import * as monaco from 'monaco-editor';
import { onMounted, ref } from 'vue';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

const editor = ref(null);

self.MonacoEnvironment = {
    getWorker: function(moduleId, label) {
        if(label == 'json') {
            return new JsonWorker();
        }
        return new EditorWorker();
    }
};

onMounted(() => {
    monaco.editor.create(document.querySelector('.editor'), {
        value: '{"phrase": "hello world"}',
        language: 'json',
        autoIndent: true,   // 自动缩进
        automaticLayout: true,  // 自适应布局
        overviewRulerBorder: false, // 不要滚动条的边框
        fontSize: 15
    });
});
</script>

<style scoped>
#container {
    width: 100%;
    height: 700px;
}
.editor {
    /* background-color: red; */
    width: 100%;
    height: 500px;
}
</style>