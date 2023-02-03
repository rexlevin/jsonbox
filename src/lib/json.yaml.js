/*!
 * 2022-10-20 by lizl6
 * MIT License
 *
 * /
/**
 * json转yaml工具
 * 
 * let yaml = new Yaml()
 * yaml.j2y(obj)
 */
;(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node. Does not work with strict CommonJS, but only CommonJS-like
		// environments that support module.exports, like Node.
		module.exports = exports = factory();
	} else {
		// Browser globals (root is window)
		root.YAML = factory();
	}
})(this, function() {
    "use strict"
    return function YAML(config) {
        config = config || {}
        let level = -1, AR = '- ', EL = '\n', CL = ': ';
        this.j2y = function(jsonObj) {
            return parse(jsonObj)
        }
        function parse(jsonObj, inArray) {
            let result = '', instance = Object.prototype.toString.call(jsonObj)
            const handlers = {
                '[object Object]': function() {
                    level++
                    Object.keys(jsonObj).forEach((x, i) => {
                        if(!(inArray && i === 0)) {
                            result += EL + tabs(level) + x + CL + parse(jsonObj[x])
                        } else {
                            result += x + CL + parse(jsonObj[x])
                        }
                    });
                    level--
                },
                '[object Array]': function() {
                    if(jsonObj.length === 0) {
                        result += '[]'
                        return result
                    }
                    level++
                    for(let a of jsonObj) {
                        result += EL + tabs(level) + AR + parse(a, true)
                    }
                    level--
                },
                '[object String]': function() {
                    result += jsonObj
                },
                '[object Number]': function() {
                    result += jsonObj
                },
                '[object Date]': function() {
                    result += jsonObj
                },
                '[object Boolean]': function() {
                    result += jsonObj ? "true" : "false"
                },
                '[object Undefined]': function() {
                    result += 'null'
                },
                '[object Null]': function() {
                    result += 'null'
                }
            }

            handlers[instance](jsonObj)
            return result
        }
        function tabs(n) {
            let chars = ''
            for(let i = 0; i < n; i++) {
                chars += '  '
            }
            return chars;
        }
    }
});