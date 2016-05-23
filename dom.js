define(["require", "exports", "./http"], function (require, exports, Http) {
    "use strict";
    /**a binding that allows an element to be duplicated */
    var repeater = (function () {
        /**Create a new repeater bindingh
         * @params source the original hidden element that will be repeated
         * @params hideClass the name of the class that hides the element and that will be removed when added a new item. Default is 'hide'
         */
        function repeater(source, hideClass) {
            hideClass = hideClass || "hide";
            this.parent = source.parentElement;
            this.hideClass = hideClass;
            this.sourceBinding = new compiler(source);
            this.lastElement = source;
            //get the index of the source element:
            for (var sourceIndex = 0, e = source; e = e.previousSibling; ++sourceIndex)
                ;
            this.firstElementIndex = sourceIndex + 1;
        }
        /**Add a new element to the DOM with the given scope. Returns the newly created compiled element,
         * return a function that updates the created element
         */
        repeater.prototype.push = function (scope) {
            var NewNode = this.sourceBinding.clone();
            NewNode.el.classList.remove(this.hideClass);
            NewNode.update(scope);
            this.parent.insertBefore(NewNode.el, this.lastElement.nextSibling);
            this.lastElement = NewNode.el;
            this.count++;
            return function () { return NewNode.update(scope); };
        };
        /**remove all added DOM elements */
        repeater.prototype.clear = function () {
            for (var i = this.firstElementIndex; i < this.firstElementIndex + this.count; i++) {
                this.parent.removeChild(this.parent.childNodes.item(this.firstElementIndex));
            }
            this.lastElement = this.sourceBinding.el;
            this.count = 0;
        };
        return repeater;
    }());
    exports.repeater = repeater;
    /**contains the methods for binding to an element,
     * the element can be changed without regenerating getter and setter functions
     */
    var compiledElementBinding = (function () {
        function compiledElementBinding() {
        }
        /**update a binding */
        compiledElementBinding.prototype.update = function (scope, element) {
            var newSettedData;
            this.setter(newSettedData = this.getter(scope, element), this.el, this.lastSettedData);
            this.lastSettedData = newSettedData;
        };
        /**convert an expression to a function that evaluates that expression
         * on a given scope.
         *
         * The scope is accesible as the 's' variable.
         * The current element equal to the 'e' variable
         */
        compiledElementBinding.expressionToFunc = function (expr) {
            //for each scope key, add an argument to a function declaration:
            return function (scope, element) {
                var identity = expr;
                try {
                    var evalFunc = compiledElementBinding.expressionToFuncCache[identity] ||
                        (compiledElementBinding.expressionToFuncCache[identity] =
                            (eval("(function(s, e) { return " + expr + "; })")));
                }
                catch (error) {
                    throw "error parsing '" + expr;
                }
                try {
                    return evalFunc(scope, element);
                }
                catch (error) {
                    return null;
                }
            };
        };
        /**Binds to the text content of a given element
         * where the path is on the mi-text attribute
        */
        compiledElementBinding.TextContentBinding = function (el, value) {
            var path = value;
            var ret = new compiledElementBinding();
            ret.getter = compiledElementBinding.expressionToFunc(path);
            ret.setter = function (value, el) { return el.textContent = value; };
            ret.el = el;
            return ret;
        };
        /**Binds to the text content of a given element
         * where the path is on the mi-text attribute
        */
        compiledElementBinding.ClassBinding = function (el, value) {
            var path = value;
            var ret = new compiledElementBinding();
            ret.getter = compiledElementBinding.expressionToFunc(path);
            ret.setter = function (value, el, lastSettedData) {
                var lastClasses = (lastSettedData + "").split(" ");
                //Delete all last setted classes:
                lastClasses.forEach(function (element) {
                    if (element)
                        el.classList.remove(element);
                });
                //add the classes:
                var newClasses = (value || "").split(" ");
                for (var i = 0; i < newClasses.length; i++) {
                    if (newClasses[i])
                        el.classList.add(newClasses[i]);
                }
            };
            ret.el = el;
            return ret;
        };
        /**Binds to an element event*/
        compiledElementBinding.EventBinding = function (el, value, event) {
            var path = value;
            var ret = new compiledElementBinding();
            ret.getter = function (scope) { return ({ scope: scope, func: compiledElementBinding.expressionToFunc(path) }); };
            ret.setter = function (value, el) { return el[event] =
                function () { return value.func(value.scope, el); }; };
            ret.el = el;
            return ret;
        };
        /**Binds to the onclick event*/
        compiledElementBinding.ClickBinding = function (el, value) {
            return compiledElementBinding.EventBinding(el, value, 'onclick');
        };
        /**Binds to the onchange event*/
        compiledElementBinding.ChangeBinding = function (el, value) {
            return compiledElementBinding.EventBinding(el, value, 'onchange');
        };
        /**Binds to the text content of a given element
    * where the path is on the mi-text attribute
    */
        compiledElementBinding.SrcBinding = function (el, value) {
            var path = value;
            var ret = new compiledElementBinding();
            ret.getter = compiledElementBinding.expressionToFunc(path);
            ret.setter = function (value, el) {
                //if value is null, set a transparent 1x1 gif
                if (value) {
                    el.classList.remove("hide");
                    el.src = value;
                }
                else {
                    el.classList.add("hide");
                }
            };
            ret.el = el;
            return ret;
        };
        /**Binds to the style of an element with the sintax:
         * property:path;property:path...
    */
        compiledElementBinding.StyleBinding = function (el, value) {
            var path = value;
            var ret = new compiledElementBinding();
            ret.getter = compiledElementBinding.expressionToFunc(path);
            ret.setter = function (value, el) {
                if (value) {
                    el.src = value;
                }
            };
            ret.el = el;
            return ret;
        };
        compiledElementBinding.expressionToFuncCache = {};
        return compiledElementBinding;
    }());
    var compiler = (function () {
        /**Compile an element returning all its bindings which can be later applied using the update function */
        function compiler(el, bindings, shallow) {
            this.el = el;
            if (bindings != null) {
                this.bindings = bindings;
            }
            else {
                var ret = [];
                compiler.directives.forEach(function (element) {
                    var attributeName = element[0];
                    var func = element[1];
                    //check for parent bindings:
                    if (el.getAttribute(attributeName) != null) {
                        ret.push(func(el, el.getAttribute(attributeName)));
                    }
                    if (!shallow) {
                        //check for child bindings:
                        var query = el.querySelectorAll("[" + element[0] + "]");
                        for (var i = 0; i < query.length; i++) {
                            ret.push(func(query.item(i), query.item(i).getAttribute(element[0])));
                        }
                    }
                });
                this.bindings = ret;
            }
        }
        /**clone the element with the same bindings */
        compiler.prototype.clone = function () {
            var el = this.el.cloneNode(true);
            return new compiler(el);
        };
        compiler.prototype.update = function (scope) {
            var _this = this;
            this.bindings.forEach(function (x) { return x.update(scope, _this.el); });
        };
        compiler.directives = [
            ["mi-text", compiledElementBinding.TextContentBinding],
            ["mi-click", compiledElementBinding.ClickBinding],
            ["mi-src", compiledElementBinding.SrcBinding],
            ["mi-class", compiledElementBinding.ClassBinding],
            ["mi-change", compiledElementBinding.ChangeBinding],
        ];
        return compiler;
    }());
    exports.compiler = compiler;
    /**provide low level DOM manipullation methods */
    var DOM = (function () {
        function DOM() {
            /**html content in memory cache */
            this.cache = {};
        }
        DOM.prototype.preload = function (url) {
            var _this = this;
            Http.Http(url, "GET", null, function (result) {
                _this.cache[url] = result;
            });
        };
        /**include an html body inside container element
         * @param element The container element
         * @param url The html url
         */
        DOM.prototype.includeUrl = function (element, url, OnComplete) {
            var _this = this;
            var cacheValue = this.cache[url];
            if (cacheValue) {
                element.innerHTML = cacheValue;
                if (OnComplete)
                    OnComplete();
            }
            else {
                Http.Http(url, "GET", null, function (result) {
                    _this.cache[url] = result;
                    element.innerHTML = result;
                    if (OnComplete)
                        OnComplete();
                });
            }
        };
        return DOM;
    }());
    exports.DOM = DOM;
});
