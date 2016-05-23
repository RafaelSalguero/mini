#mini
###Lightweight SPA framework

Copyright Rafael Salguero Iturrios 2016

**Mini** is the smallest framework for SPA applications

Use mini on **performance critical** applications

Mini is harder to use than angular but provides a **5 to 10 times performance increment**, your app boots immediatly

Mini provide:
- Dependency injection
- Binding-based dom manipullation library
- JavaScript expressions embeded on html
- Zero boostrap overhead apart for loading the *tiny* library

Mini does not have:
- **A bootstrap method** , HTML compilation and bindings are **triggered manually**
by the programmer only on the selected element, this means that your 
app **can start immediatly** without waiting for a boostrap phase
- **Dirty checking/Change observers** HTML updates are triggered manually by the programmer, this is more verbose than automatic dirty checking but saves the costly HTML compilation phase
