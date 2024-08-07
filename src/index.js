const tmpJ = {
    sid: '',
    type: 0,   // 当前 json 类型，0-会话，1-文件
    path: '',   // 文件路径，type 为 1 时，这里必须有值， 如：C:\Users\brood\Documents\NewTab_0.json
    lineCount: 1,   // 总行数
    searchText: '', // 当前搜索关键字
    keyword: {},    // keyword: {last: "上次搜索关键字", now: "本次搜索关键字"}
    match: '',      // 搜索结果显示字符串，格式：1/2，第二个数字是搜搜匹配总数，第一个数是当前是第几个搜索匹配
    totalMatch: 0,  // 搜索总匹配数
    checkIndex: 0,  // 当前是第几个搜索匹配，从0开始计数
    title: '',      // 显示在标签上的名称
    jString: '',    // 未着色的 json 内容
    jText: ''       // 格式化并着色后的 json 内容，包含 html 标签
};

const jsonbox = {
    data() {
        return {
            activeTab: '',  // 当前激活tab编号，会保存入config.json，用于打开app时恢复session
            boxes: [],
            j: Object.assign({}, tmpJ),
            currentTabIndex: -1,    // 当前编辑区是 boxes 中第几个元素
            tabIndex: 0         // 标签计数器
        }
    },
    computed:  {
        getCurrentTabIndex () {
            return this.currentTabIndex
        }
    },
    created() {
    },
    destroyed() {
        clearInterval(this.timerSave);
    },
    mounted() {

        window.api.getSettings(r => {
            if(undefined == r || !r.saveSession) {
                this.j.sid = window.api.sid();
                this.j.title = 'NewTab_' + this.tabIndex++;
                this.boxes.push(Object.assign({}, this.j));
                this.currentTabIndex = 0;
                return;
            }
            window.api.getBoxes((r, activeTab) => {
                if(undefined === r || r.length == 0) {
                    this.j.sid = window.api.sid();
                    this.j.title = 'NewTab_' + this.tabIndex++;
                    this.boxes.push(Object.assign({}, this.j));
                    this.currentTabIndex = 0;
                    return;
                }
                this.boxes = r;
                this.tabIndex = this.boxes.length;
                this.switchTab(null, activeTab, null);
            });
        });

        this.timerSave = setInterval(() => {
            window.api.getSettings(r => {
                if(undefined === r) return;
                if(r.saveSession) {
                    this.packData('1');
                    // 首先需要进行一次文件保存
                    // for(let b of this.boxes) {
                    //     if('1' != b.type) continue;
                    //     console.info('当前需保存文件===%s', b.path);
                    //     window.api.autoSaveFile({
                    //         path: b.path,
                    //         content: b.jString
                    //     }, (r) => {
                    //         console.info(r);
                    //     });
                    // }
                    // 然后才是 boxes 保存
                    window.api.saveBoxs(JSON.stringify(this.boxes), this.activeTab, (r)=>{
                        console.info('save boxes success==%s', r);
                    });
                }
            });
        }, 3000);

        window.api.appCloseHandler(e => {
            window.api.getSettings(r => {
                if(undefined === r) {
                    e.sender.send('close-reply', 'ok');
                    return;
                }
                if(r.saveSession) {
                    // 保存一下当前的 json
                    this.packData('1');
                    // 先做一下文件保存
                    for(let b of this.boxes) {
                        if('1' != b.type) continue;
                        console.info('当前需保存文件===%s', b.path);
                        window.api.autoSaveFile({
                            path: b.path,
                            content: b.jString
                        }, (r) => {
                            console.info(r);
                        });
                    }
                    // 然后再保存 boxes
                    window.api.saveBoxes(JSON.stringify(this.boxes), (r)=>{
                        e.sender.send('close-reply', 'ok');
                    });
                } else {
                    // 将 boxes 置空
                    window.api.saveBoxes(JSON.stringify([]), (r)=>{
                        e.sender.send('close-reply', 'ok');
                    });
                }
            });
        });

        window.api.saveJSON(e => {
            this.save2File();
        });
        window.api.renameTab(e => {
            this.modifyTabTitle();
        });
        window.api.searchText(e => {
            this.$refs.txtSearch.focus();
        });
        window.api.newTab(e => {
            this.createTab();
        });
        window.api.closeTab(e => {
            this.closeTab();
        });

        // 设置title
        document.title = window.api.getDescription() + ' - v' + window.api.getVersion('jsonbox');

        let txtSearch = this.$refs.txtSearch
          , divJson = this.$refs.divJson;

        divJson.focus();

        document.querySelector('#container').addEventListener('click', () => {
            // divJson.focus(() => {});
            divJson.focus();
            let selection = window.getSelection();
            if(selection.anchorOffset != 0) {
                return;
            };
            let range = document.createRange();
            range.selectNodeContents(divJson);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        });
        document.querySelector('#container').addEventListener('scroll', (e) => {
            // console.info(e.currentTarget.scrollTop);
            document.querySelector('#ln').scrollTop = e.currentTarget.scrollTop; 
        });

        // 可编辑div里的内容变化事件，这是为了重写linenum
        divJson.addEventListener('DOMNodeInserted', () => {
            // this.j.lineCount = Math.ceil(divJson.offsetHeight / 20)
            this.j.lineCount =  divJson.innerHTML.split('\n').length;
        });

        // 可编辑div里的内容全选后删除事件，尤其内容特别多的时候，必须自己来写全选后的删除，否則会卡得cpu狂飙
        divJson.addEventListener('keydown', (e) => {
            if(e.key == 'Backspace' || e.key == 'Delete') {
                if(document.getSelection().toString().trim() == divJson.textContent.trim()) {
                    console.info('all selected before delete');
                    divJson.innerText = ''; // divJson.innerHTML = '';
                }
                // this.j.lineCount = Math.ceil(divJson.offsetHeight / 20);
                this.j.lineCount = divJson.innerHTML.split('\n').length
            }
        });

        // 可编辑div里的粘贴事件
        // 包含全选后粘贴，和 在光标所在处粘贴
        divJson.addEventListener('paste', (e) => {
            e.preventDefault();
            this.j.keyword = {};
            if(document.getSelection().toString().trim() == divJson.textContent.trim()) {
                console.info('all selected before ctrl+v');
                divJson.innerHTML = '';
                navigator.clipboard.readText().then(text => {
                    divJson.textContent = text;
                    this.parse();
                });
            } else {
                let selection=window.getSelection()
                let range=selection.getRangeAt(0)
                let node = document.createElement("span");
                navigator.clipboard.readText().then(text => {
                    node.innerText = text;
                    range.insertNode(node);
                    this.parse();
                });
            }
        });

        // 在搜索关键字输入框里enter/shift+enter时触发向后找/向前找
        // 此时第一步是需要进行关键字着色，这里改了好多遍，注意search()里的正则的使用，下来后要继续多深入学习正则-_-!
        txtSearch.addEventListener('keyup', (e) => {
            if(e.ctrlKey && e.key == 'Enter') return;
            if(e.altKey && e.key == 'Enter') return;
            if(!e.shiftKey && e.key == 'Enter') {
                // 向后找
                this.next();
            }
            if(e.shiftKey && e.key == 'Enter') {
                e.preventDefault();
                // 向前找
                this.previous();
            }
            if(e.key == 'Escape') {
                // 取消搜索，聚焦到json输入框
                divJson.focus();
            }
        });
        txtSearch.addEventListener('input', (e) => {
            // console.info(txtSearch.value.trim());
            this.search();
        });
        txtSearch.addEventListener('focus', (e) => {
            // 获取焦点的时候全选内容
            e.currentTarget.select();
        });
    },
    methods: {
        save2File() {
            // 保存为文件
            window.api.save2File({
                title: '保存到...',
                filters: [{name: 'JSON文件', extensions: ['json']}],
                defaultPath: this.j.title + '.json'
            }, this.$refs.divJson.textContent, (r) => {
                console.info('save2file call back=====%s', r);
                if(!'0000' === r.code) {
                    alert('文件保存失败');
                    return;
                }
                alert('文件保存成功');
                this.j.type = 1;
                this.j.path = r.body;
                let pathArr = r.body.split('\\');
                this.j.title = pathArr[pathArr.length - 1];
                this.packData('1');     // 数据写入 boxes
            });
        },
        modifyTabTitle() {
            // 修改当前tab标签title
            window.api.modifyTitle({
                title: '修改title',
                alwaysOnTop: false,
                label: '输入新的title'
            }, (r) => {
                if('0000' != r.code) return;
                this.j.title = r.body;
                this.packData('1'); // 把数据更新到 boxes 中
            });
        },
        showTabContextMenu(index, e) {
            // tab标签上的右键菜单
        },
        switchTab(index, sid, e){
            if(null == index || undefined == index) {
                for(let i = 0; i < this.boxes.length; i++) {
                    if(this.boxes[i].sid === sid) {
                        console.info('=======%s', i);
                        this.j = Object.assign({}, this.boxes[i]);
                        this.currentTabIndex = i;
                        this.$refs.divJson.innerHTML = this.j.jText;
                        this.activeTab = this.j.sid;   // 记录当前激活tab
                        break;
                    }
                }
                this.packData('1');    // 先把当前tab数据进行保存
                return;
            }
            console.info('%s===%s', index, sid);
            this.j = Object.assign({}, this.boxes[index]);
            this.currentTabIndex = index;
            this.$refs.divJson.innerHTML = this.j.jText;
            this.activeTab = this.j.sid;   // 记录当前激活tab
            this.packData('1');    // 先把当前tab数据进行保存
        },
        closeTab() {
            this.packData('2');
        },
        createTab() {
            if(this.$refs.divJson.textContent == '') return;
            this.packData('1');    // 将当前数据放入boxes中
            this.clearData();   // 清空数据
            this.currentTabIndex = this.boxes.push(Object.assign({}, this.j)) - 1;
            this.$refs.divJson.focus();
            this.activeTab = this.j.sid;
        },
        clearData() {
            this.j = Object.assign({}, tmpJ, {
                sid: window.api.sid(),
                title: 'NewTab_' + this.tabIndex++
            });
            console.info(this.j.title);
            this.$refs.divJson.textContent = '';
        },
        packData(operate) {
            // 将当前数据保存进boxes
            // operate：0-新增，1-更新，2-删除
            switch (operate) {
                case '0':
                    this.j.sid = window.api.sid();
                    this.j.jString = this.$refs.divJson.textContent;
                    this.j.jText  = this.$refs.divJson.innerHTML;
                    this.currentTabIndex = this.boxes.push(Object.assign({}, this.j)) - 1;
                    this.activeTab = this.j.sid;
                    break;
                case '1':
                    this.j.jString = this.$refs.divJson.textContent;
                    this.j.jText  = this.$refs.divJson.innerHTML;
                    for (let i = 0; i < this.boxes.length; i++) {
                        if(this.boxes[i].sid == this.j.sid) {
                            this.boxes[i] = Object.assign({}, this.j);
                            break;
                        }
                    }
                    this.activeTab = this.j.sid;
                    break;
                case '2':
                    if(this.boxes.length == 1) {
                        this.currentTabIndex = 0;
                        this.tabIndex = 0;
                        this.clearData();
                        this.boxes[0] = Object.assign({
                            title: 'NewTab_0'
                        },this.j);
                        this.activeTab = this.j.sid;
                        return;
                    }
                    // delete this.boxes[this.currentTabIndex];
                    let index = 0;
                    for (let i = 0; i < this.boxes.length; i++) {
                        if(this.boxes[i].sid == this.j.sid) {
                            index = i;
                            break;
                        }
                    }
                    if(this.currentTabIndex == (this.boxes.length - 1)) {
                        this.currentTabIndex--
                    }
                    this.boxes.splice(index, 1);
                    this.j = Object.assign({}, this.boxes[this.currentTabIndex]);
                    this.$refs.divJson.innerHTML = this.j.jText;
                    this.activeTab = this.j.sid;
                    // this.tabIndex--;
                    break;
                default:
                    break;
            }
        },
        manuParse() {
            this.j.keyword = {};
            this.parse();
            this.search();
        },
        parse() {
            if(this.currentTabIndex == -1) { // 当前数据还没有保存进boxes
                this.packData("0");
            } 
            let divJson = this.$refs.divJson
              , tmp;
            let content = divJson.textContent;
            if(undefined == content || '' == content) return;
            try {
                // tmp = JSON.parse(divJson.textContent);
                tmp = eval("[" + content + "]");
            } catch (err) {
                console.error(err);
                // alert('please input valid json string==' + err);
                return;
            }
            let after = JSON.stringify(tmp, null, 4);
            // 开始代码着色
            after = Process(after);
            // 给定pre标签
            divJson.innerHTML = '<pre>' + after + '</pre>';

            // add linenum
            console.info('==current total line=====%d', after.split('\n').length);
            this.j.lineCount = after.split('\n').length;
        },
        clearHilight() {
            this.removeCurStyle();
            let m = new RegExp('<span id="result" class="hilight">' + this.j.keyword.now + '</span>', 'gi');
            let divJson = this.$refs.divJson;
            let content = divJson.innerHTML;
            let arr = content.match(m), i = -1;
            // if(null == arr) return;
            content = content.replace(m, () => {
                i++;
                arr[i] = arr[i].replace('<span id="result" class="hilight">', '');
                arr[i] = arr[i].replace('</span>', '');
                return arr[i];
            });

            m = new RegExp('<span id="result" class="hilight" style="">' + this.j.keyword.now + '</span>', 'gi');
            arr = content.match(m), i = -1;
            content = content.replace(m, () => {
                i++;
                arr[i] = arr[i].replace('<span id="result" class="hilight" style="">', '');
                arr[i] = arr[i].replace('</span>', '');
                return arr[i];
            });

            divJson.innerHTML = content;
            this.j.match = '';
            this.j.totalMatch = 0;
        },
        recordKeyword() {
            let kw = txtSearch.value.trim();
            if(this.j.keyword.now == kw) {
                return;
            }
            this.j.keyword.last = this.j.keyword.now;
            this.j.keyword.now = kw;
        },
        search() {
            let divJson = this.$refs.divJson;
            let textContent = divJson.textContent.trim();
            console.info('keyword.last==%s========keyword.now==%s', this.j.keyword.last, this.j.keyword.now);
            if(undefined == textContent || 'undefined' == textContent || '' == textContent || 0 === textContent.length) {
                // this.clearHilight();
                return;
            }
            if(undefined == this.j.searchText || '' == this.j.searchText) {
                console.info('clear hilight');
                this.clearHilight();
                // this.recordKeyword();
                return;
            }
            if(this.j.keyword.now == this.j.searchText) {
                if(this.j.totalMatch == 0) return;
                console.info('now locate to next');
                this.next();
                return;
            }
            this.clearHilight();    // 此处的clearHight一定要在recordKeyword前面哦～
            this.recordKeyword();
            this.j.checkIndex = 0;
            console.info('%s=====a========%s', this.j.keyword.last, this.j.keyword.now);
            let content = divJson.innerHTML;//, reg = new RegExp(searchText, 'gi');
            content = content.substring(5)  // 去掉开头的<pre>
            content = content.substring(0, content.length - 6)  // 去掉末尾的</pre>
            let reg = new RegExp('(<span class="[^"]+">)((?:(?!<\/span>).)*?)(' + this.j.searchText + ')', 'gi');
            let arr = content.match(reg), i = -1;
            if(undefined == arr || null == arr) {
                console.info('there is no match');
                this.j.match = '0'
                this.j.totalMatch = 0;
                return;
            }
            content = content.replace(reg, '$1$2<span id="result" class="hilight">$3</span>');
            // content = content.replace(reg, (e) => {
            //     i++;
            //     return '<span id="result" class="hilight">' + arr[i] + '</span>';
            // });
            divJson.innerHTML = '<pre>' + content + '</pre>';
            console.info('checkIndex======%d', this.j.checkIndex);
            this.j.match = (this.j.checkIndex + 1) + "/" + arr.length;
            this.j.totalMatch = arr.length;
            this.locate();
        },
        locate() {
            let hilight = document.querySelectorAll('.hilight');
            let container = document.getElementById('container');
            this.removeCurStyle();
            this.addCurStyle();
            console.info('====================%s', container.offsetWidth);
            container.scrollTo({
                top: hilight[this.j.checkIndex].offsetTop - 100,
                left: (hilight[this.j.checkIndex].offsetLeft < container.offsetWidth ? 0 : hilight[this.j.checkIndex].offsetLeft - container.offsetWidth / 2),
                behavior: 'smooth'
            });
        },
        addCurStyle() {
            let hilight = document.querySelectorAll('.hilight');
            hilight[this.j.checkIndex].style.background = '#a8ac94';
            // if(this.j.checkIndex > 0) {
            //     hilight[this.j.checkIndex - 1].removeAttribute('style');
            // }
            // if(this.j.checkIndex < this.j.totalMatch - 1) {
            //     hilight[this.j.checkIndex + 1].removeAttribute('style');
            // }
        },
        removeCurStyle() {
            let hilight = document.querySelectorAll('.hilight');
            for(let item of hilight) {
                item.removeAttribute('style');
            }
        },
        next() {
            if(undefined == this.j.searchText || '' == this.j.searchText) {
                return;
            }
            if(this.j.totalMatch == 0) return;    // 没有匹配，不再继续检索
            // 搜索到最后一个，继续从头开始
            if(this.j.checkIndex + 1 === this.j.totalMatch && this.j.totalMatch != 0) this.j.checkIndex = -1;
            this.j.checkIndex++;
            this.j.match = (this.j.checkIndex + 1) + "/" + this.j.totalMatch;
            this.locate();
        },
        previous() {
            if(undefined == this.j.searchText || '' == this.j.searchText) {
                return;
            }
            if(this.j.totalMatch == 0) return;    // 没有匹配，不再继续检索
            if(this.j.checkIndex === 0) this.j.checkIndex = this.j.totalMatch;
            this.j.checkIndex--;
            this.j.match = (this.j.checkIndex + 1) + "/" + this.j.totalMatch;
            this.locate();
        },
        openSettings() {
            // 打开设置窗口
            window.api.openSettings();
        },
        copy(name) {
            let jsonTxt = this.$refs.divJson.textContent;
            console.info(jsonTxt);
            let jsonObj = JSON.parse(jsonTxt)// eval("(" + jsonTxt + ")")
                , re;
            const handlers = {
                'xml': function(jsonObj) {
                    let x2js = new X2JS();
                    re = x2js.js2xml(jsonObj)
                },
                'yaml': function() {
                    let yaml = new YAML();
                    re = yaml.j2y(jsonObj)
                }
            }
            handlers[name](jsonObj)
            navigator.clipboard.writeText(re)
            window.api.notification({title: '复制成功', body: `${name}格式内容已经复制到剪贴板`})
        }
    }
}
Vue.createApp(jsonbox).mount('#app');

