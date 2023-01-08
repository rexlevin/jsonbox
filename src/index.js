const jsonbox = {
    data() {
        return {
            boxes: [],
            j: {
                strJson: '',
                lineCount: 1,   // 总行数
                searchText: '',
                keyword: {},    // keyword: {last: "上次搜索关键字", now: "本次搜索关键字"}
                match: '',      // 搜索结果显示字符串，格式：1/2，第二个数字是搜搜匹配总数，第一个数是当前是第几个搜索匹配
                totalMatch: 0,  // 搜索总匹配数
                checkIndex: 0,  // 当前是第几个搜索匹配，从0开始计数
                title: '',
                jText: ''
            },
            currentTabIndex: -1,    // 当前编辑区是boxes中第几个元素
            t: 0
        }
    },
    computed:  {
        getCurrentTabIndex () {
            return this.currentTabIndex
        }
    },
    setup() {
        // const app = ref(null)
        //     // , txtSearch = ref(null)
        //     // , divJson = ref(null)
        // return {
        //     app,
        //     // txtSearch,
        //     // divJson
        // };
    },
    created() {

        this.boxes.push(this.j);
        this.currentTabIndex = 0;
        // app.addEventListener('keyup', (e) => {
        //     if (e.ctrlKey && e.shiftKey && (e.key == 'I' || e.key ==  'i')) {
        //         window.api.devTools();
        //     }
        //     if (e.ctrlKey && (e.key == 'r' || e.key == 'R')) {
        //         window.api.reload();
        //     }
        // });
    },
    mounted() {
        // 设置title
        document.title = window.api.getDescription() + ' - v' + window.api.getVersion('jsonbox');

        let txtSearch = this.$refs.txtSearch
          , divJson = this.$refs.divJson;

        divJson.focus();

        document.querySelector('#app').addEventListener('keyup', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key == 'I' || e.key ==  'i')) {
                // 打开开发者工具
                window.api.devTools();
            }
            if (e.ctrlKey && (e.key == 'r' || e.key == 'R')) {
                // 重新加载页面
                window.api.reload();
            }
            if(e.ctrlKey && (e.key == 't' || e.key == 'T')) {
                // 新建标签页
                this.createTab();
            }
            if(e.ctrlKey && (e.key == 'f' || e.key == 'F')) {
                // 在app内ctrl+f时focus到搜索关键字输入框
                txtSearch.focus();
            }
        });

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

        // document.querySelector('.myTab').addEventListener('show.bs.tab', (e) => {
        //     console.info(e);
        //     console.info(e.target);
        //     console.info(e.relatedTarget['index']);
        // });
    },
    methods: {
        switchTab(index, e){
            this.packData('1');    // 先把当前tab数据进行保存
            let newTabIndex = e.target.getAttribute('index')
            console.info('newTabIndex=============%s', newTabIndex)
            this.j = this.boxes[newTabIndex];
            this.currentTabIndex = newTabIndex
            console.info(this.j);
            console.info('currentTabIndex=============%s', this.currentTabIndex)
            this.$refs.divJson.innerHTML = this.j.jText;
        },
        createTab() {
            if(this.$refs.divJson.textContent == '') return;
            this.packData('1');    // 将当前数据放入boxes中
            this.clearData();   // 清空数据
            this.boxes.push(this.j);
            this.currentTabIndex = this.boxes.length - 1
            console.info('boxes.length====%s', this.boxes.length);
        },
        clearData() {
            this.j = {
                strJson: '',
                lineCount: 1,   // 总行数
                searchText: '',
                keyword: {},    // keyword: {last: "上次搜索关键字", now: "本次搜索关键字"}
                match: '',      // 搜索结果显示字符串，格式：1/2，第二个数字是搜搜匹配总数，第一个数是当前是第几个搜索匹配
                totalMatch: 0,  // 搜索总匹配数
                checkIndex: 0,  // 当前是第几个搜索匹配，从0开始计数
                title: '',
                jText: ''
            };
            this.$refs.divJson.textContent = ''
        },
        packData(operate) {
            // 将当前数据保存进boxes
            // operate：0-新增，1-更新，2-删除
            if('0' == operate) {
                this.j.jText  = this.$refs.divJson.innerHTML;
                this.currentTabIndex = this.boxes.push(this.j) - 1;
            } else if('1' == operate) {
                this.j.jText  = this.$refs.divJson.innerHTML;
                this.boxes[this.currentTabIndex] = this.j;
            } else {
                delete this.boxes[this.currentTabIndex];
                this.currentTabIndex--;
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
            // 打开设置dialog
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