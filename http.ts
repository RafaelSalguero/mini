
 class Http {
    static Http(url: string, method: string, body: any, OnComplete?: (result: any) => void) {
        var req = new XMLHttpRequest();
        req.open(method, url, true);
        req.send(body);
        req.onreadystatechange = ev => {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    if (OnComplete)
                        OnComplete(req.response);
                } else {
                    console.error("error loading " + url);
                }
            }
        };
    }
}

export = Http;