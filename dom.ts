import Http = require("./http");


export interface IDOM {
    /**include an html body inside container element
     * @param element The container element
     * @param url The html url
     */
    includeUrl(element: HTMLElement, url: string, OnComplete?: () => void): void;

    /**launch an ajax request for the given url and store it on the in memory cache */
    preload(url: string);
}

/**a binding that allows an element to be duplicated */
export class repeater {
    /**parent element */
    private parent: Element;
    /**A class that will be removed from source when added a new item */
    private hideClass: string;

    /**Last element on the list, starts with the original element */
    private lastElement: Element;
    /**number of added elements */
    private count: number;
    /**index of the first element on the parent collection */
    private firstElementIndex: number;

    private sourceBinding: compiler;

    /**Create a new repeater bindingh
     * @params source the original hidden element that will be repeated
     * @params hideClass the name of the class that hides the element and that will be removed when added a new item. Default is 'hide'
     */
    constructor(source: Element, hideClass?: string) {
        hideClass = hideClass || "hide";

        this.parent = source.parentElement;
        this.hideClass = hideClass;

        this.sourceBinding = new compiler(source);
        this.lastElement = source;

        //get the index of the source element:
        for (var sourceIndex = 0, e = source; e = <Element>e.previousSibling; ++sourceIndex);
        this.firstElementIndex = sourceIndex + 1;
    }

    /**Add a new element to the DOM with the given scope. Returns the newly created compiled element,
     * return a function that updates the created element
     */
    push(scope: any): () => void {
        var NewNode = this.sourceBinding.clone();
        NewNode.el.classList.remove(this.hideClass);
        NewNode.update(scope);

        this.parent.insertBefore(NewNode.el, this.lastElement.nextSibling);
        this.lastElement = NewNode.el;
        this.count++;
        return () => NewNode.update(scope);
    }

    /**remove all added DOM elements */
    clear(): void {
        for (var i = this.firstElementIndex; i < this.firstElementIndex + this.count; i++) {
            this.parent.removeChild(this.parent.childNodes.item(this.firstElementIndex));
        }
        this.lastElement = this.sourceBinding.el;
        this.count = 0;
    }
}

/**contains the methods for binding to an element, 
 * the element can be changed without regenerating getter and setter functions
 */
class compiledElementBinding {
    /**The element that will be modified when the value changes */
    el: Element;

    getter: (scope: any, element: Element) => any;

    /**A function that sets the given value on the correct element property */
    setter: (value: any, element: Element, lastSettedData: any) => void;

    lastSettedData: any;

    /**update a binding */
    update(scope: any, element: Element) {
        var newSettedData;
        this.setter(newSettedData = this.getter(scope, element), this.el, this.lastSettedData);
        this.lastSettedData = newSettedData;
    }

    static expressionToFuncCache: {
        [argsPlusExpr: string]: Function
    } = {};

    /**convert an expression to a function that evaluates that expression
     * on a given scope.
     * 
     * The scope is accesible as the 's' variable.
     * The current element equal to the 'e' variable
     */
    static expressionToFunc(expr: string): (scope: any, Element: Element) => any {
        //for each scope key, add an argument to a function declaration:
        return (scope, element) => {
            var identity = expr;
            try {
                var evalFunc: Function =
                    compiledElementBinding.expressionToFuncCache[identity] ||
                    (
                        compiledElementBinding.expressionToFuncCache[identity] =
                        (
                            eval(
                                `(function(s, e) { return ${expr}; })`)));
            } catch (error) {
                throw "error parsing '" + expr;

            }
            try {
                return evalFunc(scope, element);
            } catch (error) {
                return null;
            }
        };
    }

    /**Binds to the text content of a given element 
     * where the path is on the mi-text attribute 
    */
    static TextContentBinding(el: Element, value: string): compiledElementBinding {
        var path = value
        var ret = new compiledElementBinding();
        ret.getter = compiledElementBinding.expressionToFunc(path);
        ret.setter = (value, el) => el.textContent = value;
        ret.el = el;

        return ret;
    }


