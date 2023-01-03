<template>
    <div class="row frame_content">
        <div class="col" id="container">
            <div id="ln">
                <ul>
                    <li v-for="index of lineCount">{{index}}</li>
                </ul>
            </div>
            <div id="con">
                <div ref="divJson" class="code ta" contenteditable="true"></div>
            </div>
        </div>
    </div>
    <div class="row frame_footer align-items-center">
        <div class="col-2">
            <button class="btn btn-primary btn-sm" style="width: 80px;" @click="manuParse" title="格式化"><i class="bi bi-arrow-clockwise"></i> Parse</button>
        </div>
        <div class="col">
            <span id="match">{{match}}</span>&nbsp;<input type="text" id="txtSearch" ref="txtSearch" v-model="searchText">&nbsp;
                <i class="bi bi-arrow-down icon" @click="next" title="下一个 Enter"></i>&nbsp;
                <i class="bi bi-arrow-up icon" @click="previous" title="上一个 Shift Enter"></i>
        </div>
    </div>
</template>

<script>
export default {}
</script>