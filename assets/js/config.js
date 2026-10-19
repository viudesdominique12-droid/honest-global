/* Site configuration.
   formEndpoint: the address every form posts to (for example a Formspree form URL,
   https://formspree.io/f/xxxxxxxx). While it is empty, forms validate but do not send.
   Every page carries a Content-Security-Policy that only lets forms reach https://formspree.io:
   if another service is chosen, replace that address in connect-src and form-action on every page. */
window.HG_CONFIG = {
    formEndpoint: ''
};
