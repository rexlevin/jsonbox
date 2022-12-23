const app = {
    data() {
        return {
            lineCount: 1,
            keyword: {},
            match: '',
            totalMatch: 0,
            checkIndex: 0
        }
    },
    created() {
        document.addEventListener('keyup', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key == 'I' || e.key ==  'i')) {
                window.api.devTools();
            }
            if (e.ctrlKey && (e.key == 'r' || e.key == 'R')) {
                window.api.reload();
            }
        });
    },
    mounted() {
        // 设置title
        document.title = window.api.getDescription() + ' - v' + window.api.getVersion('jsonbox');

        let con = document.getElementById('container');
        let txtSearch = document.getElementById('txtSearch');
        let el = document.getElementById('ta');
        el.focus();

        con.addEventListener('click', () => {
            // el.focus(() => {});
            el.focus();
            let selection = window.getSelection();
            if(selection.anchorOffset != 0) {
                return;
            };
            let range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        });

        // 可编辑div里的内容变化事件，这是为了重写linenum
        el.addEventListener('DOMNodeInserted', () => {
            this.lineCount = el.offsetHeight / 20;
        });

        // 可编辑div里的内容全选后删除事件，尤其内容特别多的时候，必须自己来写全选后的删除，否則会卡得cpu狂飙
        el.addEventListener('keydown', (e) => {
            if(e.key == 'Backspace' || e.key == 'Delete') {
                if(document.getSelection().toString().trim() == el.textContent.trim()) {
                    console.info('all selected before delete');
                    el.innerText = ''; // el.innerHTML = '';
                }
                this.lineCount = el.offsetHeight / 20;
            }
        });

        // 可编辑div里的粘贴事件
        // 包含全选后粘贴，和 在光标所在处粘贴
        el.addEventListener('paste', (e) => {
            e.preventDefault();
            this.keyword = {};
            if(document.getSelection().toString().trim() == el.textContent.trim()) {
                console.info('all selected before ctrl+v');
                el.innerHTML = '';
                navigator.clipboard.readText().then(text => {
                    el.textContent = text;
                    this.parse();
                    // this.search();
                });
            } else {
                let selection=window.getSelection()
                let range=selection.getRangeAt(0)
                let node = document.createElement("span");
                navigator.clipboard.readText().then(text => {
                    node.innerText = text;
                    range.insertNode(node);
                    this.parse();
                    // this.search()
                });
            }
        });

        // 在app内ctrl+f时focus到搜索关键字输入框
        document.addEventListener('keyup', (e) => {
            if (!(e.ctrlKey && (e.key == 'f' || e.key == 'F'))) {
                return;
            }
            txtSearch.focus();
        });

        // 在搜索关键字输入框里enter/shift+enter时触发向后找/向前找
        // 此时第一步是需要进行关键字着色，这里改了好多遍，注意search()里的正则的使用，下来后要继续多深入学习正则-_-!
        txtSearch.addEventListener('keyup', (e) => {
            if(e.key == 'Enter') {
                // 向后找
                this.search();
            }
            if(e.shiftKey && e.key == 'Enter') {
                // 向前找
                let searchText = txtSearch.value.trim();
                if(undefined == searchText || '' == searchText) {
                    return;
                }
            }
        });
    },
    methods: {
        manuParse() {
            this.keyword = {};
            this.parse();
            this.search();
        },
        parse() {
            let el = document.getElementById('ta'), tmp;
            content = el.textContent;
            try {
                // tmp = JSON.parse(el.textContent);
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
            el.innerHTML = '<pre>' + after + '</pre>';

            // add linenum
            console.info('==current total line=====%d', after.split('\n').length);
            this.lineCount = after.split('\n').length;
        },
        clearHilight() {
            this.removeCurStyle();
            let m = new RegExp('<span id="result" class="hilight">' + this.keyword.now + '</span>', 'gi');
            let el = document.getElementById('ta'), content = document.getElementById('ta').innerHTML;
            let arr = content.match(m), i = -1;
            console.info('arr=================='+arr);
            // if(null == arr) return;
            content = content.replace(m, () => {
                i++;
                arr[i] = arr[i].replace('<span id="result" class="hilight">', '');
                arr[i] = arr[i].replace('</span>', '');
                return arr[i];
            });

            m = new RegExp('<span id="result" class="hilight" style="">' + this.keyword.now + '</span>', 'gi');
            arr = content.match(m), i = -1;
            content = content.replace(m, () => {
                i++;
                arr[i] = arr[i].replace('<span id="result" class="hilight" style="">', '');
                arr[i] = arr[i].replace('</span>', '');
                return arr[i];
            });

            el.innerHTML = content;
            this.match = '';
            this.totalMatch = 0;
        },
        recordKeyword() {
            let kw = txtSearch.value.trim();
            if(this.keyword.now == kw) {
                return;
            }
            this.keyword.last = this.keyword.now;
            this.keyword.now = kw;
        },
        search() {
            let el = document.getElementById('ta');
            let textContent = el.textContent.trim();
            let searchText = txtSearch.value.trim();
            console.info('keyword.last==%s========keyword.now==%s', this.keyword.last, this.keyword.now);
            if(undefined == textContent || 'undefined' == textContent || '' == textContent || 0 === textContent.length) {
                // this.clearHilight();
                return;
            }
            if(undefined == searchText || '' == searchText) {
                console.info('clear hilight');
                this.clearHilight();
                // this.recordKeyword();
                return;
            }
            if(this.keyword.now == searchText) {
                if(this.totalMatch == 0) return;
                console.info('now locate to next');
                this.next();
                return;
            }
            this.clearHilight();    // 此处的clearHight一定要在recordKeyword前面哦～
            this.recordKeyword();
            this.checkIndex = 0;
            console.info('%s=====a========%s', this.keyword.last, this.keyword.now);
            let content = el.innerHTML;//, reg = new RegExp(searchText, 'gi');
            let reg = new RegExp('(<span class="[^"]+">)((?:(?!<\/span>).)*?)(' + searchText + ')', 'gi');
            let arr = content.match(reg), i = -1;
            if(undefined == arr || null == arr) {
                console.info('there is no match');
                this.match = 'match:0'
                this.totalMatch = 0;
                return;
            }
            content = content.replace(reg, '$1$2<span id="result" class="hilight">$3</span>');
            // content = content.replace(reg, (e) => {
            //     i++;
            //     return '<span id="result" class="hilight">' + arr[i] + '</span>';
            // });
            el.innerHTML = '<pre>' + content + '</pre>';
            console.info('checkIndex======%d', this.checkIndex);
            this.match = 'match:' + (this.checkIndex + 1) + "/" + arr.length;
            this.totalMatch = arr.length;
            this.locate();
        },
        locate() {
            let hilight = document.querySelectorAll('.hilight');
            let container = document.getElementById('container');
            this.removeCurStyle();
            this.addCurStyle();
            container.scrollTo({
                top: hilight[this.checkIndex].offsetTop,
                behavior: 'smooth'
            });
        },
        addCurStyle() {
            let hilight = document.querySelectorAll('.hilight');
            hilight[this.checkIndex].style.background = '#a8ac94';
            // if(this.checkIndex > 0) {
            //     hilight[this.checkIndex - 1].removeAttribute('style');
            // }
            // if(this.checkIndex < this.totalMatch - 1) {
            //     hilight[this.checkIndex + 1].removeAttribute('style');
            // }
        },
        removeCurStyle() {
            let hilight = document.querySelectorAll('.hilight');
            for(let item of hilight) {
                item.removeAttribute('style');
            }
        },
        next() {
            if(this.checkIndex == 0) return;
            if((this.checkIndex + 1) == this.totalMatch) return;
            this.checkIndex++;
            this.match = 'match:' + (this.checkIndex + 1) + "/" + this.totalMatch;
            this.locate();
        },
        previous() {
            if(this.checkIndex === 0) return;
            this.checkIndex--;
            this.match = 'match:' + (this.checkIndex + 1) + "/" + this.totalMatch;
            this.locate();
        }
    }
}
Vue.createApp(app).mount('#app');

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