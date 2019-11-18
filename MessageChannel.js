/**
 * Represents a message target that can receive and post messages
 * @typedef {{ addEventListener: Function, postMessage: Function, removeEventListener: Function }} IMessageTarget
 */

export class MessageChannel {

    /**
     * @param {IMessageTarget} messageTarget The target that will be sending & receiving messages
     */
    constructor(messageTarget) {
        if (!this._validateMessageTarget(messageTarget))
            throw new ReferenceError('message Target does not have required fields');

        /**
         * @type {IMessageTarget}
         * @description the target which will be sending & receiving messages
         * @private
         */
        this._messageTarget = messageTarget;

        /**
         * @type {Object.<string, Array<Function>>}
         * @description Registered handles
         * @private
         */
        this._handles = {};

        this._messageTarget.addEventListener('message', this._messageHandler.bind(this));
    }

    /**
     * Register a handler function to be called when a message is delivered to a specific channel.
     * @param {string} channel The channel to register the handler against.
     * @param {Function} handler The handler function to execute when a channelled message is raised.
     */
    on(channel, handler) {
        if (!channel)
            throw new ReferenceError('Expected to receive channel');
        if (!(handler instanceof Function))
            throw new ReferenceError('Expected to receive handler');

        if (!(channel in this._handles))
            this._handles[channel] = [];

        if (this._handles[channel].includes(handler))
            return;

        this._handles[channel].push(handler);
    }

    /**
     * Remove a registered a handler function from a specific channel.
     * @param {string} channel The channel to remove the handler from.
     * @param {Function} handler The handler function to be removed.
     */
    off(channel, handler) {
        if (!channel)
            throw new ReferenceError('Expected to receive channel');
        if (!(handler instanceof Function))
            throw new ReferenceError('Expected to receive handler');

        if (!(channel in this._handles))
            return;

        const index = this._handles[channel].indexOf(handler);

        if (index === -1)
            return;

        this._handles[channel].splice(index, 1);
    }

    /**
     * Remove all registered handlers to a specific channel
     * @param {string} channel The channel to remove all handlers from
     */
    removeAllHandlers(channel) {
        if (!channel)
            throw new ReferenceError('Expected to receive channel');

        delete this._handles[channel];
    }

    /**
     * Trigger handlers registered to a specific channel. Optionally passing a payload.
     * @param {string} channel The channel to emit the message against
     * @param {any} payload The option data o be passed to the registered handler functions.
     */
    emit(channel, payload) {
        if (!channel)
            throw new ReferenceError('Expected to receive channel');

        if (!(channel in this._handles))
            throw new ReferenceError('Channel not registered');

        this._messageTarget.postMessage({
            channel,
            payload
        });
    }

    /**
     * Used when disposing of either the MessageChannel instance or the MessageTarget the MessageChannel was constructed with.
     * --Failing to dispose can cause memory leaks--
     */
    dispose() {
        this._messageTarget.removeEventListener('message', this._messageHandler);
        this._handles = {};
    }

    /**
     * Validates that the message target conforms to required shape
     * @param {IMessageTarget} messageTarget 
     * @returns {boolean} Indicating if the messageTarget is valid.
     * @private
     */
    _validateMessageTarget(messageTarget) {
        return ('postMessage' in messageTarget) && ('addEventListener' in messageTarget) && ('removeEventListener' in messageTarget);
    }

    /**
     * The single message event handler registered to the message event.
     * It manages finding and executing the handlers bound to a specific channel.
     * @param { MessageEvent } e 
     * @private
     */
    _messageHandler(e) {
        const {
            channel,
            payload
        } = e.data;

        const handles = this._handles[channel] || [];

        handles.forEach(h => h(payload));
    }
}