function IsArray(obj) {
    return obj &&
        typeof obj === 'object' && typeof obj.length === 'number' && !(obj.propertyIsEnumerable('length'));
}

function Process(text) {
    let html = "";
    try {
        if (text == "") {
            text = '""';
        }
        let obj = eval(text); // eval("[" + text + "]");
        html = ProcessObject(obj[0], 0, false, false, false);
        return html;
    } catch (e) {}
}

function ProcessObject(obj, indent, addComma, isArray, isPropertyContent) {
    let html = "", comma = (addComma) ? "," : "";//(addComma) ? "<span class=\"Comma\">,</span>": "";
    let type = typeof obj;
    if (IsArray(obj)) {
        if (obj.length == 0) {
            html += GetRow(indent, "<span class=\"ArrayBrace\">[]</span>" + comma, isPropertyContent);
        } else {
            html += GetRow(indent, "<span class=\"ArrayBrace\">[</span>", isPropertyContent);
            for (let i = 0; i < obj.length; i++) {
                html += ProcessObject(obj[i], indent + 1, i < (obj.length - 1), true, false);
            }
            html += GetRow(indent, "<span class=\"ArrayBrace\">]</span>" + comma);
        }
    } else {
        if (type == "object" && obj == null) {
            html += FormatLiteral("null", "", comma, indent, isArray, "Null");
        } else {
            if (type == "object") {
                let numProps = 0;
                for(let prop in obj) numProps++; 
                if (numProps == 0) {
                    html += GetRow(indent, "<span class=\"ObjectBrace\">{}</span>" + comma, isPropertyContent)
                } else {
                    html += GetRow(indent, "<span class=\"ObjectBrace\">{</span>", isPropertyContent);
                    let j = 0;
                    for (var prop in obj) {
                        html += GetRow(indent + 1, '<span class="PropertyName">"' + prop + '"</span>: ' + ProcessObject(obj[prop], indent + 1, ++j < numProps, false, true))
                    }
                    html += GetRow(indent, "<span class=\"ObjectBrace\">}</span>" + comma);
                }
            } else {
                if (type == "number") {
                    html += FormatLiteral(obj, "", comma, indent, isArray, "Number");
                } else {
                    if (type == "boolean") {
                        html += FormatLiteral(obj, "", comma, indent, isArray, "Boolean");
                    } else {
                        if (type == "function") {
                            obj = FormatFunction(indent, obj);
                            html += FormatLiteral(obj, "", comma, indent, isArray, "Function");
                        } else {
                            if (type == "undefined") {
                                html += FormatLiteral("undefined", "", comma, indent, isArray, "Null");
                            } else {
                                html += FormatLiteral(obj, '"', comma, indent, isArray, "String");
                            }
                        }
                    }
                }
            }
        }
    }
    return html;
}

function FormatLiteral(literal, quote, comma, indent, isArray, style) {
    if (typeof literal == "string") {
        literal = literal.split("<").join("&lt;").split(">").join("&gt;");
        literal = literal.split("\"").join("\\\""); // 20221214，针对字符串内的双引号，加上转义符\
    }
    var str = "<span class='" + style + "'>" + quote + literal + quote + comma + "</span>";
    if (isArray) {
        str = GetRow(indent, str);
    }
    return str;
}

function FormatFunction(indent, obj) {
    var tabs = "";
    for (var i = 0; i < indent; i++) {
        tabs += "    ";
    }
    var funcStrArray = obj.toString().split("\n");
    var str = "";
    for (var i = 0; i < funcStrArray.length; i++) {
        str += ((i == 0) ? "" : tabs) + funcStrArray[i] + "\n";
    }
    return str;
}

function GetRow(indent, data, isPropertyContent) {
    var tabs = "";
    for (var i = 0; i < indent && !isPropertyContent; i++) {
        tabs += "    ";
    }
    if (data != null && data.length > 0 && data.charAt(data.length - 1) != "\n") {
        data = data + "\n";
    }
    return tabs + data;
}

let name = 'lizl6';