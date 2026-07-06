/*global Ultraviolet*/
// self.__frostBare is set by sw.js from the ?bare= query param at register time.
// On the page (non-SW) we fall back to localStorage so proxify() works without a SW.
self.__uv$config = {
    prefix: '/service/',
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    bare:
        self.__frostBare ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('frostos-bare')) ||
        'https://tomp.io/bare-server/',
};
