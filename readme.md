#mini
###Lightweight SPA framework

Copyright Rafael Salguero Iturrios 2016

**Mini** is the smallest framework for SPA applications

Use mini on **performance critical** applications

Mini is harder to use than angular but provides a **5 to 10 times performance increment**, your app boots immediatly

Mini provide:
- **Dependency injection** Create services and controllers, instantiate controllers by name with all its dependencies resolved
- **Binding-based DOM manipullation library** Angular like bindings between HTML and plain JavaScript objects
- **JavaScript expressions embeded on html** Use JavaScript expressions on bindings just like Angular
- **Zero boostrap overhead apart for loading the *tiny* library** Mini does not need any kind of bootstrapping
- **Uninstrusive binding sintax** Binding sintax does not modify the apparence of your page, so the user will never see a `{{ctrl.my.variable}}` label just before the HTML compilation 

Mini does not have:
- **A bootstrap method** , HTML compilation and bindings are **triggered manually**
by the programmer only on the selected element, this means that your 
app **can start immediatly** without waiting for a boostrap phase
- **Dirty checking/Change observers** HTML updates are triggered manually by the programmer, this is more verbose than automatic dirty checking but saves the costly HTML compilation phase
