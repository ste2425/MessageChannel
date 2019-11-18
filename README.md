# MessageChannel
Implementation of channels on-top of a subset of [Message Events](https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent)

A common architecture design when communicating between different components is to post messages. These components have the ability to register to a message event. They then implement a `postMessage` function to emit a message event.

This includes:

* Cross-document communication
* Web Workers
* Broadcast Channel

It is compatible with anything that has the following shape:

``` ts
interface {
    addEventListener: Function;
    postMessage: Function;
    removeEventListener: Function;
}
```

> **Vital Memory Leak Consideration** It is vital the [section on potential memory leaks](#Memory-Leaks) is read and understood


The core problem is a single low level message with no context. If you wish to distinguish one message from another, say a save message vs a delete message that has to be done in user code.

MessageChannel is an attempted solution, it provides a layer on top. This layer allows registering of handlers to specific channels and emitting data to those channels.

# Examples

### Cross-document

``` js
    const hostChannel = new MessageChannel(window);

    const childWindow = window.open('');

    const childChannel = new MessageChannel(childWindow);


    hostChannel.on('response', (data) => console.log('Response', data));

    childChannel.on('send', (data) => {
        console.log('Send', data);
        hostChannel.emit('response', data + 10);
    }); 

    childChannel.emit('send', 15);

    /*
        Results in:
        Send 15
        Response 25
    */
```

### Broadcast Channel

``` js
// CONTEXT A
    const channel = new MessageChannel(new BroadcastChannel('myChannel'));
    
    channel.on('messageA', (data) => console.log('Message A received', data));
    
    channel.on('messageB', (data) => console.log('Message B received', data));
```


``` js
// CONTEXT B
    const channel = new MessageChannel(new BroadcastChannel('myChannel'));
    
    channel.emit('messageA', 10);

    channel.emit('messageB', {
        prop: 20
    });
```

# Memory Leaks

TL:DR - Always remove channel handlers when no longer needed.

TL:DR - Always dispose of the Message Channel instance by calling `MessageChannel.dispose` when the message target is no longer required.

Please heed the following potential memory leak paths:

* Message Channel keeps a reference to the message target it is creating channels on top of. This means it cannot live for longer than that target. If it does the message target will not be garbage collected, even if your code drops all other references to it.
* Message Channel keeps a reference to every handler registered against it. If your code drops all references to a handler but it is not removed from the Message Channel instance it will not be garbage collected. Worse it could still be executed.
  * For that reason it is strongly advised *not* to register inline anonymous functions. Only a function reference can be used to remove a handler.