    /**Binds to the text content of a given element 
     * where the path is on the mi-text attribute 
    */
    static ClassBinding(el: Element, value: string): compiledElementBinding {
        var path = value
        var ret = new compiledElementBinding();
        ret.getter = compiledElementBinding.expressionToFunc(path);
        ret.setter = (value, el, lastSettedData) => {
            var lastClasses = (lastSettedData + "").split(" ");
            //Delete all last setted classes:
            lastClasses.forEach(element => {
                if (element)
                    el.classList.remove(element);
            });

            //add the classes:
            var newClasses = (value || "").split(" ");
            for (var i = 0; i < newClasses.length; i++) {
                if (newClasses[i])
                    el.classList.add(newClasses[i]);
            }
        }
        ret.el = el;

        return ret;
    }


    /**Binds to an element event*/
    static EventBinding(el: Element, value: string, event: string): compiledElementBinding {
        var path = value;

        var ret = new compiledElementBinding();
        ret.getter = (scope) => ({ scope: scope, func: compiledElementBinding.expressionToFunc(path) });
        ret.setter = (value, el) => (<HTMLButtonElement>el)[event] =
            () => value.func(value.scope, el);

        ret.el = el;

        return ret;
    }


    /**Binds to the onclick event*/
    static ClickBinding(el: Element, value: string): compiledElementBinding {
        return compiledElementBinding.EventBinding(el,value, 'onclick');
    }
    
    /**Binds to the onchange event*/
    static ChangeBinding(el: Element, value: string): compiledElementBinding {
        return compiledElementBinding.EventBinding(el,value, 'onchange');
    }

    /**Binds to the text content of a given element 
* where the path is on the mi-text attribute 
*/
    static SrcBinding(el: Element, value: string): compiledElementBinding {
        var path = value;

        var ret = new compiledElementBinding();
        ret.getter = compiledElementBinding.expressionToFunc(path);
        ret.setter = (value, el) => {
            //if value is null, set a transparent 1x1 gif
            if (value) {
                (<HTMLImageElement>el).classList.remove("hide");
                (<HTMLImageElement>el).src = value;
            } else {
                (<HTMLImageElement>el).classList.add("hide");
            }
        }

        ret.el = el;

        return ret;
    }

    /**Binds to the style of an element with the sintax:
     * property:path;property:path... 
*/
    static StyleBinding(el: Element, value: string): compiledElementBinding {
        var path = value;

        var ret = new compiledElementBinding();
        ret.getter = compiledElementBinding.expressionToFunc(path);
        ret.setter = (value, el) => {
            if (value) {
                (<HTMLImageElement>el).src = value;
            }
        }

        ret.el = el;

        return ret;
    }
}

export class compiler {
    static directives: { [0]: string, [1]: (el: Element, value: string) => compiledElementBinding }[] =
    [
        ["mi-text", compiledElementBinding.TextContentBinding],
        ["mi-click", compiledElementBinding.ClickBinding],
        ["mi-src", compiledElementBinding.SrcBinding],
        ["mi-class", compiledElementBinding.ClassBinding],
        ["mi-change", compiledElementBinding.ChangeBinding],
    ];

    /**Compile an element returning all its bindings which can be later applied using the update function */
    constructor(el: Element, bindings?: compiledElementBinding[], shallow?: boolean) {
        this.el = el;
        if (bindings != null) {
            this.bindings = bindings;
        }
        else {
            var ret = [];

            compiler.directives.forEach(element => {
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


    el: Element;
    bindings: compiledElementBinding[];

    /**clone the element with the same bindings */
    clone(): compiler {
        var el = <Element>this.el.cloneNode(true);
        return new compiler(el);
    }

    update(scope: any): void {
        this.bindings.forEach(x => x.update(scope, this.el));
    }
}



/**provide low level DOM manipullation methods */
export class DOM implements IDOM {
    /**html content in memory cache */
    private cache: { [url: string]: string } = {};

    preload(url: string): void {
        Http.Http(url, "GET", null, result => {
            this.cache[url] = result;
        });
    }

    /**include an html body inside container element
     * @param element The container element
     * @param url The html url
     */
    includeUrl(element: HTMLElement, url: string, OnComplete?: () => void): void {
        var cacheValue = this.cache[url];
        if (cacheValue) {
            element.innerHTML = cacheValue;
            if (OnComplete)
                OnComplete();
        } else {
            Http.Http(url, "GET", null, result => {
                this.cache[url] = result;
                element.innerHTML = result;

                if (OnComplete)
                    OnComplete();
            })
        }
    }
}