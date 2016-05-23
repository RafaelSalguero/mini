define(["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * coockie service
     */
    var cookies = (function () {
        function cookies() {
        }
        cookies.prototype.set = function (name, value, expireDays) {
            expireDays = expireDays || 360;
            var d = new Date();
            d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = name + "=" + value + "; " + expires;
        };
        cookies.prototype.get = function (name) {
            var name = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return null;
        };
        cookies.prototype.remove = function (name) {
            this.set(name, "", -1);
        };
        return cookies;
    }());
    exports.cookies = cookies;
    var Provider = (function () {
        function Provider() {
            /**relate provider name with constructor function */
            this.providers = {};
            /**provides a singleton cache */
            this.cache = {};
            /**functions that will be called when the given service is registered */
            this.onListeners = {};
        }
        Provider.prototype.getSingleton = function (name, locals) {
            //the service was instantiated before:
            if (this.cache[name])
                return this.cache[name];
            return (this.cache[name] = this.getNew(name, locals));
        };
        Provider.prototype.getNew = function (name, locals) {
            //first time:
            var prov = this.providers[name];
            if (!prov) {
                throw "the provider for '" + name + "' was not found";
            }
            return (this.invoke(prov.constructor, prov.dependencies, locals));
        };
        Provider.prototype.onceNew = function (name, OnComplete) {
            var _this = this;
            if (this.providers[name]) {
                OnComplete(this.getNew(name));
            }
            else {
                this.onListeners[name] = function () {
                    OnComplete(_this.getNew(name));
                };
            }
        };
        Provider.prototype.onceSingle = function (name, OnComplete) {
            var _this = this;
            if (this.providers[name]) {
                OnComplete(this.getSingleton(name));
            }
            else {
                this.onListeners[name] = function () {
                    OnComplete(_this.getSingleton(name));
                };
            }
        };
        Provider.construct = function (constructor, args) {
            var F = function (args) {
                return constructor.apply(this, args);
            };
            F.prototype = constructor.prototype;
            var ret = new F(args);
            return ret;
        };
        Provider.prototype.invoke = function (service, dependencies, locals) {
            var _this = this;
            locals = locals || {};
            //resolve function dependencies:
            var deps = dependencies.map(function (s) { return locals[s] || _this.getSingleton(s, locals); });
            var ret = Provider.construct(service, deps);
            return ret;
        };
        Provider.prototype.register = function (name, factory, dependencies) {
            this.providers[name] = { constructor: factory, dependencies: dependencies };
            if (this.onListeners[name]) {
                this.onListeners[name]();
                this.onListeners[name] = null;
            }
        };
        return Provider;
    }());
    exports.Provider = Provider;
});
