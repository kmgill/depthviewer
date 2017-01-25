var clone = function(object)
{
    if (typeof object !== "object") {
        return object;
    }

    var cloned;

    if (object instanceof Array) {
        cloned = new Array();
        for (var i = 0; i < object.length; i++) {
            cloned.push(clone(object[i]));
        }
    } else {
        cloned = {};
        for(var key in object) {
            cloned[key] = clone(object[key]);
        };
    }

    return cloned;
};

/** A best-effort attempt to convert a string to an intended data type when the intended type may not be known.
 * Returns the supplied parameter as-is if the type cannot be determined as anything other than a string.
 *
 */
var stringToDataType = function(v) {
    if (/^true$/.test(v))
        return true;
    else if (/^false$/.test(v))
        return false;
    else if (/^-?\d+\.?\d*$/.test(v))
        return parseFloat(v);
    else if (/\,/.test(v)) {
        var a = v.split(",");
        var list = [];
        for (var i = 0; i < a.length; i++) {
            list.push(stringToDataType(a[i]));
        }
        return list;
    } else {
        v = v.replace(/%20/g, " ");
        return v;
    }
}

var AppEnv = {

    getUrlVars: function() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },

    getUrlVar: function(name, defaultValue) {
        var v = AppEnv.getUrlVars()[name];
        if (v === undefined) {
            return defaultValue;
        } else {
            return stringToDataType(v);
        }
    }

};


var NavigationController = function(appConfig) {

    var configs = [appConfig];

    var initialUrl = document.location.href.split(/[?#]/)[0];

    var navListeners = [];

    var enabled = true;

    window.onpopstate = function(event) {
        if (event.state) {
            fireNavigationListener(event.state);
        }
    };

    function setEnabled(e) {
        enabled = e;
    }

    function isEnabled() {
        return enabled;
    }

    function buildQueryString() {
        var qs = "#";

        for (var i = 0; i < configs.length; i++) {
            var config = configs[i];
            for (var name in config) {
                var value = config[name];
                qs += name + "=" + value + "&";
            }
        }

        return qs;
    }

    function buildState() {

        var state = clone(appConfig);
        return state;
    }


    function pushState() {
        if (!enabled) {
            return;
        }
        var title = "";
        var stateObj = buildState();
        var query = buildQueryString();
        window.history.pushState(stateObj, title, initialUrl + query);
    };

    function fireNavigationListener(state) {
        for (var i = 0; i < navListeners.length; i++) {
            navListeners[i](state);
        }
    };

    function addNavigationListener(listener) {
        navListeners.push(listener);
    };

    function addConfig(config) {
        configs.push(config);
    };

    return {
        setEnabled : setEnabled,
        isEnabled : isEnabled,
        pushState : pushState,
        addConfig : addConfig,
        addNavigationListener : addNavigationListener

    };

};
