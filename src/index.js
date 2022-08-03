const app = {
    data() {},
    created() {
        document.addEventListener('keyup', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key == 'I' | 'i') {
                window.api.devTools();
            }
            if (e.ctrlKey && e.key == 'r') {
                window.api.reload();
            }
        });
    },
    mounted() {
        let txtSearch = document.getElementById('txtSearch');
        let el = document.getElementById('ta');
        el.focus();

        el.addEventListener('keydown', (e) => {
            if(!(e.key == 'Backspace' || e.key == 'Delete')) {
                return;
            }
            if(document.getSelection().toString().trim() == el.innerText.trim()) {
                console.info('all selected before delete');
                el.innerHTML = '';
            }
        });
        el.addEventListener('paste', (e) => {
            if(document.getSelection().toString().trim() == el.innerText.trim()) {
                console.info('all selected before ctrl+v');
                el.innerHTML = '';
                navigator.clipboard.readText().then(text => {
                    el.innerText = text;
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
            if(e.key == 'Enter') {
                // 着色并向后找
                let searchText = txtSearch.value.trim();
                if(undefined == searchText || '' == searchText) {
                    return;
                }
                if(undefined == el.innerText || 'undefined' == el.innerText || '' == el.innerText || 0 === el.innerText.length) {
                    return;
                }
                this.parse();   // 重置json着色内容，即可清除掉上次搜索的高亮内容

                // let content = el.innerHTML, reg = new RegExp(searchText, 'g');
                // let newHtml = content.replace(reg, '<span id="result" style="background:yellow;color:red;">' + searchText + '</span>');
                // el.innerHTML = newHtml;
                /*
                 * 由于存在用户搜索类似span这样的内容的可能，这里不能使用上面的regx方式来进行搜索高亮
                 * 这是因为上一布的this.parse()调用会在content中添加大量的代码着色，
                 * 而这些着色代码里有大量span、class等关键字，
                 * 所以这里如果用户搜索span、class这样的关键字，会造成替换掉本来看不到的html标签，进而使内容错乱
                 */
                let content = el.innerHTML;
                let i = 0;
                while(content.indexOf(searchText, i) != -1) {
                    let loc = {};
                    loc.start = content.indexOf(searchText, i);
                    // loc.end = loc.start + searchText.length  - 1;
                    if(content.slice(loc.start - 1, loc.start) == '<' || content.slice(loc.start - 2, loc.start) == '</') {
                        i = loc.start + searchText.length;
                        continue;
                    }
                    content = content.slice(0, loc.start) + '<span id="result" style="background:yellow;color:red;">' + searchText + '</span>' + content.slice(loc.start + searchText.length);

                    i = loc.start + searchText.length + 62 + 1;
                }
                el.innerHTML = content;
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
        parse() {
            let el = document.getElementById('ta');
            let tmp;
            try {
                // tmp = JSON.parse(el.innerText);
                tmp = eval("[" + el.innerText + "]");
            } catch (err) {
                console.error(err);
                alert('please input valid json string');
                return;
            }
            // console.info('========%s', tmp);
            let after = JSON.stringify(tmp, null, 4);
            after = Process(after);
            el.innerHTML = '<pre>' + after + '</pre>';
        }
    }
}
Vue.createApp(app).mount('#app');

function IsArray(obj) {
    return obj &&
        typeof obj === 'object' && typeof obj.length === 'number' && !(obj.propertyIsEnumerable('length'));
}

function Process(text) {
    // console.log(text);
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
    let html = "", comma = (addComma) ? "<span class='Comma'>,</span>": "";
    let type = typeof obj;
    if (IsArray(obj)) {
        if (obj.length == 0) {
            html += GetRow(indent, "<span class='ArrayBrace'>[]</span>" + comma, isPropertyContent);
        } else {
            html += GetRow(indent, "<span class='ArrayBrace'>[</span>", isPropertyContent);
            for (let i = 0; i < obj.length; i++) {
                html += ProcessObject(obj[i], indent + 1, i < (obj.length - 1), true, false);
            }
            html += GetRow(indent, "<span class='ArrayBrace'>]</span>" + comma);
        }
    } else {
        if (type == "object" && obj == null) {
            html += FormatLiteral("null", "", comma, indent, isArray, "Null");
        } else {
            if (type == "object") {
                let numProps = 0;
                for(let prop in obj) numProps++; 
                if (numProps == 0) {
                    html += GetRow(indent, "<span class='ObjectBrace'>{}</span>" + comma, isPropertyContent)
                } else {
                    html += GetRow(indent, "<span class='ObjectBrace'>{</span>", isPropertyContent);
                    let j = 0;
                    for (var prop in obj) {
                        html += GetRow(indent + 1, '<span class="PropertyName">"' + prop + '"</span>: ' + ProcessObject(obj[prop], indent + 1, ++j < numProps, false, true))
                    }
                    html += GetRow(indent, "<span class='ObjectBrace'>}</span>" + comma);
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