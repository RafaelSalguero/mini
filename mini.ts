export interface IProvider {
    /**Return a new instance of a given service when the service is registered, 
     * if the service is already registered this method completes immediatly */
    onceNew(name: string, OnComplete: (instance: IServiceInstance) => void): void;

    /**Returnan instance of a given service, if the instance already exists, return the existing instance 
     * if the service is already registered this method completes immediatly */
    onceSingle(name: string, OnComplete: (instance: IServiceInstance) => void): void;


    /**register a service */
    register(name: string, factory: IService, dependencies: string[]): void;
}

/**A service constructor */
export interface IService {
    new (...args: any[]): IServiceInstance;
}

export interface IServiceInstance {
    /**executed when the element is attached on an html element*/
    open?(element?: HTMLElement): void;
    /**executed when the element is detached from an html element*/
    close?(element?: HTMLElement): void;
}
/**A service instance */
export interface IControllerInstance extends IServiceInstance {
    /**executed when the element is attached on an html element*/
    open(element?: HTMLElement): void;
    /**executed when the element is detached from an html element*/
    close(element?: HTMLElement): void;
}

/**a constructor function with all its dependencies annotated */
interface IAnotatedConstructor {
    /**function that takes dependencies and return an instance of a service */
    constructor: IService;
    /**dependency list */
    dependencies: string[];
}


export interface ICookies {
    set(name: string, value: string);
    get(name: string): string;
    remove(name: string);
}

/**
 * coockie service
 */
export class cookies {
    set(name: string, value: string, expireDays?: number) {
        expireDays = expireDays || 360;

        var d = new Date();
        d.setTime(d.getTime() + (expireDays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + "; " + expires;
    }
    get(name: string): string {
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
    }
    remove(name: string) {
        this.set(name, "", -1);
    }
}

export class Provider implements IProvider {
    constructor() {
    }

    /**relate provider name with constructor function */
    providers: { [Name: string]: IAnotatedConstructor } = {};
    /**provides a singleton cache */
    cache: { [Name: string]: any } = {};

    /**functions that will be called when the given service is registered */
    onListeners: { [name: string]: () => void } = {};

    getSingleton(name: string, locals?: any) {
        //the service was instantiated before:
        if (this.cache[name])
            return this.cache[name];

        return (this.cache[name] = this.getNew(name, locals));
    }

    getNew(name: string, locals?: any) {
        //first time:
        var prov = this.providers[name];
        if (!prov) {
            throw "the provider for '" + name + "' was not found";

        }
        return (this.invoke(prov.constructor, prov.dependencies, locals));
    }

    onceNew(name: string, OnComplete: (instance: IServiceInstance) => void): void {
        if (this.providers[name]) {
            OnComplete(this.getNew(name));
        } else {
            this.onListeners[name] = () => {
                OnComplete(this.getNew(name));
            };
        }
    }

    onceSingle(name: string, OnComplete: (instance: IServiceInstance) => void): void {
        if (this.providers[name]) {
            OnComplete(this.getSingleton(name));
        } else {
            this.onListeners[name] = () => {
                OnComplete(this.getSingleton(name));
            };
        }
    }

    private static construct(constructor: Function, args: any[]): any {
        var F: any = function (args) {
            return constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;
        var ret = new F(args);
        return ret;
    }

    invoke(service: Function, dependencies: string[], locals: any) {
        locals = locals || {};
        //resolve function dependencies:
        var deps = dependencies.map(s => locals[s] || this.getSingleton(s, locals));
        var ret = Provider.construct(service, deps);
        return ret;
    }

    register(name: string, factory: IService, dependencies: string[]) {
        this.providers[name] = { constructor: factory, dependencies: dependencies };
        if (this.onListeners[name]) {
            this.onListeners[name]();
            this.onListeners[name] = null;
        }
    }
}
