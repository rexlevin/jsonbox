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
        let el = document.getElementById('ta');
        el.focus();
        // el.addEventListener('change', () => {
        //     if(undefined == el.value || '' == el.value.trim()) return;
        //     this.parse();
        // });
        el.addEventListener('keyup', (e) => {
            if (!(e.ctrlKey && e.key == 'v')) {
                return;
            }
            this.parse();
        });
        // el.addEventListener('paste', (e) => {
        //     e.preventDefault(); // 阻止默认的粘贴事件
        //     let data = e.clipboardData || window.clipboardData;
        //     console.info('====paste=====' + data.types + '====' + data.getData('text'));
        //     let tmp;
        //     try {
        //         tmp = JSON.parse(data.getData('text'));
        //     } catch(err) {
        //         alert('please input a valid json string');
        //         return;
        //     }
        //     let after = JSON.stringify(tmp, null, 4);
        //     console.info('========' + after);
        //     el.value = after;
        //     return;
        // });
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
        let obj = eval("[" + text + "]");
        html = ProcessObject(obj[0], 0, false, false, false);
        return html;
    } catch (e) {}
}

function ProcessObject(obj, indent, addComma, isArray, isPropertyContent) {
    let html = "", comma = (addComma) ? "<span class='Comma'>,</span> ": "";
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
                let numProps = (undefined == obj || null == obj) ? 0 : obj.length;
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