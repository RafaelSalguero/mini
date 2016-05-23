#mini
###Lightweight SPA framework

Copyright Rafael Salguero Iturrios 2016

**mini** is the smallest framework for SPA applications

Optimized for performance and minimal bootstrap time.

Mini provide:
- Dependency injection
- Binding-based dom manipullation library
- Zero boostrap overhead apart for loading the *tiny* library

Mini does not have:
- **A bootstrap method** , HTML compilation and bindings are **triggered manually**
by the programmer only on the selected element, this means that your 
app **can start immediatly** without waiting for a boostrap phase
- **Dirty checking/Change observers** HTML updates are triggered manually by the programmer, this is more verbose than automatic dirty checking but saves the costly HTML compilation phase