const app = {
    data() {
        return {
            keyword: {},
            match: ''
        }
    },
    created() {
        document.addEventListener('keyup', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key == 'I' | 'i') {
                window.api.devTools();
            }
            if (e.ctrlKey && e.key == 'r'|'R') {
                window.api.reload();
            }
        });
    },
    mounted() {
        // 设置title
        document.title = window.api.getDescription() + ' - v' + window.api.getVersion('jsonbox');

        let txtSearch = document.getElementById('txtSearch');
        let el = document.getElementById('ta');
        el.focus();

        el.addEventListener('keydown', (e) => {
            if(!(e.key == 'Backspace' || e.key == 'Delete')) {
                return;
            }
            if(document.getSelection().toString().trim() == el.textContent.trim()) {
                console.info('all selected before delete');
                el.innerHTML = '';
            }
        });
        el.addEventListener('paste', (e) => {
            // e.preventDefault();
            if(document.getSelection().toString().trim() == el.textContent.trim()) {
                console.info('all selected before ctrl+v');
                el.innerHTML = '';
                navigator.clipboard.readText().then(text => {
                    el.textContent = text;
                    this.parse();
                });
            }
            this.parse();
        });

        document.addEventListener('keypress', (e) => {
            if (!(e.ctrlKey && e.key == 'f')) {
                return;
            }
            txtSearch.focus();
        });

        txtSearch.addEventListener('keyup', (e) => {
            if(e.key == 'Enter' || (e.shiftKey && e.key == 'Enter')) {
                let kw = txtSearch.value.trim();
                if(this.keyword.now == kw) {
                    return;
                }
                this.keyword.last = this.keyword.now;
                this.keyword.now = kw;
            }
            if(e.key == 'Enter') {
                // 向后找
                let searchText = txtSearch.value.trim();
                if(undefined == searchText || '' == searchText) {
                    console.info('clear hilight');
                    this.clearHilight();
                    return;
                }
                let textContent = el.textContent.trim();
                if(undefined == textContent || 'undefined' == textContent || '' == textContent || 0 === textContent.length) {
                    return;
                }
                this.clearHilight();
                let content = el.innerHTML;//, reg = new RegExp(searchText, 'gi');
                let reg = new RegExp('(<span class="[^"]+">)((?:(?!<\/span>).)*?)(' + searchText + ')', 'gi');
                let arr = content.match(reg), i = -1;
                if(undefined == arr || null == arr) {
                    console.info('there is no match');
                    this.match = 'match:0'
                    return;
                }
                content = content.replace(reg, '$1$2<span id="result" class="hilight">$3</span>');
                // content = content.replace(reg, (e) => {
                //     i++;
                //     return '<span id="result" class="hilight">' + arr[i] + '</span>';
                // });
                el.innerHTML = '<pre>' + content + '</pre>';
                // this.parse(content);
                this.match = 'match:' + arr.length;
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
        parse(content) {
            let el = document.getElementById('ta'), tmp;
            if(undefined == content || '' == content.trim()) {
                content = el.textContent;
            }
            try {
                // tmp = JSON.parse(el.textContent);
                tmp = eval("[" + content + "]");
            } catch (err) {
                console.error(err);
                // alert('please input valid json string==' + err);
                return;
            }
            let after = JSON.stringify(tmp, null, 4);
            after = Process(after);
            el.innerHTML = '<pre>' + after + '</pre>';
        },
        clearHilight() {
            let m = '<span id="result" class="hilight">' + this.keyword.last + '</span>'
            let el = document.getElementById('ta'), content = document.getElementById('ta').innerHTML;
            el.innerHTML = content.replaceAll(m, this.keyword.last);
            this.match = '';
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