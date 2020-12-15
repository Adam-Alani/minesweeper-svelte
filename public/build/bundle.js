
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.31.0 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (112:2) {#if state === true}
    function create_if_block_7(ctx) {
    	let h1;
    	let t1;
    	let h3;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "You Lost";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Press Enter to try again";
    			attr_dev(h1, "class", "end svelte-3jv1ug");
    			add_location(h1, file, 112, 3, 2647);
    			attr_dev(h3, "class", "end svelte-3jv1ug");
    			add_location(h3, file, 113, 3, 2681);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h3, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(112:2) {#if state === true}",
    		ctx
    	});

    	return block;
    }

    // (135:6) {:else}
    function create_else_block_2(ctx) {
    	let div;

    	function select_block_type_3(ctx, dirty) {
    		if (/*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][0] === 0) return create_if_block_5;
    		if (/*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][0] > 0) return create_if_block_6;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "lost svelte-3jv1ug");
    			add_location(div, file, 135, 7, 3606);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(135:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (120:6) {#if state === false}
    function create_if_block(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][1] === true) return create_if_block_1;
    		if (/*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][1] === "F") return create_if_block_4;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(120:6) {#if state === false}",
    		ctx
    	});

    	return block;
    }

    // (141:7) {:else}
    function create_else_block_3(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function contextmenu_handler_7() {
    		return /*contextmenu_handler_7*/ ctx[16](/*i*/ ctx[20], /*j*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell bomb svelte-3jv1ug");
    			add_location(div, file, 141, 8, 3880);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "contextmenu", prevent_default(contextmenu_handler_7), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(141:7) {:else}",
    		ctx
    	});

    	return block;
    }

    // (139:36) 
    function create_if_block_6(ctx) {
    	let div;
    	let t_value = /*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][0] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "cell num svelte-3jv1ug");
    			add_location(div, file, 139, 8, 3780);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "contextmenu", prevent_default(/*contextmenu_handler_3*/ ctx[9]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*board*/ 2 && t_value !== (t_value = /*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][0] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(139:36) ",
    		ctx
    	});

    	return block;
    }

    // (137:7) {#if board[i][j][0] === 0}
    function create_if_block_5(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell empty  svelte-3jv1ug");
    			add_location(div, file, 137, 8, 3671);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "contextmenu", prevent_default(/*contextmenu_handler_2*/ ctx[8]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(137:7) {#if board[i][j][0] === 0}",
    		ctx
    	});

    	return block;
    }

    // (131:7) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[14](/*i*/ ctx[20], /*j*/ ctx[23]);
    	}

    	function contextmenu_handler_6() {
    		return /*contextmenu_handler_6*/ ctx[15](/*i*/ ctx[20], /*j*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell hidden  svelte-3jv1ug");
    			add_location(div, file, 131, 8, 3446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", click_handler_1, false, false, false),
    					listen_dev(div, "contextmenu", prevent_default(contextmenu_handler_6), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(131:7) {:else}",
    		ctx
    	});

    	return block;
    }

    // (129:40) 
    function create_if_block_4(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[12](/*i*/ ctx[20], /*j*/ ctx[23]);
    	}

    	function contextmenu_handler_5() {
    		return /*contextmenu_handler_5*/ ctx[13](/*i*/ ctx[20], /*j*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell flag svelte-3jv1ug");
    			add_location(div, file, 129, 8, 3303);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", click_handler, false, false, false),
    					listen_dev(div, "contextmenu", prevent_default(contextmenu_handler_5), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(129:40) ",
    		ctx
    	});

    	return block;
    }

    // (121:7) {#if board[i][j][1] === true}
    function create_if_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][0] === 0) return create_if_block_2;
    		if (/*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][0] > 0) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(121:7) {#if board[i][j][1] === true}",
    		ctx
    	});

    	return block;
    }

    // (126:8) {:else}
    function create_else_block(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function contextmenu_handler_4() {
    		return /*contextmenu_handler_4*/ ctx[11](/*i*/ ctx[20], /*j*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell bomb svelte-3jv1ug");
    			add_location(div, file, 126, 9, 3151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "contextmenu", prevent_default(contextmenu_handler_4), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(126:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (124:37) 
    function create_if_block_3(ctx) {
    	let div;
    	let t_value = /*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][0] + "";
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "cell num svelte-3jv1ug");
    			add_location(div, file, 124, 9, 3049);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "contextmenu", prevent_default(/*contextmenu_handler_1*/ ctx[7]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*board*/ 2 && t_value !== (t_value = /*board*/ ctx[1][/*i*/ ctx[20]][/*j*/ ctx[23]][0] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(124:37) ",
    		ctx
    	});

    	return block;
    }

    // (122:8) {#if board[i][j][0] === 0}
    function create_if_block_2(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cell empty  svelte-3jv1ug");
    			add_location(div, file, 122, 9, 2938);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "contextmenu", prevent_default(/*contextmenu_handler*/ ctx[6]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(122:8) {#if board[i][j][0] === 0}",
    		ctx
    	});

    	return block;
    }

    // (119:5) {#each row as cell, j}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[0] === false) return create_if_block;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(119:5) {#each row as cell, j}",
    		ctx
    	});

    	return block;
    }

    // (117:3) {#each board as row, i}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*row*/ ctx[18];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "row svelte-3jv1ug");
    			add_location(div, file, 117, 4, 2778);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*board, hideCell, showCell, flagCell, state*/ 31) {
    				each_value_1 = /*row*/ ctx[18];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(117:3) {#each board as row, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div1;
    	let t2;
    	let div0;
    	let mounted;
    	let dispose;
    	let if_block = /*state*/ ctx[0] === true && create_if_block_7(ctx);
    	let each_value = /*board*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Shitty MineSweeper";
    			t1 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t2 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "game-container svelte-3jv1ug");
    			add_location(h1, file, 109, 1, 2537);
    			add_location(div0, file, 115, 2, 2739);
    			attr_dev(div1, "class", "game-container svelte-3jv1ug");
    			add_location(div1, file, 110, 1, 2590);
    			add_location(main, file, 108, 0, 2528);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*keydown_handler*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*state*/ ctx[0] === true) {
    				if (if_block) ; else {
    					if_block = create_if_block_7(ctx);
    					if_block.c();
    					if_block.m(div1, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*board, hideCell, showCell, flagCell, state*/ 31) {
    				each_value = /*board*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function generateBoard(board, [m, n], b) {
    	for (let i = 0; i < n; ++i) {
    		board[i] = [];

    		for (let j = 0; j < m; ++j) {
    			board[i][j] = [0, false];
    		}
    	}

    	let bCount = 0;

    	while (bCount < b) {
    		let x = Math.floor(Math.random() * board.length);
    		let y = Math.floor(Math.random() * board[0].length);

    		if (board[x][y][0] === 0) {
    			board[x][y][0] = -1;
    			bCount++;
    		}
    	}

    	return board;
    }

    function countNeighbours(board) {
    	const dx = [1, 1, 1, 0, 0, -1, -1, -1];
    	const dy = [1, 0, -1, 1, -1, 1, 0, -1];

    	for (let row = 0; row < board.length; row++) {
    		for (let col = 0; col < board[row].length; col++) {
    			if (board[row][col][0] === -1) {
    				for (let i = 0; i < 8; i++) {
    					let nr = row + dy[i], nc = col + dx[i];

    					if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[row].length) {
    						if (board[nr][nc][0] !== -1) {
    							board[nr][nc][0] += 1;
    						}
    					}
    				}
    			}
    		}
    	}

    	return board;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	/// ======== Setup ======== ///
    	let state = false; //While true, game runs.

    	let board = [[]];
    	board = generateBoard(board, [30, 16], 80);
    	let cellsClicked = [];
    	board = countNeighbours(board);

    	//----------------------------//
    	//--------- Commands ----------//
    	function showCell(i, j) {
    		if (board[i][j][0] === -1) {
    			$$invalidate(0, state = true);
    		}

    		$$invalidate(1, board[i][j][1] = true, board);

    		if (board[i][j][0] === 0) {
    			for (let k = -1; k <= 1; k++) {
    				for (let y = -1; y <= 1; y++) {
    					try {
    						if (board[i + k][j + y][0] !== -1 && board[i + k][j + y][1] === false) {
    							showCell(i + k, j + y);
    						}
    					} catch(msg) {
    						
    					}
    				}
    			}
    		}
    	}

    	function hideCell(i, j) {
    		$$invalidate(1, board[i][j][1] = false, board);
    	}

    	function flagCell(i, j) {
    		$$invalidate(1, board[i][j][1] = "F", board);
    	}

    	//------------------------//
    	function newGame() {
    		$$invalidate(0, state = false);
    		$$invalidate(1, board = generateBoard(board, [30, 16], 80));
    		$$invalidate(1, board = countNeighbours(board));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function contextmenu_handler(event) {
    		bubble($$self, event);
    	}

    	function contextmenu_handler_1(event) {
    		bubble($$self, event);
    	}

    	function contextmenu_handler_2(event) {
    		bubble($$self, event);
    	}

    	function contextmenu_handler_3(event) {
    		bubble($$self, event);
    	}

    	const keydown_handler = press => {
    		if (press.key == "Enter") {
    			newGame();
    		}
    	};

    	const contextmenu_handler_4 = (i, j) => {
    		hideCell(i, j);
    	};

    	const click_handler = (i, j) => {
    		showCell(i, j);
    	};

    	const contextmenu_handler_5 = (i, j) => {
    		hideCell(i, j);
    	};

    	const click_handler_1 = (i, j) => {
    		showCell(i, j);
    	};

    	const contextmenu_handler_6 = (i, j) => {
    		flagCell(i, j);
    	};

    	const contextmenu_handler_7 = (i, j) => {
    		hideCell(i, j);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		state,
    		board,
    		generateBoard,
    		cellsClicked,
    		countNeighbours,
    		showCell,
    		hideCell,
    		flagCell,
    		newGame
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    		if ("board" in $$props) $$invalidate(1, board = $$props.board);
    		if ("cellsClicked" in $$props) cellsClicked = $$props.cellsClicked;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		state,
    		board,
    		showCell,
    		hideCell,
    		flagCell,
    		newGame,
    		contextmenu_handler,
    		contextmenu_handler_1,
    		contextmenu_handler_2,
    		contextmenu_handler_3,
    		keydown_handler,
    		contextmenu_handler_4,
    		click_handler,
    		contextmenu_handler_5,
    		click_handler_1,
    		contextmenu_handler_6,
    		contextmenu_handler_7
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
