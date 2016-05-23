define(["require", "exports"], function (require, exports) {
    "use strict";
    var Http = (function () {
        function Http() {
        }
        Http.Http = function (url, method, body, OnComplete) {
            var req = new XMLHttpRequest();
            req.open(method, url, true);
            req.send(body);
            req.onreadystatechange = function (ev) {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        if (OnComplete)
                            OnComplete(req.response);
                    }
                    else {
                        console.error("error loading " + url);
                    }
                }
            };
        };
        return Http;
    }());
    return Http;
});
